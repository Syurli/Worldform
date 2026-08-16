import type {
  ProjectComponentDescriptor,
  ProjectNodeTypeDescriptor,
  ProjectPropertyDescriptor,
} from '@worldform/adapter-api'
import {
  IDENTITY_TRANSFORM,
  serializeSceneDocument,
  type SceneNode,
  type ScenePatch,
  type ValidationResult,
} from '@worldform/core'
import { exampleAdapter, createExampleSceneDocument } from '@worldform/example-adapter'
import { PascalAuthoringSession } from '@worldform/pascal-adapter'
import {
  AdapterHost,
  WorldformWorkspace,
  createWorldformGhostPreview,
  type WorldformGhostPreview,
  type WorkspaceEvent,
  type WorkspaceSnapshot,
} from '@worldform/workspace'

export interface EditorSessionSnapshot extends WorkspaceSnapshot {
  validation: ValidationResult | null
  ghostPreviews: readonly WorldformGhostPreview[]
}

export type EditorSessionListener = (snapshot: EditorSessionSnapshot) => void

function initialPropertyValue(
  property: ProjectPropertyDescriptor,
  document: WorkspaceSnapshot['document'],
): unknown {
  if (property.defaultValue !== undefined) return structuredClone(property.defaultValue)
  switch (property.type) {
    case 'number':
      return property.minimum ?? 1
    case 'string':
      return ''
    case 'boolean':
      return false
    case 'enum':
      return property.enumOptions?.[0]?.value ?? ''
    case 'node-reference': {
      const nodeId = Object.keys(document.nodes)[0]
      return nodeId ? { kind: 'node', nodeId } : undefined
    }
    case 'resource-reference': {
      const resourceId = Object.keys(document.resources)[0]
      return resourceId ? { kind: 'resource', resourceId } : undefined
    }
  }
}

function createInitialComponents(
  nodeType: ProjectNodeTypeDescriptor,
  components: readonly ProjectComponentDescriptor[],
  document: WorkspaceSnapshot['document'],
): Record<string, unknown> {
  const byId = new Map(components.map((component) => [component.id, component]))
  const result: Record<string, unknown> = {}
  for (const componentId of nodeType.components) {
    const descriptor = byId.get(componentId)
    if (!descriptor) continue
    const value: Record<string, unknown> = {}
    for (const property of descriptor.properties) {
      const initial = initialPropertyValue(property, document)
      if (initial !== undefined) value[property.id] = initial
    }
    if (Object.keys(value).length > 0) result[componentId] = value
  }
  return result
}

/** P1-005 Web UI 的无 React 控制器；所有写入统一经 Workspace DraftChange。 */
export class WorldformEditorSession {
  readonly host = new AdapterHost(exampleAdapter)
  readonly workspace = new WorldformWorkspace(createExampleSceneDocument(), {
    adapterSession: this.host,
  })
  readonly nodeTypes = this.host.listNodeTypes()
  readonly componentTypes = this.host.listComponentTypes()
  readonly pascal = new PascalAuthoringSession(this.nodeTypes)

  #validation: ValidationResult | null = null
  #listeners = new Set<EditorSessionListener>()
  #draftCounter = 0
  #nodeCounter = 0
  #unsubscribeWorkspace: (() => void) | undefined
  #projectionSync: Promise<void> = Promise.resolve()

  public async initialize(): Promise<void> {
    await this.host.initialize()
    await this.pascal.loadDocument(this.workspace.getDocument())
    this.#unsubscribeWorkspace = this.workspace.subscribe((event) =>
      this.handleWorkspaceEvent(event),
    )
    this.emit()
  }

  public getSnapshot(): EditorSessionSnapshot {
    const snapshot = this.workspace.getSnapshot()
    const ghostPreviews: WorldformGhostPreview[] = []
    for (const draft of snapshot.drafts) {
      if (draft.status !== 'preview') continue
      try {
        ghostPreviews.push(createWorldformGhostPreview(this.workspace, draft.id))
      } catch {
        // 过期 Draft 仍保留在列表中，但不生成会误导用户的候选场景。
      }
    }
    return { ...snapshot, validation: this.#validation, ghostPreviews }
  }

  public subscribe(listener: EditorSessionListener): () => void {
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }

  public async applyPatches(patches: readonly ScenePatch[], detail: string): Promise<void> {
    if (patches.length === 0) return
    const draftId = `editor-${Date.now()}-${this.#draftCounter++}`
    this.workspace.createDraft({
      id: draftId,
      baseRevision: this.workspace.getRevision(),
      source: { kind: 'editor', detail },
      patches,
    })
    await this.workspace.applyDraft(draftId)
    this.#validation = this.workspace.getDraft(draftId).validation
    await this.#projectionSync
  }

  public async createNode(type: string, parentId?: string): Promise<string> {
    const descriptor = this.nodeTypes.find((candidate) => candidate.type === type)
    if (!descriptor) throw new Error(`Unknown editor node type: ${type}`)
    const snapshot = this.workspace.getSnapshot()
    let id: string
    do {
      id = `node-${++this.#nodeCounter}`
    } while (snapshot.document.nodes[id])

    const node: SceneNode = {
      id,
      type,
      name: `${descriptor.displayName} ${this.#nodeCounter}`,
      ...(parentId ? { parentId } : {}),
      transform: structuredClone(IDENTITY_TRANSFORM),
      components: createInitialComponents(descriptor, this.componentTypes, snapshot.document),
    }
    await this.applyPatches([{ op: 'create', node }], `创建 ${descriptor.displayName}`)
    return id
  }

  public async deleteNode(id: string): Promise<void> {
    await this.applyPatches([{ op: 'delete', id, cascade: true }], `删除节点 ${id}`)
  }

  public async commitPascalChanges(): Promise<void> {
    await this.applyPatches(await this.pascal.collectPatches(), 'Pascal Gizmo 变换')
  }

  public async validate(): Promise<ValidationResult> {
    this.#validation = await this.workspace.validateDocument()
    this.emit()
    return this.#validation
  }

  public async undo(): Promise<void> {
    if (!this.workspace.undo()) return
    await this.#projectionSync
  }

  public async redo(): Promise<void> {
    if (!this.workspace.redo()) return
    await this.#projectionSync
  }

  public serializeDocument(): string {
    return serializeSceneDocument(this.workspace.getDocument(), { space: 2 })
  }

  public async dispose(): Promise<void> {
    this.#unsubscribeWorkspace?.()
    await this.#projectionSync
    this.pascal.dispose()
    await this.host.dispose()
    this.#listeners.clear()
  }

  private emit(): void {
    const snapshot = this.getSnapshot()
    for (const listener of this.#listeners) listener(snapshot)
  }

  /** 同进程 MCP 修改共享 Workspace 后，Editor 自动同步 Pascal 投影与 Draft 面板。 */
  private handleWorkspaceEvent(event: WorkspaceEvent): void {
    const documentChanged =
      event.type === 'document.loaded' ||
      event.type === 'draft.applied' ||
      event.type === 'history.undone' ||
      event.type === 'history.redone'
    if (!documentChanged) {
      this.emit()
      return
    }
    this.#projectionSync = this.#projectionSync.then(async () => {
      await this.pascal.loadDocument(this.workspace.getDocument())
      this.emit()
    })
  }
}
