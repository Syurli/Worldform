import {
  assertAdapterMatchesDocument,
  ProjectAdapterError,
  WORLDFORM_ADAPTER_API_VERSION,
  type ProjectCapabilityDescriptor,
  type ProjectCapabilityRequest,
  type ProjectCapabilityResult,
  type ProjectComponentDescriptor,
  type ProjectExportResult,
  type ProjectExportTarget,
  type ProjectInvocationContext,
  type ProjectNodeTypeDescriptor,
  type ProjectValidatorDescriptor,
  type WorldformProjectAdapter,
} from '@worldform/adapter-api'
import type { SceneDocument, ValidationResult } from '@worldform/core'
import { cloneWorkspaceData } from './clone.js'
import type { WorkspaceAdapterSession } from './types.js'

export type AdapterHostStatus = 'idle' | 'ready' | 'disposed'

export interface AdapterInvocationOptions {
  timeoutMs?: number
  signal?: AbortSignal
}

export interface AdapterHostOptions {
  defaultTimeoutMs?: number
}

/**
 * Phase 1 的 in-process Adapter Host。
 *
 * Host 负责 lifecycle、版本检查、timeout/cancellation 和错误归一化；业务 Adapter
 * 不感知未来 stdio/HTTP Transport，Workspace 也只依赖 WorkspaceAdapterSession。
 */
export class AdapterHost implements WorkspaceAdapterSession {
  #status: AdapterHostStatus = 'idle'
  readonly #defaultTimeoutMs: number

