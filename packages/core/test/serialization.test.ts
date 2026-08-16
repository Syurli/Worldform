import { describe, expect, it } from 'vitest'
import {
  IDENTITY_TRANSFORM,
  SceneHistory,
  SceneSerializationError,
  applyScenePatches,
  createEmptySceneDocument,
  deserializeSceneDocument,
  migrateSceneDocument,
  serializeSceneDocument,
  validateSceneDocument,
  type SceneDocument,
  type SceneDocumentMigration,
  type SceneNode,
} from '../src/index.js'

const root: SceneNode = {
  id: 'root',
  type: 'prop',
  name: 'Root Prop',
  transform: IDENTITY_TRANSFORM,
  components: {
    'example.visual': { color: '#ffffff', visible: true },
  },
  references: {
    mesh: { kind: 'resource', resourceId: 'mesh.crate' },
  },
  tags: ['interactive', 'prop'],
}

function createPopulatedDocument(): SceneDocument {
  const base: SceneDocument = {
    ...createEmptySceneDocument({
      id: 'serialization',
      formatVersion: '1.0.0',
      projectAdapterId: 'example.adapter',
      projectSchemaVersion: '1.0.0',
    }),
    resources: {
      'mesh.crate': {
        id: 'mesh.crate',
        uri: 'assets/crate.glb',
        type: 'model/gltf-binary',
      },
    },
    metadata: { author: 'Worldform test' },
  }
  return applyScenePatches(base, [{ op: 'create', node: root }]).document
}

describe('SceneDocument serialization', () => {
  it('round-trips created nodes without losing scene semantics', () => {
    const document = createPopulatedDocument()
    const serialized = serializeSceneDocument(document)
    const restored = deserializeSceneDocument(serialized)

    expect(restored).toEqual(document)
    expect(validateSceneDocument(restored).valid).toBe(true)
    expect(serialized.endsWith('\n')).toBe(true)
  })

  it('produces deterministic JSON regardless of object insertion order', () => {
    const first = createPopulatedDocument()
    const second: SceneDocument = {
      metadata: { author: 'Worldform test' },
      resources: {
        'mesh.crate': {
          type: 'model/gltf-binary',
          uri: 'assets/crate.glb',
          id: 'mesh.crate',
        },
      },
      rootNodeIds: ['root'],
      nodes: {
        root: {
          tags: ['interactive', 'prop'],
          references: { mesh: { resourceId: 'mesh.crate', kind: 'resource' } },
          components: {
            'example.visual': { visible: true, color: '#ffffff' },
          },
          transform: {
            scale: [1, 1, 1],
            rotation: [0, 0, 0, 1],
            position: [0, 0, 0],
          },
          name: 'Root Prop',
          type: 'prop',
          id: 'root',
        },
      },
      projectAdapterId: 'example.adapter',
      projectSchemaVersion: '1.0.0',
      formatVersion: '1.0.0',
      id: 'serialization',
    }

    expect(serializeSceneDocument(second)).toBe(serializeSceneDocument(first))
  })

  it('reloads from disk format and remains editable through History', () => {
    const restored = deserializeSceneDocument(serializeSceneDocument(createPopulatedDocument()))
    const history = new SceneHistory(restored)

    history.apply([
      {
        op: 'update',
        id: 'root',
        changes: { transform: { ...IDENTITY_TRANSFORM, position: [4, 2, 1] } },
      },
    ])

    expect(history.document.nodes.root?.transform.position).toEqual([4, 2, 1])
    history.undo()
    expect(history.document.nodes.root?.transform.position).toEqual([0, 0, 0])
    history.redo()
    expect(validateSceneDocument(history.document).valid).toBe(true)
  })

  it('rejects values that stable JSON cannot preserve', () => {
    const invalid: SceneDocument = {
      ...createPopulatedDocument(),
      metadata: { invalid: Number.NaN },
    }

    expect(() => serializeSceneDocument(invalid)).toThrow(SceneSerializationError)
  })
})

describe('SceneDocument migration', () => {
  const migration: SceneDocumentMigration = {
    fromVersion: '1.0.0',
    toVersion: '1.1.0',
    migrate(document) {
      return {
        ...document,
        formatVersion: '1.1.0',
        metadata: { ...document.metadata, migrated: true },
      }
    },
  }

  it('runs an explicit migration chain without mutating the source', () => {
    const source = createPopulatedDocument()
    const migrated = migrateSceneDocument(source, '1.1.0', [migration])

    expect(source.formatVersion).toBe('1.0.0')
    expect(source.metadata).toEqual({ author: 'Worldform test' })
    expect(migrated.formatVersion).toBe('1.1.0')
    expect(migrated.metadata).toEqual({ author: 'Worldform test', migrated: true })
  })

  it('can migrate as part of deserialization', () => {
    const migrated = deserializeSceneDocument(serializeSceneDocument(createPopulatedDocument()), {
      targetFormatVersion: '1.1.0',
      migrations: [migration],
    })

    expect(migrated.formatVersion).toBe('1.1.0')
  })
})
