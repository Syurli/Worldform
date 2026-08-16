import { IDENTITY_TRANSFORM, createEmptySceneDocument, type SceneDocument } from '@worldform/core'

/** Editor、CLI、MCP 与 contract test 共用的无游戏业务示例场景。 */
export function createExampleSceneDocument(): SceneDocument {
  return {
    ...createEmptySceneDocument({
      id: 'example-room',
      projectAdapterId: 'example.adapter',
      projectSchemaVersion: '1.0.0',
    }),
    nodes: {
      room: {
        id: 'room',
        type: 'example.box',
        name: 'Example Room',
        transform: IDENTITY_TRANSFORM,
        components: {
          'example.dimensions': { width: 8, height: 3, depth: 6 },
          'example.presentation': { label: 'Room', visible: true, tone: 'neutral' },
        },
      },
      zone: {
        id: 'zone',
        type: 'example.zone',
        parentId: 'room',
        transform: { ...IDENTITY_TRANSFORM, position: [0, 0, 1] },
        components: {
          'example.dimensions': { width: 2, height: 1, depth: 2 },
          'example.presentation': { label: 'Zone', visible: true, tone: 'cool' },
        },
      },
    },
    rootNodeIds: ['room'],
  }
}