  public constructor(
    public readonly adapter: WorldformProjectAdapter,
    options: AdapterHostOptions = {},
  ) {
    this.#defaultTimeoutMs = options.defaultTimeoutMs ?? 5_000
    if (!Number.isSafeInteger(this.#defaultTimeoutMs) || this.#defaultTimeoutMs <= 0) {
      throw new RangeError(`Invalid Adapter Host timeout: ${this.#defaultTimeoutMs}`)
    }
  }

  public get adapterId(): string {
    return this.adapter.manifest.id
  }

  public get status(): AdapterHostStatus {
    return this.#status
  }

  public async initialize(): Promise<void> {
    if (this.#status === 'ready') return
    if (this.#status === 'disposed') {
      throw new ProjectAdapterError(
        'adapter.not_initialized',
        `Adapter Host has been disposed: ${this.adapterId}`,
        this.adapterId,
      )
    }

    try {
      await this.adapter.initialize?.({ adapterApiVersion: WORLDFORM_ADAPTER_API_VERSION })
      this.#status = 'ready'
    } catch (error) {
      throw this.normalizeError(error, 'Adapter initialization failed')
    }
  }

  public async dispose(): Promise<void> {
    if (this.#status === 'disposed') return
    try {
      if (this.#status === 'ready') await this.adapter.dispose?.()
    } catch (error) {
      throw this.normalizeError(error, 'Adapter disposal failed')
    } finally {
      this.#status = 'disposed'
    }
  }

  public listNodeTypes(): readonly ProjectNodeTypeDescriptor[] {
    return cloneWorkspaceData(this.adapter.listNodeTypes())
  }

  public listComponentTypes(): readonly ProjectComponentDescriptor[] {
    return cloneWorkspaceData(this.adapter.listComponentTypes())
  }

  public listValidators(): readonly ProjectValidatorDescriptor[] {
    return cloneWorkspaceData(this.adapter.listValidators())
  }

  public listCapabilities(): readonly ProjectCapabilityDescriptor[] {
    return cloneWorkspaceData(this.adapter.listCapabilities())
  }

  public listExportTargets(): readonly ProjectExportTarget[] {
    return cloneWorkspaceData(this.adapter.listExportTargets())
  }

  public async validateDocument(
    document: SceneDocument,
    options: AdapterInvocationOptions = {},
  ): Promise<ValidationResult> {
    assertAdapterMatchesDocument(this.adapter, document)
    return cloneWorkspaceData(
      await this.invoke(
        (context) => this.adapter.validateDocument(cloneWorkspaceData(document), context),
        options,
      ),
    )
  }

  public async callCapability(
    request: ProjectCapabilityRequest,
    options: AdapterInvocationOptions = {},
  ): Promise<ProjectCapabilityResult> {
    const descriptor = this.adapter
      .listCapabilities()
      .find((capability) => capability.id === request.capabilityId)
    if (!descriptor) {
      throw new ProjectAdapterError(
        'adapter.capability_not_found',
        `Adapter capability does not exist: ${request.capabilityId}`,
        this.adapterId,
      )
    }
    assertAdapterMatchesDocument(this.adapter, request.document)
    return cloneWorkspaceData(
      await this.invoke(
        (context) => this.adapter.callCapability(cloneWorkspaceData(request), context),
        options,
      ),
    )
  }

  public async exportDocument(
    targetId: string,
    document: SceneDocument,
    options: AdapterInvocationOptions = {},
  ): Promise<ProjectExportResult> {
    if (!this.adapter.listExportTargets().some((target) => target.id === targetId)) {
      throw new ProjectAdapterError(
        'adapter.export_target_not_found',
        `Adapter export target does not exist: ${targetId}`,
        this.adapterId,
      )
    }
    assertAdapterMatchesDocument(this.adapter, document)
    return cloneWorkspaceData(
      await this.invoke(
        (context) => this.adapter.exportDocument(targetId, cloneWorkspaceData(document), context),
        options,
      ),
    )
  }

  private async invoke<TResult>(
    operation: (context: ProjectInvocationContext) => Promise<TResult> | TResult,
    options: AdapterInvocationOptions,
  ): Promise<TResult> {
    await this.initialize()
    const timeoutMs = options.timeoutMs ?? this.#defaultTimeoutMs
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
      throw new RangeError(`Invalid Adapter invocation timeout: ${timeoutMs}`)
    }
    if (options.signal?.aborted) {
      throw new ProjectAdapterError(
        'adapter.cancelled',
        `Adapter invocation was cancelled: ${this.adapterId}`,
        this.adapterId,
      )
    }

    const controller = new AbortController()
    return new Promise<TResult>((resolve, reject) => {
      let settled = false
      const finish = (callback: () => void): void => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        options.signal?.removeEventListener('abort', cancel)
        callback()
      }
      const cancel = (): void => {
        controller.abort()
        finish(() =>
          reject(
            new ProjectAdapterError(
              'adapter.cancelled',
              `Adapter invocation was cancelled: ${this.adapterId}`,
              this.adapterId,
            ),
          ),
        )
      }
      const timer = setTimeout(() => {
        controller.abort()
        finish(() =>
          reject(
            new ProjectAdapterError(
              'adapter.timeout',
              `Adapter invocation timed out after ${timeoutMs}ms: ${this.adapterId}`,
              this.adapterId,
            ),
          ),
        )
      }, timeoutMs)

      options.signal?.addEventListener('abort', cancel, { once: true })
      let operationPromise: Promise<TResult>
      try {
        operationPromise = Promise.resolve(operation({ signal: controller.signal, timeoutMs }))
      } catch (error) {
        finish(() => reject(this.normalizeError(error, 'Adapter execution failed')))
        return
      }
      operationPromise.then(
        (result) => finish(() => resolve(result)),
        (error: unknown) =>
          finish(() => reject(this.normalizeError(error, 'Adapter execution failed'))),
      )
    })
  }

  private normalizeError(error: unknown, prefix: string): ProjectAdapterError {
    if (error instanceof ProjectAdapterError) return error
    const message = error instanceof Error ? error.message : String(error)
    return new ProjectAdapterError(
      'adapter.execution_failed',
      `${prefix}: ${message}`,
      this.adapterId,
      { cause: error },
    )
  }
}
