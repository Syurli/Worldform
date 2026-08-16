import { sceneRegistry, useScene } from '@pascal-app/core'
import type { ProjectNodeTypeDescriptor } from '@worldform/adapter-api'
import type { SceneDocument, ScenePatch } from '@worldform/core'
import { ensureWorldformPascalPlugin } from './plugin.js'
import {
  collectPascalProjectionPatches,
  projectSceneDocumentToPascal,
  type PascalSceneProjection,
} from './projection.js'
import type { PascalAuthoringBridge, PascalSceneSnapshot } from './types.js'

/**
 * Pascal store 的生命周期包装。它只能保存作者视图副本；load/collect 两个方向都显式
 * 穿过 SceneDocument/Patch 边界，防止上游 store 意外成为权威数据。
 */
export class PascalAuthoringSession implements PascalAuthoringBridge {
  #baseline: SceneDocument | undefined

  public constructor(private readonly descriptors: readonly ProjectNodeTypeDescriptor[]) {}

  public async initialize(): Promise<void> {
    await ensureWorldformPascalPlugin()
  }

  public async loadDocument(document: SceneDocument): Promise<void> {
    await this.initialize()
    const projection = projectSceneDocumentToPascal(document, this.descriptors)
    this.#baseline = structuredClone(document)
    sceneRegistry.clear()
    useScene.getState().setScene(projection.nodes as never, projection.rootNodeIds as never, {
      installedPlugins: projection.installedPlugins,
      hasExplicitPluginInstallState: true,
    })
  }

  public async collectPatches(): Promise<readonly ScenePatch[]> {
    if (!this.#baseline) throw new Error('Pascal authoring session has no loaded document')
    return collectPascalProjectionPatches(this.#baseline, this.readProjection())
  }

  public async captureSnapshot(): Promise<PascalSceneSnapshot> {
    return { raw: this.readProjection() }
  }

  public dispose(): void {
    this.#baseline = undefined
    sceneRegistry.clear()
    useScene.getState().unloadScene()
  }

  private readProjection(): PascalSceneProjection {
    const state = useScene.getState()
    return {
      nodes: structuredClone(state.nodes) as never,
      rootNodeIds: [...state.rootNodeIds],
      installedPlugins: [...state.installedPlugins],
    }
  }
}
