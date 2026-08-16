import {
  assertSceneRevision,
  type DraftChange,
  type SceneNode,
  type SceneNodeOptionalKey,
  type ScenePatch,
  type ValidationResult,
} from '@worldform/core'
import type { ProjectCapabilityDescriptor } from '@worldform/adapter-api'
import {
  createWorldformGhostPreview,
  type WorldformGhostPreview,
  type WorkspaceMutationResult,
  type WorkspaceSnapshot,
  type WorldformWorkspace,
} from '@worldform/workspace'

export interface SceneQueryInput {
  id?: string
  type?: string
  parentId?: string
  nameIncludes?: string
}

export interface SceneUpdateInput {
  changeId: string
  baseRevision: number
  id: string
  changes: Partial<Omit<SceneNode, 'id'>>
  unset?: readonly SceneNodeOptionalKey[]
  rootIndex?: number
}

export interface ProjectCapabilityCallInput {
  capabilityId: string
  input: unknown
  baseRevision: number
  changeId?: string
}

export interface ProjectCapabilityCallResult {
  output?: unknown
  validation?: ValidationResult
  messages?: readonly string[]
  draft?: DraftChange
}

export interface GhostPreviewState {
  active: boolean
  draftId?: string
  preview?: WorldformGhostPreview
}

export type GhostPreviewListener = (state: GhostPreviewState) => void

/**
 * MCP 的应用服务面：只持有共享 Workspace 与当前预览引用，不复制 SceneDocument。
 * 所有 mutation 都先创建 DraftChange，永不默认 Apply。
 */
export class WorldformMcpSession {
  #activePreviewDraftId: string | undefined
  #previewListeners = new Set<GhostPreviewListener>()

  public constructor(public readonly workspace: WorldformWorkspace) {}

  public getScene(): WorkspaceSnapshot {
    return this.workspace.getSnapshot()
  }

  public queryScene(input: SceneQueryInput): readonly SceneNode[] {
    const nameNeedle = input.nameIncludes?.toLocaleLowerCase()
    return Object.values(this.workspace.getDocument().nodes).filter(
      (node) =>
        (input.id === undefined || node.id === input.id) &&
        (input.type === undefined || node.type === input.type) &&
        (input.parentId === undefined || node.parentId === input.parentId) &&
        (nameNeedle === undefined || node.name?.toLocaleLowerCase().includes(nameNeedle) === true),
    )
  }

  public createSceneNode(changeId: string, baseRevision: number, node: SceneNode): DraftChange {
    return this.createMutationDraft(
      changeId,
      baseRevision,
      [{ op: 'create', node }],
      'scene.create',
    )
  }

  public updateSceneNode(input: SceneUpdateInput): DraftChange {
    return this.createMutationDraft(
      input.changeId,
      input.baseRevision,
      [
        {
          op: 'update',
          id: input.id,
          changes: input.changes,
          ...(input.unset ? { unset: input.unset } : {}),
          ...(input.rootIndex === undefined ? {} : { rootIndex: input.rootIndex }),
        },
      ],
      `scene.update:${input.id}`,
    )
  }

  public deleteSceneNode(
    changeId: string,
    baseRevision: number,
    id: string,
    cascade = false,
  ): DraftChange {
    return this.createMutationDraft(
      changeId,
      baseRevision,
      [{ op: 'delete', id, cascade }],
      `scene.delete:${id}:cascade=${cascade}`,
    )
  }

  public listProjectCapabilities(): readonly ProjectCapabilityDescriptor[] {
    return this.workspace.listProjectCapabilities()
  }

  public async callProjectCapability(
    input: ProjectCapabilityCallInput,
  ): Promise<ProjectCapabilityCallResult> {
    this.assertCurrentRevision(input.baseRevision)
    const result = await this.workspace.callProjectCapability(input.capabilityId, input.input)
    if (!(result.patches && result.patches.length > 0)) {
      return {
        ...(result.output === undefined ? {} : { output: result.output }),
        ...(result.validation === undefined ? {} : { validation: result.validation }),
        ...(result.messages === undefined ? {} : { messages: result.messages }),
      }
    }
    if (!input.changeId) {
      throw new Error(`Capability ${input.capabilityId} 返回 Patch，必须提供 changeId。`)
    }
    const draft = this.createMutationDraft(
      input.changeId,
      input.baseRevision,
      result.patches,
      `project.callCapability:${input.capabilityId}`,
    )
    return {
      ...(result.output === undefined ? {} : { output: result.output }),
      ...(result.validation === undefined ? {} : { validation: result.validation }),
      ...(result.messages === undefined ? {} : { messages: result.messages }),
      draft,
    }
  }

  public validateProject(): Promise<ValidationResult> {
    return this.workspace.validateDocument()
  }

  /** Preview 在计算 Ghost diff 前运行统一验证，但不会修改正式文档。 */
  public async previewChange(draftId: string): Promise<WorldformGhostPreview> {
    await this.workspace.validateDraft(draftId)
    return createWorldformGhostPreview(this.workspace, draftId)
  }

  public async applyChange(draftId: string): Promise<WorkspaceMutationResult> {
    const result = await this.workspace.applyDraft(draftId)
    if (this.#activePreviewDraftId === draftId) this.stopPreview()
    return result
  }

  public discardChange(draftId: string): DraftChange {
    const result = this.workspace.discardDraft(draftId)
    if (this.#activePreviewDraftId === draftId) this.stopPreview()
    return result
  }

  public undo(): WorkspaceMutationResult | undefined {
    const result = this.workspace.undo()
    if (result) this.stopPreview()
    return result
  }

  public redo(): WorkspaceMutationResult | undefined {
    const result = this.workspace.redo()
    if (result) this.stopPreview()
    return result
  }

  public async playPreview(draftId: string): Promise<GhostPreviewState> {
    const preview = await this.previewChange(draftId)
    this.#activePreviewDraftId = draftId
    const state = { active: true, draftId, preview } as const
    this.emitPreview(state)
    return state
  }

  public stopPreview(): GhostPreviewState {
    this.#activePreviewDraftId = undefined
    const state = { active: false } as const
    this.emitPreview(state)
    return state
  }

  public subscribePreview(listener: GhostPreviewListener): () => void {
    this.#previewListeners.add(listener)
    return () => this.#previewListeners.delete(listener)
  }

  private createMutationDraft(
    changeId: string,
    baseRevision: number,
    patches: readonly ScenePatch[],
    detail: string,
  ): DraftChange {
    this.assertCurrentRevision(baseRevision)
    return this.workspace.createDraft({
      id: changeId,
      baseRevision,
      source: { kind: 'mcp', detail },
      patches,
    })
  }

  private assertCurrentRevision(baseRevision: number): void {
    assertSceneRevision(baseRevision, this.workspace.getRevision())
  }

  private emitPreview(state: GhostPreviewState): void {
    for (const listener of this.#previewListeners) listener(structuredClone(state))
  }
}
