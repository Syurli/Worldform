import { createEmptySceneDocument, VersionCompatibilityError } from '@worldform/core'
import { describe, expect, it } from 'vitest'
import {
  assertAdapterMatchesDocument,
  WORLDFORM_ADAPTER_API_VERSION,
  type WorldformProjectAdapter,
} from '../src/index.js'

function createAdapter(adapterApiVersion: string): WorldformProjectAdapter {
  return {
    manifest: {
      id: 'example.adapter',
      displayName: 'Example Adapter',
      adapterApiVersion,
      sceneSchemaVersion: '2.0.0',
      version: '1.4.0',
    },
    listCapabilities: () => [],
    validateDocument: () => ({ valid: true, issues: [] }),
    callCapability: async () => ({ output: null }),
  }
}

describe('Adapter 版本契约', () => {
  it('区分 API、项目场景和实现版本', () => {
    const adapter = createAdapter(WORLDFORM_ADAPTER_API_VERSION)
    const document = createEmptySceneDocument({
      id: 'adapter-version',
      projectAdapterId: 'example.adapter',
      projectSchemaVersion: '2.0.0',
    })

    expect(() => assertAdapterMatchesDocument(adapter, document)).not.toThrow()
    expect(adapter.manifest.version).toBe('1.4.0')
  })

  it('拒绝不兼容的 Adapter API 主版本', () => {
    const adapter = createAdapter('2.0.0')
    const document = createEmptySceneDocument({ id: 'incompatible-adapter' })

    expect(() => assertAdapterMatchesDocument(adapter, document)).toThrow(VersionCompatibilityError)
  })

  it('拒绝不匹配的项目场景 schema', () => {
    const adapter = createAdapter(WORLDFORM_ADAPTER_API_VERSION)
    const document = createEmptySceneDocument({
      id: 'schema-mismatch',
      projectAdapterId: 'example.adapter',
      projectSchemaVersion: '3.0.0',
    })

    expect(() => assertAdapterMatchesDocument(adapter, document)).toThrow(
      'Scene expects project schema',
    )
  })
})
