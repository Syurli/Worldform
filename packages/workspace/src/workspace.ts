import {
  INITIAL_SCENE_REVISION,
  SceneHistory,
  applyScenePatches,
  assertSceneRevision,
  mergeValidationResults,
  validateSceneDocument,
  type DraftChange,
  type SceneDocument,
  type SceneRevision,
  type ValidationIssue,
  type ValidationResult,
} from '@worldform/core'
import { cloneWorkspaceData } from './clone.js'
import {
  WorkspaceDraftNotFoundError,
  WorkspaceDraftStateError,
  WorkspaceValidationError,
} from './errors.js'
import type {
  CreateWorkspaceDraftInput,
  WorkspaceAdapterSession,
  WorkspaceDraftPreview,
  WorkspaceEvent,
  WorkspaceEventListener,
  WorkspaceMutationResult,
  WorkspaceSnapshot,
  WorldformWorkspaceOptions,
} from './types.js'

/**
 * Editor、CLI 与 MCP 共用的唯一 Worldform 应用层。
 *
 * Workspace 复用 Core 的 SceneDocument、Patch 与 History，不建立第二套场景模型。
 * Pascal、React、CLI parser、MCP SDK 与具体项目逻辑都不得进入本类。
 */
export class WorldformWorkspace {
  #history: SceneHistory
  #revision: SceneRevision
  #drafts = new Map<string, DraftChange>()
  #listeners = new Set<WorkspaceEventListener>()
  #adapterSession: WorkspaceAdapterSession | undefined

