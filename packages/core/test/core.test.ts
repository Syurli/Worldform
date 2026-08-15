import { describe, expect, it } from 'vitest'
import {
  IDENTITY_TRANSFORM,
  applyScenePatches,
  createEmptySceneDocument,
  validateSceneDocument,
  type SceneNode,
} from '../src/index.js'

describe('@worldform/core', () => {
  it('creates, updates and cascade-deletes scene nodes through patches', () => {
    const empty = createEmptySceneDocument({ id: 'scene-test' })
    const root: SceneNode = {
      id: 'root',
      type: 'group',
      transform: IDENTITY_TRANSFORM,
    }
    const child: SceneNode = {
      id: 'child',
      type: 'marker',
      parentId: 'root',
      transform: IDENTITY_TRANSFORM,
    }

    const created = applyScenePatches(empty, [
      { op: 'create', node: root },
      { op: 'create', node: child },
    ]).document

    expect(created.rootNodeIds).toEqual(['root'])
    expect(validateSceneDocument(created).valid).toBe(true)

    const updated = applyScenePatches(created, [
      { op: 'update', id: 'child', changes: { name: 'Target Marker' } },
    ]).document
    expect(updated.nodes.child?.name).toBe('Target Marker')

    const removed = applyScenePatches(updated, [
      { op: 'delete', id: 'root', cascade: true },
    ]).document
    expect(Object.keys(removed.nodes)).toHaveLength(0)
    expect(removed.rootNodeIds).toHaveLength(0)
  })
})
