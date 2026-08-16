import { describe, expect, it } from 'vitest'
import {
  IDENTITY_TRANSFORM,
  RevisionConflictError,
  VersionCompatibilityError,
  applyScenePatches,
  applyScenePatchesWithInverse,
  assertSceneRevision,
  createEmptySceneDocument,
  deserializeSceneDocument,
  mergeValidationResults,
  serializeSceneDocument,
  validateSceneDocument,
  type DraftChange,
  type SceneNode,
} from '../src/index.js'

const root: SceneNode = {
  id: 'root',
  type: 'example.box',
  transform: IDENTITY_TRANSFORM,
  components: {
    'example.settings': {
      count: 1,
      label: '保留无关字段',
      nested: { enabled: true },
    },
    'example.untouched': { value: 42 },
  },
}

describe('正式版本与 revision 契约', () => {
  it('明确区分文档格式版本和项目场景版本', () => {
    const document = createEmptySceneDocument({
      id: 'versioned',
      projectAdapterId: 'example.adapter',
      projectSchemaVersion: '3.2.1',
    })

    expect(document.formatVersion).toBe('1.0.0')
    expect(document.projectSchemaVersion).toBe('3.2.1')
    expect(validateSceneDocument(document).valid).toBe(true)
  })

  it('拒绝不兼容的文档主版本', () => {
    const document = { ...createEmptySceneDocument({ id: 'future' }), formatVersion: '2.0.0' }
    expect(() => deserializeSceneDocument(serializeSceneDocument(document))).toThrow(
      VersionCompatibilityError,
    )
  })

  it('使用 baseRevision 检测过期变更', () => {
    expect(() => assertSceneRevision(4, 5)).toThrow(RevisionConflictError)
    expect(() => assertSceneRevision(5, 5)).not.toThrow()

    const draft: DraftChange = {
      id: 'draft-1',
      baseRevision: 5,
      source: { kind: 'agent', detail: 'contract-test' },
      patches: [{ op: 'create', node: root }],
      validation: null,
      status: 'preview',
    }
    expect(draft.baseRevision).toBe(5)
  })

  it('合并验证结果时保留显式 invalid 状态', () => {
    expect(
      mergeValidationResults({ valid: true, issues: [] }, { valid: false, issues: [] }),
    ).toEqual({ valid: false, issues: [] })
  })
})

describe('资源 Patch', () => {
  it('create/update/delete 均生成可稳定序列化的逆操作', () => {
    const initial = createEmptySceneDocument({ id: 'resources' })
    const changed = applyScenePatchesWithInverse(initial, [
      {
        op: 'resource.create',
        resource: { id: 'mesh.box', uri: 'assets/box.glb', type: 'model/gltf-binary' },
      },
      {
        op: 'resource.update',
        id: 'mesh.box',
        changes: { uri: 'assets/box-v2.glb', metadata: { optimized: true } },
        unset: ['type'],
      },
    ])

    expect(changed.document.resources['mesh.box']).toEqual({
      id: 'mesh.box',
      uri: 'assets/box-v2.glb',
      metadata: { optimized: true },
    })
    expect(deserializeSceneDocument(serializeSceneDocument(changed.document))).toEqual(
      changed.document,
    )

    const restored = applyScenePatches(changed.document, changed.inversePatches).document
    expect(restored).toEqual(initial)

    const created = applyScenePatches(initial, [
      { op: 'resource.create', resource: { id: 'mesh.box', uri: 'assets/box.glb' } },
    ]).document
    const deleted = applyScenePatchesWithInverse(created, [
      { op: 'resource.delete', id: 'mesh.box' },
    ])
    expect(deleted.document.resources).toEqual({})
    expect(applyScenePatches(deleted.document, deleted.inversePatches).document).toEqual(created)
  })
})

describe('组件与属性细粒度 Patch', () => {
  it('只修改目标属性并可完整撤销', () => {
    const initial = applyScenePatches(createEmptySceneDocument({ id: 'components' }), [
      { op: 'create', node: root },
    ]).document
    const changed = applyScenePatchesWithInverse(initial, [
      {
        op: 'component.setProperty',
        id: 'root',
        component: 'example.settings',
        path: ['count'],
        value: 2,
      },
      {
        op: 'component.setProperty',
        id: 'root',
        component: 'example.settings',
        path: ['nested', 'enabled'],
        value: false,
      },
      {
        op: 'component.deleteProperty',
        id: 'root',
        component: 'example.settings',
        path: ['label'],
      },
    ])

    expect(changed.document.nodes.root?.components?.['example.settings']).toEqual({
      count: 2,
      nested: { enabled: false },
    })
    expect(changed.document.nodes.root?.components?.['example.untouched']).toEqual({ value: 42 })
    expect(applyScenePatches(changed.document, changed.inversePatches).document).toEqual(initial)
  })

  it('支持独立增加、替换和删除一个 Component', () => {
    const initial = applyScenePatches(createEmptySceneDocument({ id: 'component-lifecycle' }), [
      { op: 'create', node: root },
    ]).document
    const changed = applyScenePatchesWithInverse(initial, [
      {
        op: 'component.set',
        id: 'root',
        component: 'example.runtime',
        value: { active: true },
      },
      { op: 'component.delete', id: 'root', component: 'example.untouched' },
    ])

    expect(changed.document.nodes.root?.components?.['example.runtime']).toEqual({ active: true })
    expect(changed.document.nodes.root?.components?.['example.untouched']).toBeUndefined()
    expect(applyScenePatches(changed.document, changed.inversePatches).document).toEqual(initial)
  })
})
