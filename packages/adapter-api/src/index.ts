import {
  assertProtocolVersionCompatible,
  type AdapterApiVersion,
  type AdapterImplementationVersion,
  type ProjectSceneSchemaVersion,
  type SceneDocument,
  type ScenePatch,
  type ValidationIssue,
  type ValidationResult,
} from '@worldform/core'

/** 当前 Adapter API 公共协议版本。 */
export const WORLDFORM_ADAPTER_API_VERSION: AdapterApiVersion = '1.0.0'

export type ProjectJsonSchema = Readonly<Record<string, unknown>>
export type MaybePromise<T> = T | Promise<T>

export interface ProjectAdapterManifest {
  id: string
  displayName: string
  adapterApiVersion: AdapterApiVersion
  /** Adapter 包自身实现版本。 */
  version: AdapterImplementationVersion
  /** 项目节点、组件与属性语义版本。 */
  sceneSchemaVersion: ProjectSceneSchemaVersion
  description?: string
}

export type ProjectPropertyType =
  | 'number'
  | 'string'
  | 'boolean'
  | 'enum'
  | 'node-reference'
  | 'resource-reference'

export interface ProjectEnumOption {
  value: string
  label: string
}

/** Editor 可直接用于生成动态 Inspector 的最小属性描述。 */
export interface ProjectPropertyDescriptor {
  id: string
  label: string
  type: ProjectPropertyType
  description?: string
  required?: boolean
  defaultValue?: unknown
  minimum?: number
  maximum?: number
  step?: number
  enumOptions?: readonly ProjectEnumOption[]
}

export interface ProjectComponentDescriptor {
  id: string
  displayName: string
  description?: string
  properties: readonly ProjectPropertyDescriptor[]
}

export type ProjectAuthoringPreviewKind = 'box' | 'sphere' | 'zone' | 'marker' | 'light' | 'custom'

/** Authoring Preview 的通用提示，不承载渲染器对象。 */
export interface ProjectAuthoringPreviewDescriptor {
  kind: ProjectAuthoringPreviewKind
  color?: string
  icon?: string
}

export interface ProjectNodeTypeDescriptor {
  type: string
  displayName: string
  description?: string
  components: readonly string[]
  preview?: ProjectAuthoringPreviewDescriptor
}

export interface ProjectValidatorDescriptor {
  id: string
  displayName: string
  description?: string
}

export interface ProjectCapabilityDescriptor {
  id: string
  title: string
  description?: string
  /** Capability 是否可能产生 ScenePatch。 */
  mutatesScene: boolean
  /** JSON Schema 只作为跨工具契约；Core 不解释业务语义。 */
  inputSchema?: ProjectJsonSchema
  outputSchema?: ProjectJsonSchema
}

export interface ProjectCapabilityRequest {
  capabilityId: string
  input: unknown
  document: SceneDocument
}

/** Host 提供的调用上下文，不绑定 stdio/HTTP 等具体 Transport。 */
export interface ProjectInvocationContext {
  signal: AbortSignal
  timeoutMs: number
}

export interface ProjectCapabilityResult {
  output?: unknown
  /** 建议 Patch 必须进入 Workspace DraftChange，Adapter 不得直接修改正式文档。 */
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
  /** Phase 1 统一用文本；二进制资产后续由 Bridge/Exporter 扩展。 */
  content: string
}

export interface ProjectAdapterLifecycleContext {
  adapterApiVersion: AdapterApiVersion
}

export type ProjectAdapterErrorCode =
  | 'adapter.invalid_contract'
  | 'adapter.incompatible_version'
  | 'adapter.not_initialized'
  | 'adapter.capability_not_found'
  | 'adapter.export_target_not_found'
  | 'adapter.timeout'
  | 'adapter.cancelled'
  | 'adapter.execution_failed'

/** 跨 Host/CLI/MCP 都可保留的结构化 Adapter 错误。 */
export class ProjectAdapterError extends Error {
  public override readonly name = 'ProjectAdapterError'

  public constructor(
    public readonly code: ProjectAdapterErrorCode,
    message: string,
    public readonly adapterId?: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
  }
}

/**
 * Worldform 与真实项目代码之间的稳定业务协议。
 *
 * Adapter 描述“提供什么能力”；加载、Transport、timeout 与错误归一化由 Host 负责。
 */
export interface WorldformProjectAdapter {
  readonly manifest: ProjectAdapterManifest

  initialize?(context: ProjectAdapterLifecycleContext): MaybePromise<void>
  dispose?(): MaybePromise<void>

  listNodeTypes(): readonly ProjectNodeTypeDescriptor[]
  listComponentTypes(): readonly ProjectComponentDescriptor[]
  listValidators(): readonly ProjectValidatorDescriptor[]
  listCapabilities(): readonly ProjectCapabilityDescriptor[]

  validateDocument(
    document: SceneDocument,
    context?: ProjectInvocationContext,
  ): MaybePromise<ValidationResult>

  callCapability(
    request: ProjectCapabilityRequest,
    context?: ProjectInvocationContext,
  ): Promise<ProjectCapabilityResult>

  listExportTargets(): readonly ProjectExportTarget[]
  exportDocument(
    targetId: string,
    document: SceneDocument,
    context?: ProjectInvocationContext,
  ): Promise<ProjectExportResult>
}

export function assertAdapterMatchesDocument(
  adapter: WorldformProjectAdapter,
  document: SceneDocument,
): void {
  if (document.projectAdapterId && document.projectAdapterId !== adapter.manifest.id) {
    throw new ProjectAdapterError(
      'adapter.incompatible_version',
      `Scene expects adapter "${document.projectAdapterId}" but received "${adapter.manifest.id}"`,
      adapter.manifest.id,
    )
  }
  if (
    document.projectSchemaVersion &&
    document.projectSchemaVersion !== adapter.manifest.sceneSchemaVersion
  ) {
    throw new ProjectAdapterError(
      'adapter.incompatible_version',
      `Scene expects project schema "${document.projectSchemaVersion}" but adapter provides "${adapter.manifest.sceneSchemaVersion}"`,
      adapter.manifest.id,
    )
  }

  try {
    assertProtocolVersionCompatible(
      WORLDFORM_ADAPTER_API_VERSION,
      adapter.manifest.adapterApiVersion,
      'Worldform adapter API',
    )
  } catch (error) {
    throw new ProjectAdapterError(
      'adapter.incompatible_version',
      error instanceof Error ? error.message : String(error),
      adapter.manifest.id,
      { cause: error },
    )
  }
}

/** 创建带 Adapter 来源信息的标准 ValidationIssue。 */
export function createAdapterValidationIssue(
  adapterId: string,
  issue: Omit<ValidationIssue, 'source' | 'sourceId'>,
): ValidationIssue {
  return { ...issue, source: 'adapter', sourceId: adapterId }
}
