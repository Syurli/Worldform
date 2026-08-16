import {
  ProjectAdapterError,
  WORLDFORM_ADAPTER_API_VERSION,
  type ProjectInvocationContext,
  type WorldformProjectAdapter,
} from '@worldform/adapter-api'
import { createEmptySceneDocument } from '@worldform/core'
import { describe, expect, it, vi } from 'vitest'
import { AdapterHost } from '../src/index.js'

function createAdapter(overrides: Partial<WorldformProjectAdapter> = {}): WorldformProjectAdapter {
  return {
    manifest: {
      id: 'example.adapter',
      displayName: 'Example Adapter',
      adapterApiVersion: WORLDFORM_ADAPTER_API_VERSION,
      sceneSchemaVersion: '1.0.0',
      version: '1.0.0',
    },
    listNodeTypes: () => [],
    listComponentTypes: () => [],
    listValidators: () => [],
    listCapabilities: () => [
      { id: 'echo', title: 'Echo', mutatesScene: false },
      { id: 'slow', title: 'Slow', mutatesScene: false },
    ],
    validateDocument: () => ({ valid: true, issues: [] }),
    async callCapability(request, context) {
      if (request.capabilityId === 'slow') {
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, 100)
          context?.signal.addEventListener('abort', () => {
            clearTimeout(timer)
            reject(new Error('aborted'))
          })
        })
      }
      return { output: request.input }
    },
    listExportTargets: () => [{ id: 'json', displayName: 'JSON' }],
    exportDocument: async () => ({
      fileName: 'scene.json',
      mediaType: 'application/json',
      content: '{}',
    }),
    ...overrides,
  }
}

describe('AdapterHost', () => {
  it('管理 initialize/dispose lifecycle 并转发 capability', async () => {
    const initialize = vi.fn()
    const dispose = vi.fn()
    const host = new AdapterHost(createAdapter({ initialize, dispose }))
    const document = createEmptySceneDocument({
      id: 'host',
      projectAdapterId: 'example.adapter',
      projectSchemaVersion: '1.0.0',
    })

    await expect(
      host.callCapability({ capabilityId: 'echo', input: { ok: true }, document }),
    ).resolves.toEqual({ output: { ok: true } })
    expect(host.status).toBe('ready')
    expect(initialize).toHaveBeenCalledOnce()
    await host.dispose()
    expect(dispose).toHaveBeenCalledOnce()
    expect(host.status).toBe('disposed')
  })

  it('在边界归一化 capability not found 与执行异常', async () => {
    const host = new AdapterHost(
      createAdapter({
        callCapability: async () => {
          throw new Error('project failure')
        },
      }),
    )
    const document = createEmptySceneDocument({ id: 'errors' })

    await expect(
      host.callCapability({ capabilityId: 'missing', input: null, document }),
    ).rejects.toMatchObject({ code: 'adapter.capability_not_found' })
    await expect(
      host.callCapability({ capabilityId: 'echo', input: null, document }),
    ).rejects.toMatchObject({ code: 'adapter.execution_failed' })
  })

  it('支持 timeout 与调用方 cancellation', async () => {
    const host = new AdapterHost(createAdapter(), { defaultTimeoutMs: 10 })
    const document = createEmptySceneDocument({ id: 'timeout' })

    await expect(
      host.callCapability({ capabilityId: 'slow', input: null, document }),
    ).rejects.toMatchObject({ code: 'adapter.timeout' })

    const controller = new AbortController()
    const pending = host.callCapability(
      { capabilityId: 'slow', input: null, document },
      { timeoutMs: 1_000, signal: controller.signal },
    )
    controller.abort()
    await expect(pending).rejects.toMatchObject({ code: 'adapter.cancelled' })
  })

  it('向 Adapter 提供 AbortSignal 与 timeout 上下文', async () => {
    let received: ProjectInvocationContext | undefined
    const host = new AdapterHost(
      createAdapter({
        callCapability: async (_request, context) => {
          received = context
          return { output: true }
        },
      }),
    )
    const document = createEmptySceneDocument({ id: 'context' })

    await host.callCapability({ capabilityId: 'echo', input: null, document }, { timeoutMs: 250 })
    expect(received?.timeoutMs).toBe(250)
    expect(received?.signal).toBeInstanceOf(AbortSignal)
  })

  it('保留结构化 ProjectAdapterError', async () => {
    const expected = new ProjectAdapterError('adapter.execution_failed', 'structured')
    const host = new AdapterHost(
      createAdapter({
        callCapability: async () => {
          throw expected
        },
      }),
    )
    const document = createEmptySceneDocument({ id: 'structured' })

    await expect(host.callCapability({ capabilityId: 'echo', input: null, document })).rejects.toBe(
      expected,
    )
  })
})
