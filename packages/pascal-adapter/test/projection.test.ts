import { EXAMPLE_NODE_TYPES, createExampleSceneDocument } from '@worldform/example-adapter'
import { describe, expect, it } from 'vitest'
import { collectPascalProjectionPatches, projectSceneDocumentToPascal } from '../src/projection.js'

describe('Pascal authoring projection', () => {
  it('preserves hierarchy and adapter-driven preview metadata', () => {
    const projection = projectSceneDocumentToPascal(
      createExampleSceneDocument(),
      EXAMPLE_NODE_TYPES,
    )

    expect(projection.rootNodeIds).toEqual(['room'])
    expect(projection.nodes.room?.children).toEqual(['zone'])
    expect(projection.nodes.zone).toMatchObject({
      parentId: 'room',
      previewKind: 'zone',
      previewColor: '#54c98c',
    })
  })

  it('converts Pascal transform changes back into a Worldform patch', () => {
    const document = createExampleSceneDocument()
    const projection = projectSceneDocumentToPascal(document, EXAMPLE_NODE_TYPES)
    const room = projection.nodes.room
    if (!room) throw new Error('Expected room projection')
    room.position = [3, 2, 1]
    room.rotation = [0, Math.PI / 2, 0]

    const patches = collectPascalProjectionPatches(document, projection)

    expect(patches).toHaveLength(1)
    expect(patches[0]).toMatchObject({
      op: 'update',
      id: 'room',
      changes: { transform: { position: [3, 2, 1] } },
    })
  })

  it('turns newly projected nodes into create patches', () => {
    const document = createExampleSceneDocument()
    const projection = projectSceneDocumentToPascal(document, EXAMPLE_NODE_TYPES)
    const room = projection.nodes.room
    if (!room) throw new Error('Expected room projection')
    projection.nodes.marker = {
      ...structuredClone(room),
      id: 'marker',
      parentId: 'room',
      children: [],
      worldformType: 'example.marker',
      worldformName: 'Marker',
    }

    expect(collectPascalProjectionPatches(document, projection)).toContainEqual(
      expect.objectContaining({ op: 'create', node: expect.objectContaining({ id: 'marker' }) }),
    )
  })

  it('emits one cascade patch when an entire projected subtree is removed', () => {
    const document = createExampleSceneDocument()
    const projection = projectSceneDocumentToPascal(document, EXAMPLE_NODE_TYPES)
    delete projection.nodes.room
    delete projection.nodes.zone

    expect(collectPascalProjectionPatches(document, projection)).toEqual([
      { op: 'delete', id: 'room', cascade: true },
    ])
  })
})
