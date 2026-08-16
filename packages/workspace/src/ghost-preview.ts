import type { DraftChange, SceneDocument, SceneNode, SceneResource } from '@worldform/core'
import type { WorldformWorkspace } from './workspace.js'

export interface GhostUpdatedEntity<TEntity> {
  id: string
  before: TEntity
  after: TEntity
}

export interface GhostEntityDiff<TEntity> {
  created: readonly TEntity[]
  updated: readonly GhostUpdatedEntity<TEntity>[]
  deleted: readonly TEntity[]
}

/** Ghost Preview 是 Draft 的结构化差异，不维护第二份可提交场景状态。 */
export interface WorldformGhostPreview {
  draft: DraftChange
  revision: number
  candidateDocument: SceneDocument
  nodes: GhostEntityDiff<SceneNode>
  resources: GhostEntityDiff<SceneResource>
}

function valuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function createEntityDiff<TEntity extends { id: string }>(
  before: Readonly<Record<string, TEntity>>,
  after: Readonly<Record<string, TEntity>>,
): GhostEntityDiff<TEntity> {
  const created: TEntity[] = []
  const updated: GhostUpdatedEntity<TEntity>[] = []
  const deleted: TEntity[] = []

  for (const [id, entity] of Object.entries(after)) {
    const previous = before[id]
    if (!previous) created.push(entity)
    else if (!valuesEqual(previous, entity)) updated.push({ id, before: previous, after: entity })
  }
  for (const [id, entity] of Object.entries(before)) {
    if (!after[id]) deleted.push(entity)
  }
  return structuredClone({ created, updated, deleted })
}

/** 从 Workspace 当前正式文档与 Draft candidate 计算统一 Ghost 差异。 */
export function createWorldformGhostPreview(
  workspace: WorldformWorkspace,
  draftId: string,
): WorldformGhostPreview {
  const baseline = workspace.getDocument()
  const preview = workspace.previewDraft(draftId)
  return {
    draft: preview.draft,
    revision: preview.revision,
    candidateDocument: preview.document,
    nodes: createEntityDiff(baseline.nodes, preview.document.nodes),
    resources: createEntityDiff(baseline.resources, preview.document.resources),
  }
}
