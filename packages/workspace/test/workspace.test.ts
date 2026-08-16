import {
  IDENTITY_TRANSFORM,
  RevisionConflictError,
  createEmptySceneDocument,
  type SceneNode,
  type ValidationResult,
} from '@worldform/core'
import { describe, expect, it } from 'vitest'
import {
  WorkspaceValidationError,
  WorldformWorkspace,
  type WorkspaceAdapterSession,
  type WorkspaceEvent,
} from '../src/index.js'

function createNode(id: string): SceneNode {
  return { id, type: 'example.box', transform: IDENTITY_TRANSFORM }
}

describe('WorldformWorkspace Draft 管线', () => {
  it('preview 不污染正式文档，apply 后进入 History 并增加 revision', async () => {
    const workspace = new WorldformWorkspace(createEmptySceneDocument({ id: 'workspace' }))
    workspace.createDraft({
      id: 'create-root',
      baseRevision: 0,
      source: { kind: 'editor', detail: 'scene-tree' },
      patches: [{ op: 'create', node: createNode('root') }],
    })

    const preview = workspace.previewDraft('create-root')
    expect(preview.document.nodes.root).toBeDefined()
    expect(workspace.getDocument().nodes.root).toBeUndefined()
    expect(workspace.getRevision()).toBe(0)

    const validated = await workspace.validateDraft('create-root')
    expect(validated.validation?.valid).toBe(true)

    const applied = await workspace.applyDraft('create-root')
    expect(applied.revision).toBe(1)
    expect(applied.draft?.status).toBe('applied')
    expect(workspace.getDocument().nodes.root).toBeDefined()

    const undone = workspace.undo()
    expect(undone?.revision).toBe(2)
    expect(workspace.getDocument().nodes.root).toBeUndefined()

    const redone = workspace.redo()
    expect(redone?.revision).toBe(3)
    expect(workspace.getDocument().nodes.root).toBeDefined()
  })

  it('拒绝基于旧 revision 的 Draft', async () => {
    const workspace = new WorldformWorkspace(createEmptySceneDocument({ id: 'conflict' }))
    workspace.createDraft({
      id: 'stale',
      baseRevision: 0,
      source: { kind: 'agent' },
      patches: [{ op: 'create', node: createNode('stale-node') }],
    })
    workspace.createDraft({
      id: 'current',
      baseRevision: 0,
      source: { kind: 'editor' },
      patches: [{ op: 'create', node: createNode('current-node') }],
    })
    await workspace.applyDraft('current')

    expect(() => workspace.previewDraft('stale')).toThrow(RevisionConflictError)
    await expect(workspace.applyDraft('stale')).rejects.toThrow(RevisionConflictError)
    expect(workspace.getDocument().nodes['stale-node']).toBeUndefined()
  })

  it('discard 不改变文档或 revision', () => {
    const workspace = new WorldformWorkspace(createEmptySceneDocument({ id: 'discard' }))
    workspace.createDraft({
      id: 'discard-me',
      baseRevision: 0,
      source: { kind: 'cli' },
      patches: [{ op: 'create', node: createNode('discarded-node') }],
    })

    expect(workspace.discardDraft('discard-me').status).toBe('discarded')
    expect(workspace.getDocument().nodes['discarded-node']).toBeUndefined()
    expect(workspace.getRevision()).toBe(0)
    expect(() => workspace.previewDraft('discard-me')).toThrow('cannot be changed')
  })

  it('Core validation failure 阻止 Apply', async () => {
    const initial = createEmptySceneDocument({ id: 'invalid' })
    const workspace = new WorldformWorkspace(initial)
    workspace.createDraft({
      id: 'invalid-transform',
      baseRevision: 0,
      source: { kind: 'mcp' },
      patches: [
        {
          op: 'create',
          node: {
            id: 'invalid-node',
            type: 'example.box',
            transform: { ...IDENTITY_TRANSFORM, rotation: [0, 0, 0, 0] },
          },
        },
      ],
    })

    await expect(workspace.applyDraft('invalid-transform')).rejects.toThrow(
      WorkspaceValidationError,
    )
    expect(workspace.getRevision()).toBe(0)
    expect(workspace.getDocument()).toEqual(initial)
  })
})

