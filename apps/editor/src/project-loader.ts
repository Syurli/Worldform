import type { WorldformProjectAdapter } from '@worldform/adapter-api'
import { deserializeSceneDocument, type SceneDocument } from '@worldform/core'

export interface EditorProjectConfiguration {
  adapter: WorldformProjectAdapter
  document: SceneDocument
}

function isProjectAdapter(value: unknown): value is WorldformProjectAdapter {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<WorldformProjectAdapter>
  return (
    typeof candidate.manifest === 'object' &&
    typeof candidate.listNodeTypes === 'function' &&
    typeof candidate.listComponentTypes === 'function' &&
    typeof candidate.validateDocument === 'function' &&
    typeof candidate.callCapability === 'function'
  )
}

function findAdapter(module: Readonly<Record<string, unknown>>): WorldformProjectAdapter {
  const candidates = [
    module.default,
    module.adapter,
    module.worldformAdapter,
    ...Object.values(module),
  ]
  for (const candidate of candidates) {
    if (isProjectAdapter(candidate)) return candidate
  }
  throw new Error('外部模块没有导出 WorldformProjectAdapter。')
}

/**
 * 从 URL 加载受信任的外部项目。
 *
 * Adapter 模块会在浏览器中执行，因此只能指向开发者明确信任的本地/项目服务；
 * 跨源服务必须允许 CORS，Adapter 需要预先打成可独立解析的浏览器 ESM。
 */
export async function loadEditorProject(
  search: string,
  baseUrl: string,
): Promise<EditorProjectConfiguration | undefined> {
  const parameters = new URLSearchParams(search)
  const adapterParameter = parameters.get('adapter')
  const sceneParameter = parameters.get('scene')
  if (!(adapterParameter || sceneParameter)) return undefined
  if (!(adapterParameter && sceneParameter)) {
    throw new Error('外部项目启动必须同时提供 adapter 与 scene URL。')
  }

  const adapterUrl = new URL(adapterParameter, baseUrl).href
  const sceneUrl = new URL(sceneParameter, baseUrl).href
  // Vite 不能在构建期分析运行时项目 URL；保留原始浏览器动态 import。
  const adapterModule = (await import(/* @vite-ignore */ adapterUrl)) as Record<string, unknown>
  const response = await fetch(sceneUrl)
  if (!response.ok) throw new Error(`场景读取失败：HTTP ${response.status}`)
  return {
    adapter: findAdapter(adapterModule),
    document: deserializeSceneDocument(await response.text()),
  }
}
