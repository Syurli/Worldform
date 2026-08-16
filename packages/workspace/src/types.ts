import type {
  DraftChange,
  DraftChangeSource,
  SceneDocument,
  ScenePatch,
  SceneRevision,
  ValidationResult,
} from '@worldform/core'

export interface CreateWorkspaceDraftInput {
  id: string
  baseRevision: SceneRevision
  source: DraftChangeSource
  patches: readonly ScenePatch[]
}

export interface WorkspaceDraftPreview {
  draft: DraftChange
  document: SceneDocument
  revision: SceneRevision
}

export interface WorkspaceSnapshot {
  document: SceneDocument
  revision: SceneRevision
  drafts: readonly DraftChange[]
}

export type WorkspaceEventType =
  | 'document.loaded'
  | 'draft.created'
  | 'draft.validated'
  | 'draft.applied'
  | 'draft.discarded'
  | 'history.undone'
  | 'history.redone'
  | 'adapter.attached'
  | 'adapter.detached'

export interface WorkspaceEvent {
  type: WorkspaceEventType
  revision: SceneRevision
  draftId?: string
  adapterId?: string
}

export type WorkspaceEventListener = (event: WorkspaceEvent) => void

/**
 * Workspace 对 Adapter Host/Session 的最小挂载协议。
 * P1-004 的正式 AdapterHost 实现该接口；Workspace 不关心具体 Transport。
 */
export interface WorkspaceAdapterSession {
  readonly adapterId: string
  validateDocument(document: SceneDocument): Promise<ValidationResult> | ValidationResult
}

export interface WorldformWorkspaceOptions {
  initialRevision?: SceneRevision
  adapterSession?: WorkspaceAdapterSession
}

export interface WorkspaceMutationResult {
  document: SceneDocument
  revision: SceneRevision
  draft?: DraftChange
}
