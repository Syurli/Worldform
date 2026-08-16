import type { ScenePatch } from './patch.js'
import type { ValidationResult } from './validation.js'

/** 运行中场景的单调递增修订号；不属于磁盘 SceneDocument 格式。 */
export type SceneRevision = number

export const INITIAL_SCENE_REVISION: SceneRevision = 0

export type DraftChangeStatus = 'preview' | 'applied' | 'discarded'

export type DraftChangeSourceKind = 'editor' | 'cli' | 'mcp' | 'adapter' | 'agent' | 'system'

/** 记录变更入口；detail 可保存工具名、用户或 capability ID。 */
export interface DraftChangeSource {
  kind: DraftChangeSourceKind
  detail?: string
}

/**
 * Workspace 后续使用的正式变更草案契约。
 *
 * Core 只定义可序列化的数据形态与 revision 冲突语义，不负责草案生命周期。
 */
export interface DraftChange {
  id: string
  baseRevision: SceneRevision
  source: DraftChangeSource
  patches: readonly ScenePatch[]
  validation: ValidationResult | null
  status: DraftChangeStatus
}

export class RevisionConflictError extends Error {
  public override readonly name = 'RevisionConflictError'

  public constructor(
    public readonly baseRevision: SceneRevision,
    public readonly currentRevision: SceneRevision,
  ) {
    super(
      `Scene revision conflict: change is based on ${baseRevision}, current revision is ${currentRevision}`,
    )
  }
}

export function assertSceneRevision(
  baseRevision: SceneRevision,
  currentRevision: SceneRevision,
): void {
  if (!Number.isSafeInteger(baseRevision) || baseRevision < 0) {
    throw new RangeError(`Invalid base revision: ${baseRevision}`)
  }
  if (!Number.isSafeInteger(currentRevision) || currentRevision < 0) {
    throw new RangeError(`Invalid current revision: ${currentRevision}`)
  }
  if (baseRevision !== currentRevision) {
    throw new RevisionConflictError(baseRevision, currentRevision)
  }
}