  public constructor(initialDocument: SceneDocument, options: WorldformWorkspaceOptions = {}) {
    this.#history = new SceneHistory(initialDocument)
    this.#revision = options.initialRevision ?? INITIAL_SCENE_REVISION
    this.assertRevisionValue(this.#revision)
    this.#adapterSession = options.adapterSession
  }

  public getDocument(): SceneDocument {
    return this.#history.document
  }

  public getRevision(): SceneRevision {
    return this.#revision
  }

  public getSnapshot(): WorkspaceSnapshot {
    return {
      document: this.getDocument(),
      revision: this.#revision,
      drafts: this.listDrafts(),
    }
  }

  /** 加载新文档会重置 History 与全部 Draft；revision 由调用方明确指定。 */
  public loadDocument(
    document: SceneDocument,
    revision: SceneRevision = INITIAL_SCENE_REVISION,
  ): WorkspaceSnapshot {
    this.assertRevisionValue(revision)
    this.#history = new SceneHistory(document)
    this.#revision = revision
    this.#drafts.clear()
    this.emit({ type: 'document.loaded', revision })
    return this.getSnapshot()
  }

  public createDraft(input: CreateWorkspaceDraftInput): DraftChange {
    if (input.id.length === 0) throw new Error('Workspace draft id must not be empty')
    if (input.patches.length === 0)
      throw new Error('Workspace draft must contain at least one patch')
    this.assertRevisionValue(input.baseRevision)
    if (this.#drafts.has(input.id)) throw new Error(`Workspace draft already exists: ${input.id}`)

    const draft: DraftChange = {
      id: input.id,
      baseRevision: input.baseRevision,
      source: cloneWorkspaceData(input.source),
      patches: cloneWorkspaceData(input.patches),
      validation: null,
      status: 'preview',
    }
    this.#drafts.set(draft.id, draft)
    this.emit({ type: 'draft.created', revision: this.#revision, draftId: draft.id })
    return cloneWorkspaceData(draft)
  }

  public getDraft(draftId: string): DraftChange {
    return cloneWorkspaceData(this.getStoredDraft(draftId))
  }

  public listDrafts(): readonly DraftChange[] {
    return cloneWorkspaceData([...this.#drafts.values()])
  }

  /** 只生成候选文档，不修改正式 SceneDocument 或 History。 */
  public previewDraft(draftId: string): WorkspaceDraftPreview {
    const draft = this.requirePreviewDraft(draftId)
    assertSceneRevision(draft.baseRevision, this.#revision)
    const document = applyScenePatches(this.#history.document, draft.patches).document
    return {
      draft: cloneWorkspaceData(draft),
      document,
      revision: this.#revision,
    }
  }

  /** 执行 Core → Adapter 的统一验证管线，并把结果写回 Draft。 */
  public async validateDraft(draftId: string): Promise<DraftChange> {
    const preview = this.previewDraft(draftId)
    const results: ValidationResult[] = [validateSceneDocument(preview.document)]
    if (this.#adapterSession) {
      try {
        results.push(await this.#adapterSession.validateDocument(preview.document))
      } catch (error) {
        results.push(this.createAdapterFailureResult(this.#adapterSession.adapterId, error))
      }
    }

    const stored = this.requirePreviewDraft(draftId)
    stored.validation = cloneWorkspaceData(mergeValidationResults(...results))
    this.emit({ type: 'draft.validated', revision: this.#revision, draftId })
    return cloneWorkspaceData(stored)
  }

  /** Apply 前始终重新验证，成功后作为一个 History Change 提交并增加 revision。 */
  public async applyDraft(draftId: string): Promise<WorkspaceMutationResult> {
    const validated = await this.validateDraft(draftId)
    if (!validated.validation?.valid) {
      throw new WorkspaceValidationError(
        draftId,
        validated.validation ?? { valid: false, issues: [] },
      )
    }

    const stored = this.requirePreviewDraft(draftId)
    assertSceneRevision(stored.baseRevision, this.#revision)
    this.#history.apply(stored.patches, {
      id: stored.id,
      label: `Apply draft ${stored.id}`,
      source: this.formatDraftSource(stored),
    })
    stored.status = 'applied'
    this.#revision += 1
    this.emit({ type: 'draft.applied', revision: this.#revision, draftId })
    return {
      document: this.getDocument(),
      revision: this.#revision,
      draft: cloneWorkspaceData(stored),
    }
  }

  public discardDraft(draftId: string): DraftChange {
    const stored = this.requirePreviewDraft(draftId)
    stored.status = 'discarded'
    this.emit({ type: 'draft.discarded', revision: this.#revision, draftId })
    return cloneWorkspaceData(stored)
  }

  public undo(): WorkspaceMutationResult | undefined {
    const result = this.#history.undo()
    if (!result) return undefined
    this.#revision += 1
    this.emit({ type: 'history.undone', revision: this.#revision })
    return { document: result.document, revision: this.#revision }
  }

  public redo(): WorkspaceMutationResult | undefined {
    const result = this.#history.redo()
    if (!result) return undefined
    this.#revision += 1
    this.emit({ type: 'history.redone', revision: this.#revision })
    return { document: result.document, revision: this.#revision }
  }

  public setAdapterSession(session: WorkspaceAdapterSession | undefined): void {
    const previousId = this.#adapterSession?.adapterId
    this.#adapterSession = session
    if (previousId) {
      this.emit({ type: 'adapter.detached', revision: this.#revision, adapterId: previousId })
    }
    if (session) {
      this.emit({
        type: 'adapter.attached',
        revision: this.#revision,
        adapterId: session.adapterId,
      })
    }
  }

  public subscribe(listener: WorkspaceEventListener): () => void {
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }

  private getStoredDraft(draftId: string): DraftChange {
    const draft = this.#drafts.get(draftId)
    if (!draft) throw new WorkspaceDraftNotFoundError(draftId)
    return draft
  }

  private requirePreviewDraft(draftId: string): DraftChange {
    const draft = this.getStoredDraft(draftId)
    if (draft.status !== 'preview') throw new WorkspaceDraftStateError(cloneWorkspaceData(draft))
    return draft
  }

  private assertRevisionValue(revision: SceneRevision): void {
    if (!Number.isSafeInteger(revision) || revision < 0) {
      throw new RangeError(`Invalid workspace revision: ${revision}`)
    }
  }

  private formatDraftSource(draft: DraftChange): string {
    return draft.source.detail ? `${draft.source.kind}:${draft.source.detail}` : draft.source.kind
  }

  private createAdapterFailureResult(adapterId: string, error: unknown): ValidationResult {
    const message = error instanceof Error ? error.message : String(error)
    const issue: ValidationIssue = {
      code: 'workspace.adapter_validation_failed',
      severity: 'error',
      message: `Adapter validation failed: ${message}`,
      source: 'workspace',
      sourceId: adapterId,
    }
    return { valid: false, issues: [issue] }
  }

  private emit(event: WorkspaceEvent): void {
    for (const listener of this.#listeners) {
      try {
        listener(cloneWorkspaceData(event))
      } catch {
        // 监听器属于 UI/MCP 等外围层；单个监听器异常不能破坏权威 Workspace 状态。
      }
    }
  }
}