describe('WorldformWorkspace Adapter 与事件', () => {
  it('项目 capability 只返回建议 Patch，不绕过 Draft 修改正式文档', async () => {
    const workspace = new WorldformWorkspace(createEmptySceneDocument({ id: 'capability' }), {
      adapterSession: {
        adapterId: 'capability.adapter',
        validateDocument: () => ({ valid: true, issues: [] }),
        listCapabilities: () => [{ id: 'createNode', title: 'Create Node', mutatesScene: true }],
        callCapability: () => ({
          output: { proposed: true },
          patches: [{ op: 'create', node: createNode('proposed') }],
        }),
      },
    })

    expect(workspace.listProjectCapabilities()).toContainEqual(
      expect.objectContaining({ id: 'createNode' }),
    )
    const result = await workspace.callProjectCapability('createNode', {})

    expect(result.patches).toContainEqual(expect.objectContaining({ op: 'create' }))
    expect(workspace.getDocument().nodes.proposed).toBeUndefined()
    expect(workspace.getRevision()).toBe(0)
  })

  it('可直接验证正式文档并复用 Core 与 Adapter 管线', async () => {
    const workspace = new WorldformWorkspace(
      createEmptySceneDocument({ id: 'direct-validation' }),
      {
        adapterSession: {
          adapterId: 'warning.adapter',
          validateDocument() {
            return {
              valid: true,
              issues: [
                {
                  code: 'example.direct_warning',
                  severity: 'warning',
                  message: '直接验证警告',
                  source: 'adapter',
                },
              ],
            }
          },
        },
      },
    )

    const validation = await workspace.validateDocument()

    expect(validation.valid).toBe(true)
    expect(validation.issues.map((issue) => issue.code)).toContain('example.direct_warning')
    expect(workspace.getRevision()).toBe(0)
  })

  it('Adapter validation issue 会合并并阻止 Apply', async () => {
    const adapterSession: WorkspaceAdapterSession = {
      adapterId: 'example.adapter',
      validateDocument(): ValidationResult {
        return {
          valid: false,
          issues: [
            {
              code: 'example.forbidden_node',
              severity: 'error',
              message: '示例 Adapter 拒绝该节点',
              source: 'adapter',
              sourceId: 'example.adapter',
            },
          ],
        }
      },
    }
    const workspace = new WorldformWorkspace(createEmptySceneDocument({ id: 'adapter' }), {
      adapterSession,
    })
    workspace.createDraft({
      id: 'adapter-rejected',
      baseRevision: 0,
      source: { kind: 'adapter' },
      patches: [{ op: 'create', node: createNode('root') }],
    })

    const validated = await workspace.validateDraft('adapter-rejected')
    expect(validated.validation?.issues.map((issue) => issue.code)).toContain(
      'example.forbidden_node',
    )
    await expect(workspace.applyDraft('adapter-rejected')).rejects.toThrow(WorkspaceValidationError)
  })

  it('Adapter 异常被归一化为结构化 validation issue', async () => {
    const workspace = new WorldformWorkspace(createEmptySceneDocument({ id: 'adapter-error' }), {
      adapterSession: {
        adapterId: 'broken.adapter',
        validateDocument() {
          throw new Error('adapter process stopped')
        },
      },
    })
    workspace.createDraft({
      id: 'adapter-error-draft',
      baseRevision: 0,
      source: { kind: 'adapter' },
      patches: [{ op: 'create', node: createNode('root') }],
    })

    const result = await workspace.validateDraft('adapter-error-draft')
    expect(result.validation?.issues).toContainEqual(
      expect.objectContaining({
        code: 'workspace.adapter_validation_failed',
        sourceId: 'broken.adapter',
      }),
    )
  })

  it('发送 revision 与 Draft 生命周期事件，并隔离监听器异常', async () => {
    const workspace = new WorldformWorkspace(createEmptySceneDocument({ id: 'events' }))
    const events: WorkspaceEvent[] = []
    workspace.subscribe((event) => events.push(event))
    workspace.subscribe(() => {
      throw new Error('UI listener failure')
    })

    workspace.createDraft({
      id: 'event-draft',
      baseRevision: 0,
      source: { kind: 'editor' },
      patches: [{ op: 'create', node: createNode('root') }],
    })
    await workspace.applyDraft('event-draft')
    workspace.undo()

    expect(events.map((event) => event.type)).toEqual([
      'draft.created',
      'draft.validated',
      'draft.applied',
      'history.undone',
    ])
    expect(events.at(-1)?.revision).toBe(2)
  })

  it('loadDocument 重置 History、Draft 与 revision', async () => {
    const workspace = new WorldformWorkspace(createEmptySceneDocument({ id: 'before' }))
    workspace.createDraft({
      id: 'before-draft',
      baseRevision: 0,
      source: { kind: 'system' },
      patches: [{ op: 'create', node: createNode('before-node') }],
    })
    await workspace.applyDraft('before-draft')

    workspace.loadDocument(createEmptySceneDocument({ id: 'after' }), 10)
    expect(workspace.getSnapshot()).toEqual({
      document: createEmptySceneDocument({ id: 'after' }),
      revision: 10,
      drafts: [],
    })
    expect(workspace.undo()).toBeUndefined()
  })
})
