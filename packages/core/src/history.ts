import { cloneSceneData } from './clone.js'
import type { SceneDocument } from './model.js'
import { applyScenePatches, applyScenePatchesWithInverse, type ScenePatch } from './patch.js'

/** 一次可审计、可撤销的场景变更。 */
export interface SceneChange {
  id?: string
  label?: string
  source?: string
  patches: readonly ScenePatch[]
  inversePatches: readonly ScenePatch[]
}

export type SceneChangeDescriptor = Pick<SceneChange, 'id' | 'label' | 'source'>

export interface HistoryActionResult {
  document: SceneDocument
  change: SceneChange
}

/**
 * 纯 Core 的最小 History Store。
 *
 * Store 只持有 SceneDocument 与 SceneChange，不依赖 UI 状态。外部 Agent、MCP、
 * Ghost Preview 或人工编辑都可以先产生同一种 Patch，再由这里统一提交和撤销。
 */
export class SceneHistory {
  #document: SceneDocument
  #undoStack: SceneChange[] = []
  #redoStack: SceneChange[] = []

  public constructor(initialDocument: SceneDocument) {
    this.#document = cloneSceneData(initialDocument)
  }

  /** 返回隔离快照，调用方修改该对象不会污染 History 内部状态。 */
  public get document(): SceneDocument {
    return cloneSceneData(this.#document)
  }

  public get canUndo(): boolean {
    return this.#undoStack.length > 0
  }

  public get canRedo(): boolean {
    return this.#redoStack.length > 0
  }

  public get undoDepth(): number {
    return this.#undoStack.length
  }

  public get redoDepth(): number {
    return this.#redoStack.length
  }

  /** 返回供审计或 UI 展示使用的隔离快照。 */
  public get undoEntries(): readonly SceneChange[] {
    return cloneSceneData(this.#undoStack)
  }

  /** 返回供审计或 UI 展示使用的隔离快照。 */
  public get redoEntries(): readonly SceneChange[] {
    return cloneSceneData(this.#redoStack)
  }

  /** 应用一组原子 Patch；新分支会清空 redo 栈。 */
  public apply(
    patches: readonly ScenePatch[],
    descriptor: SceneChangeDescriptor = {},
  ): HistoryActionResult {
    if (patches.length === 0) throw new Error('A history change must contain at least one patch')

    const result = applyScenePatchesWithInverse(this.#document, patches)
    const change: SceneChange = {
      ...cloneSceneData(descriptor),
      patches: cloneSceneData(patches),
      inversePatches: cloneSceneData(result.inversePatches),
    }

    this.#document = result.document
    this.#undoStack.push(change)
    this.#redoStack = []

    return this.createActionResult(change)
  }

  /** 撤销最近一次变更；没有可撤销内容时返回 undefined。 */
  public undo(): HistoryActionResult | undefined {
    const change = this.#undoStack.pop()
    if (!change) return undefined

    this.#document = applyScenePatches(this.#document, change.inversePatches).document
    this.#redoStack.push(change)
    return this.createActionResult(change)
  }

  /** 重做最近一次被撤销的变更；没有可重做内容时返回 undefined。 */
  public redo(): HistoryActionResult | undefined {
    const change = this.#redoStack.pop()
    if (!change) return undefined

    this.#document = applyScenePatches(this.#document, change.patches).document
    this.#undoStack.push(change)
    return this.createActionResult(change)
  }

  /** 仅清空历史记录，不修改当前文档。 */
  public clear(): void {
    this.#undoStack = []
    this.#redoStack = []
  }

  private createActionResult(change: SceneChange): HistoryActionResult {
    return {
      document: cloneSceneData(this.#document),
      change: cloneSceneData(change),
    }
  }
}
