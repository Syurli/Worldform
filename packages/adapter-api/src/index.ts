import type {
  SceneDocument,
  ScenePatch,
  ValidationResult,
} from '@worldform/core'

export interface ProjectAdapterManifest {
  id: string
  displayName: string
  version: string
  sceneSchemaVersion: string
  description?: string
}

export interface ProjectCapabilityDescriptor {
  id: string
  title: string
  description?: string
  /** Capability 是否可能产生 ScenePatch。 */
  mutatesScene: boolean
  /** JSON Schema；Core 不解释它，只提供给 UI / CLI / Agent。 */
  inputSchema?: Readonly<Record<string, unknown>>
  outputSchema?: Readonly<Record<string, unknown>>
}

export interface ProjectCapabilityRequest {
  capabilityId: string
  input: unknown
  document: SceneDocument
}

export interface ProjectCapabilityResult {
  output?: unknown
  /**
   * 项目能力建议的结构化场景修改。
   * Worldform 可以先预览这些 Patch，再由用户确认是否 Apply。
   */
  patches?: readonly ScenePatch[]
  validation?: ValidationResult
  messages?: readonly string[]
}

export interface ProjectExportTarget {
  id: string
  displayName: string
  description?: string
}

export interface ProjectExportResult {
  fileName: string
  mediaType: string
  /** 第一阶段统一用文本；二进制资产后续由 Bridge/Exporter 扩展。 */
  content: string
}

/**
 * Worldform 与真实项目代码之间的最小稳定协议。
 *
 * Adapter 可以包裹项目自己的 npm package、本地进程、HTTP 服务或其它 Bridge；
 * Worldform 不应因此复制项目内部算法。
 */
export interface WorldformProjectAdapter {
  readonly manifest: ProjectAdapterManifest

  listCapabilities(): readonly ProjectCapabilityDescriptor[]

  validateDocument(document: SceneDocument): Promise<ValidationResult> | ValidationResult

  callCapability(request: ProjectCapabilityRequest): Promise<ProjectCapabilityResult>

  listExportTargets?(): readonly ProjectExportTarget[]

  exportDocument?(
    targetId: string,
    document: SceneDocument,
  ): Promise<ProjectExportResult>
}

export function assertAdapterMatchesDocument(
  adapter: WorldformProjectAdapter,
  document: SceneDocument,
): void {
  if (document.projectAdapterId && document.projectAdapterId !== adapter.manifest.id) {
    throw new Error(
      `Scene expects adapter "${document.projectAdapterId}" but received "${adapter.manifest.id}"`,
    )
  }
}
