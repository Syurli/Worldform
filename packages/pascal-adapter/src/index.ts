import type { SceneDocument, SceneNode, ScenePatch } from '@worldform/core'

/**
 * Pascal 接入只负责“作者视图 ↔ Worldform 场景语义”的转换。
 * Pascal 自己的 store / Object3D / IndexedDB 数据不得成为 Worldform 的正式格式。
 */
export interface PascalSceneSnapshot {
  readonly raw: unknown
}

export interface PascalNodeProjection {
  worldformNodeId: string
  pascalNodeId: string
}

export interface PascalAuthoringBridge {
  /** 将 Worldform 文档投影到 Pascal 作者视图。 */
  loadDocument(document: SceneDocument): Promise<void>

  /** 读取作者视图并转换成结构化 Patch，而不是直接覆盖正式文档。 */
  collectPatches(): Promise<readonly ScenePatch[]>

  /** 可选：用于诊断与迁移，不作为正式持久化格式。 */
  captureSnapshot?(): Promise<PascalSceneSnapshot>
}

export interface PascalNodeCodec<TPascalNode = unknown> {
  readonly worldformType: string
  canDecode(node: TPascalNode): boolean
  decode(node: TPascalNode): SceneNode
  encode(node: SceneNode): TPascalNode
}

/**
 * 第一阶段故意不直接依赖 @pascal-app/*。
 * 等 PoC 确认版本和 API 后，只在本 package 内加入真实依赖并锁定版本。
 */
export const PASCAL_INTEGRATION_STATUS = 'boundary-only' as const
