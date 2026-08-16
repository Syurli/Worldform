import type { SceneDocument, SceneNode, ScenePatch } from '@worldform/core'

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
