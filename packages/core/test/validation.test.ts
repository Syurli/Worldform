import { describe, expect, it } from 'vitest'
import {
  IDENTITY_TRANSFORM,
  validateSceneDocument,
  type SceneDocument,
  type SceneNode,
  type Vec3,
} from '../src/index.js'

function issueCodes(document: SceneDocument): string[] {
  return validateSceneDocument(document).issues.map((issue) => issue.code)
}

describe('SceneDocument structural validation', () => {
  it('reports inconsistent roots, missing parents and node-key mismatches', () => {
    const root: SceneNode = {
      id: 'actual-root-id',
      type: 'group',
      transform: IDENTITY_TRANSFORM,
    }
    const child: SceneNode = {
      id: 'child',
      type: 'group',
      parentId: 'missing-parent',
      transform: IDENTITY_TRANSFORM,
    }
    const document: SceneDocument = {
      id: 'invalid-structure',
      schemaVersion: '0.1.0',
      nodes: { 'wrong-map-key': root, child },
      rootNodeIds: ['child', 'missing-root', 'missing-root'],
    }

    const codes = issueCodes(document)
    expect(codes).toContain('core.node_key_mismatch')
    expect(codes).toContain('core.missing_parent')
    expect(codes).toContain('core.root_has_parent')
    expect(codes).toContain('core.missing_root')
    expect(codes).toContain('core.duplicate_root')
    expect(codes).toContain('core.unlisted_root')
  })

  it('detects parent cycles', () => {
    const document: SceneDocument = {
      id: 'cycle',
      schemaVersion: '0.1.0',
      nodes: {
        a: { id: 'a', type: 'group', parentId: 'b', transform: IDENTITY_TRANSFORM },
        b: { id: 'b', type: 'group', parentId: 'a', transform: IDENTITY_TRANSFORM },
      },
      rootNodeIds: [],
    }

    const result = validateSceneDocument(document)
    expect(result.valid).toBe(false)
    expect(result.issues.filter((issue) => issue.code === 'core.parent_cycle')).toHaveLength(2)
  })

  it('reports dangling generic node and resource references', () => {
    const document: SceneDocument = {
      id: 'references',
      schemaVersion: '0.1.0',
      nodes: {
        root: {
          id: 'root',
          type: 'group',
          transform: IDENTITY_TRANSFORM,
          references: {
            target: { kind: 'node', nodeId: 'missing-node' },
            assets: [
              { kind: 'resource', resourceId: 'existing-resource' },
              { kind: 'resource', resourceId: 'missing-resource' },
            ],
          },
        },
      },
      rootNodeIds: ['root'],
      resources: {
        'existing-resource': {
          id: 'existing-resource',
          uri: 'assets/existing.glb',
        },
      },
    }

    const codes = issueCodes(document)
    expect(codes).toContain('core.dangling_node_reference')
    expect(codes).toContain('core.dangling_resource_reference')
    expect(codes.filter((code) => code.includes('dangling'))).toHaveLength(2)
  })

  it('reports non-finite tuples, malformed scale and a zero quaternion', () => {
    const document: SceneDocument = {
      id: 'transform',
      schemaVersion: '0.1.0',
      nodes: {
        nonFinite: {
          id: 'nonFinite',
          type: 'group',
          transform: {
            position: [0, Number.POSITIVE_INFINITY, 0],
            rotation: [0, 0, 0, 1],
            scale: [1, 1] as unknown as Vec3,
          },
        },
        zeroRotation: {
          id: 'zeroRotation',
          type: 'group',
          transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0, 0],
            scale: [1, 1, 1],
          },
        },
      },
      rootNodeIds: ['nonFinite', 'zeroRotation'],
    }

    const codes = issueCodes(document)
    expect(codes).toContain('core.invalid_transform_position')
    expect(codes).toContain('core.invalid_transform_scale')
    expect(codes).toContain('core.zero_quaternion')
  })
})
