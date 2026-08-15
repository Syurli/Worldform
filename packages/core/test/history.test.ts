import { describe, expect, it } from 'vitest'
import {
  IDENTITY_TRANSFORM,
  SceneHistory,
  applyScenePatches,
  applyScenePatchesWithInverse,
  createEmptySceneDocument,
  type SceneNode,
} from '../src/index.js'

function createNode(id: string, parentId?: string): SceneNode {
  return {
    id,
    type: 'group',
    transform: IDENTITY_TRANSFORM,
    ...(parentId === undefined ? {} : { parentId }),
  }
}

describe('Scene Patch inverse operations', () => {
  it('restores optional fields and root ordering exactly', () => {
    const initial = applyScenePatches(createEmptySceneDocument({ id: 'inverse' }), [
      { op: 'create', node: createNode('first') },
      { op: 'create', node: createNode('second') },
      { op: 'create', node: createNode('child', 'first') },
    ]).document

    const changed = applyScenePatchesWithInverse(initial, [
      { op: 'update', id: 'first', changes: { name: 'Renamed' } },
      { op: 'update', id: 'second', changes: { parentId: 'first' } },
      { op: 'update', id: 'child', changes: { name: 'Temporary' }, unset: ['parentId'] },
    ])

    expect(changed.document.rootNodeIds).toEqual(['first', 'child'])
    expect(changed.document.nodes.child?.parentId).toBeUndefined()

    const restored = applyScenePatches(changed.document, changed.inversePatches).document
    expect(restored).toEqual(initial)
  })

  it('requires cascade for a parent and restores the complete deleted subtree', () => {
    const initial = applyScenePatches(createEmptySceneDocument({ id: 'delete' }), [
      { op: 'create', node: createNode('before') },
      { op: 'create', node: createNode('parent') },
      { op: 'create', node: createNode('child', 'parent') },
      { op: 'create', node: createNode('grandchild', 'child') },
      { op: 'create', node: createNode('after') },
    ]).document

    expect(() => applyScenePatches(initial, [{ op: 'delete', id: 'parent' }])).toThrow(
      'use cascade delete',
    )

    const deleted = applyScenePatchesWithInverse(initial, [
      { op: 'delete', id: 'parent', cascade: true },
    ])
    expect(Object.keys(deleted.document.nodes)).toEqual(['before', 'after'])

    const restored = applyScenePatches(deleted.document, deleted.inversePatches).document
    expect(restored).toEqual(initial)
    expect(restored.rootNodeIds).toEqual(['before', 'parent', 'after'])
  })
})

describe('SceneHistory', () => {
  it('undoes and redoes multiple changes in the correct order', () => {
    const history = new SceneHistory(createEmptySceneDocument({ id: 'history' }))

    history.apply([{ op: 'create', node: createNode('root') }], { id: 'create-root' })
    history.apply([{ op: 'update', id: 'root', changes: { name: 'First name' } }], {
      id: 'rename-root',
    })
    history.apply([{ op: 'create', node: createNode('child', 'root') }], {
      id: 'create-child',
    })

    expect(history.undoDepth).toBe(3)
    expect(history.document.nodes.child).toBeDefined()

    expect(history.undo()?.change.id).toBe('create-child')
    expect(history.document.nodes.child).toBeUndefined()
    expect(history.undo()?.change.id).toBe('rename-root')
    expect(history.document.nodes.root?.name).toBeUndefined()
    expect(history.undo()?.change.id).toBe('create-root')
    expect(history.document.nodes.root).toBeUndefined()
    expect(history.undo()).toBeUndefined()

    expect(history.redo()?.change.id).toBe('create-root')
    expect(history.redo()?.change.id).toBe('rename-root')
    expect(history.redo()?.change.id).toBe('create-child')
    expect(history.document.nodes.child?.parentId).toBe('root')
    expect(history.redo()).toBeUndefined()
  })

  it('clears redo when a new change branches from an undone state', () => {
    const history = new SceneHistory(createEmptySceneDocument({ id: 'branch' }))
    history.apply([{ op: 'create', node: createNode('first') }])
    history.apply([{ op: 'create', node: createNode('discarded') }])
    history.undo()

    history.apply([{ op: 'create', node: createNode('replacement') }])

    expect(history.canRedo).toBe(false)
    expect(history.document.nodes.discarded).toBeUndefined()
    expect(history.document.nodes.replacement).toBeDefined()
  })

  it('undoes and redoes a cascade delete as one history change', () => {
    const initial = applyScenePatches(createEmptySceneDocument({ id: 'delete-history' }), [
      { op: 'create', node: createNode('root') },
      { op: 'create', node: createNode('child', 'root') },
    ]).document
    const history = new SceneHistory(initial)

    history.apply([{ op: 'delete', id: 'root', cascade: true }], { id: 'delete-tree' })
    expect(Object.keys(history.document.nodes)).toHaveLength(0)

    expect(history.undo()?.change.id).toBe('delete-tree')
    expect(history.document.nodes.child?.parentId).toBe('root')

    expect(history.redo()?.change.id).toBe('delete-tree')
    expect(Object.keys(history.document.nodes)).toHaveLength(0)
  })

  it('does not retain shared mutable references from inputs or exposed snapshots', () => {
    const mutableComponent = { nested: { count: 1 } }
    const node: SceneNode = {
      ...createNode('root'),
      components: { sample: mutableComponent },
    }
    const history = new SceneHistory(createEmptySceneDocument({ id: 'isolation' }))
    history.apply([{ op: 'create', node }])

    mutableComponent.nested.count = 99
    expect(history.document.nodes.root?.components?.sample).toEqual({ nested: { count: 1 } })

    const exposedDocument = history.document
    const exposedSample = exposedDocument.nodes.root?.components?.sample as {
      nested: { count: number }
    }
    exposedSample.nested.count = 42
    expect(history.document.nodes.root?.components?.sample).toEqual({ nested: { count: 1 } })

    const exposedEntryNode = history.undoEntries[0]?.patches[0]
    if (exposedEntryNode?.op !== 'create') throw new Error('Expected a create patch')
    const exposedEntrySample = exposedEntryNode.node.components?.sample as {
      nested: { count: number }
    }
    exposedEntrySample.nested.count = 7

    history.undo()
    history.redo()
    expect(history.document.nodes.root?.components?.sample).toEqual({ nested: { count: 1 } })
  })
})
