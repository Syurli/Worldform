import { WORLDFORM_ADAPTER_API_VERSION, type WorldformProjectAdapter } from '@worldform/adapter-api'
import { IDENTITY_TRANSFORM, createEmptySceneDocument } from '@worldform/core'
import { describe, expect, it } from 'vitest'
import {
  checkAdapterContract,
  defineComponent,
  defineNodeType,
  defineProjectAdapter,
  validateDocumentDescriptors,
} from '../src/index.js'

const component = defineComponent({
  id: 'example.settings',
  displayName: 'Settings',
  properties: [
    { id: 'count', label: 'Count', type: 'number', required: true, minimum: 0 },
    {
      id: 'mode',
      label: 'Mode',
      type: 'enum',
      enumOptions: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
    },
  ],
} as const)

const nodeType = defineNodeType({
  type: 'example.box',
  displayName: 'Box',
  components: ['example.settings'],
  preview: { kind: 'box', color: '#6699ff' },
} as const)

function createAdapter(): WorldformProjectAdapter {
  return defineProjectAdapter({
    manifest: {
      id: 'example.adapter',
      displayName: 'Example Adapter',
      adapterApiVersion: WORLDFORM_ADAPTER_API_VERSION,
      sceneSchemaVersion: '1.0.0',
      version: '1.0.0',
    },
    listNodeTypes: () => [nodeType],
    listComponentTypes: () => [component],
    listValidators: () => [{ id: 'descriptor', displayName: 'Descriptor Validator' }],
    listCapabilities: () => [],
    validateDocument(document) {
      return validateDocumentDescriptors({
        adapterId: 'example.adapter',
        document,
        nodeTypes: [nodeType],
        components: [component],
      })
    },
    callCapability: async () => ({ output: null }),
    listExportTargets: () => [],
    exportDocument: async () => ({
      fileName: 'example.json',
      mediaType: 'application/json',
      content: '{}',
    }),
  })
}

describe('@worldform/adapter-sdk', () => {
  it('根据 descriptor 校验未知节点、必填属性、类型和范围', () => {
    const document = {
      ...createEmptySceneDocument({
        id: 'descriptor',
        projectAdapterId: 'example.adapter',
        projectSchemaVersion: '1.0.0',
      }),
      nodes: {
        box: {
          id: 'box',
          type: 'example.box',
          transform: IDENTITY_TRANSFORM,
          components: { 'example.settings': { count: -1, mode: 'invalid' } },
        },
        unknown: { id: 'unknown', type: 'example.unknown', transform: IDENTITY_TRANSFORM },
      },
      rootNodeIds: ['box', 'unknown'],
    }

    const result = createAdapter().validateDocument(document)
    expect(result).not.toBeInstanceOf(Promise)
    if (result instanceof Promise) throw new Error('Expected synchronous validation')
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'adapter.property_below_minimum',
        'adapter.invalid_property_type',
        'adapter.unknown_node_type',
      ]),
    )
  })

  it('contract report 接受完整 Adapter 与 fixture', async () => {
    const document = createEmptySceneDocument({
      id: 'fixture',
      projectAdapterId: 'example.adapter',
      projectSchemaVersion: '1.0.0',
    })
    await expect(
      checkAdapterContract(createAdapter(), { document, expectedValid: true }),
    ).resolves.toEqual({ valid: true, issues: [] })
  })

  it('contract report 能发现重复 descriptor 和空 enum', async () => {
    const adapter = createAdapter()
    const invalid: WorldformProjectAdapter = {
      ...adapter,
      listNodeTypes: () => [nodeType, nodeType],
      listComponentTypes: () => [
        {
          id: 'broken',
          displayName: 'Broken',
          properties: [{ id: 'mode', label: 'Mode', type: 'enum', enumOptions: [] }],
        },
      ],
    }
    const report = await checkAdapterContract(invalid)

    expect(report.valid).toBe(false)
    expect(report.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'contract.duplicate_node_type',
        'contract.unknown_component_reference',
        'contract.empty_enum',
      ]),
    )
  })
})
