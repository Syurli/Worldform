import {
  WORLDFORM_DOCUMENT_FORMAT_VERSION,
  type DocumentFormatVersion,
  type ProjectSceneSchemaVersion,
} from './version.js'

export type SceneNodeId = string
export type SceneResourceId = string

export type Vec3 = readonly [x: number, y: number, z: number]
export type Quat = readonly [x: number, y: number, z: number, w: number]

export interface TransformData {
  position: Vec3
  rotation: Quat
  scale: Vec3
}

/** 指向同一份 SceneDocument 中节点的通用引用。 */
export interface SceneNodeReference {
  kind: 'node'
  nodeId: SceneNodeId
}

/** 指向 SceneDocument 资源表条目的通用引用。 */
export interface SceneResourceReference {
  kind: 'resource'
  resourceId: SceneResourceId
}

export type SceneReference = SceneNodeReference | SceneResourceReference

/**
 * Core 只记录资源身份和位置，不解释具体资源格式或加载方式。
 * 资源导入、构建与运行时解析仍由 Editor、Adapter 或 Bridge 负责。
 */
export interface SceneResource {
  id: SceneResourceId
  uri: string
  type?: string
  metadata?: Readonly<Record<string, unknown>>
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
  /**
   * Core 能够检查的显式通用引用。业务组件内部的引用语义仍归 Adapter 所有，
   * Core 不会猜测 components 或 metadata 中的任意字符串是否为引用。
   */
  references?: Readonly<Record<string, SceneReference | readonly SceneReference[]>>
  tags?: readonly string[]
  metadata?: Readonly<Record<string, unknown>>
}

export interface SceneDocument {
  id: string
  /** Worldform 通用文档格式版本，不承载项目或 Adapter 版本语义。 */
  formatVersion: DocumentFormatVersion
  projectAdapterId?: string
  /** 项目节点、组件与属性的语义版本，由 Project Adapter 管理。 */
  projectSchemaVersion?: ProjectSceneSchemaVersion
  nodes: Readonly<Record<SceneNodeId, SceneNode>>
  rootNodeIds: readonly SceneNodeId[]
  resources: Readonly<Record<SceneResourceId, SceneResource>>
  metadata?: Readonly<Record<string, unknown>>
}

export const IDENTITY_TRANSFORM: TransformData = {
  position: [0, 0, 0],
  rotation: [0, 0, 0, 1],
  scale: [1, 1, 1],
}

export function createEmptySceneDocument(input: {
  id: string
  formatVersion?: DocumentFormatVersion
  projectAdapterId?: string
  projectSchemaVersion?: ProjectSceneSchemaVersion
}): SceneDocument {
  const base = {
    id: input.id,
    formatVersion: input.formatVersion ?? WORLDFORM_DOCUMENT_FORMAT_VERSION,
    nodes: {},
    rootNodeIds: [],
    resources: {},
  }

  return {
    ...base,
    ...(input.projectAdapterId ? { projectAdapterId: input.projectAdapterId } : {}),
    ...(input.projectSchemaVersion ? { projectSchemaVersion: input.projectSchemaVersion } : {}),
  }
}
