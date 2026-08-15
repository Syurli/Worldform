export type SceneNodeId = string

export type Vec3 = readonly [x: number, y: number, z: number]
export type Quat = readonly [x: number, y: number, z: number, w: number]

export interface TransformData {
  position: Vec3
  rotation: Quat
  scale: Vec3
}

export interface SceneNode {
  id: SceneNodeId
  type: string
  name?: string
  parentId?: SceneNodeId
  transform: TransformData
  /**
   * 通用组件容器。Core 只保存结构，不解释游戏业务语义；
   * Project Adapter 负责为具体 component 提供 schema、编辑器和校验。
   */
  components?: Readonly<Record<string, unknown>>
  tags?: readonly string[]
  metadata?: Readonly<Record<string, unknown>>
}

export interface SceneDocument {
  id: string
  schemaVersion: string
  projectAdapterId?: string
  nodes: Readonly<Record<SceneNodeId, SceneNode>>
  rootNodeIds: readonly SceneNodeId[]
  metadata?: Readonly<Record<string, unknown>>
}

export const IDENTITY_TRANSFORM: TransformData = {
  position: [0, 0, 0],
  rotation: [0, 0, 0, 1],
  scale: [1, 1, 1],
}

export function createEmptySceneDocument(input: {
  id: string
  schemaVersion?: string
  projectAdapterId?: string
}): SceneDocument {
  const base = {
    id: input.id,
    schemaVersion: input.schemaVersion ?? '0.1.0',
    nodes: {},
    rootNodeIds: [],
  }

  return input.projectAdapterId
    ? { ...base, projectAdapterId: input.projectAdapterId }
    : base
}
