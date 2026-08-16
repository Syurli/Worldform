import {
  createAdapterValidationIssue,
  ProjectAdapterError,
  WORLDFORM_ADAPTER_API_VERSION,
  type ProjectCapabilityRequest,
  type ProjectCapabilityResult,
  type ProjectInvocationContext,
  type WorldformProjectAdapter,
} from '@worldform/adapter-api'
import { defineProjectAdapter, validateDocumentDescriptors } from '@worldform/adapter-sdk'
import {
  IDENTITY_TRANSFORM,
  mergeValidationResults,
  serializeSceneDocument,
  type SceneDocument,
  type ValidationIssue,
  type ValidationResult,
  type Vec3,
} from '@worldform/core'
import { EXAMPLE_COMPONENTS, EXAMPLE_NODE_TYPES } from './descriptors.js'

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateExampleReferences(document: SceneDocument): ValidationResult {
  const issues: ValidationIssue[] = []
  for (const node of Object.values(document.nodes)) {
    const target = node.components?.['example.target']
    if (isRecord(target) && isRecord(target.node) && target.node.kind === 'node') {
      const nodeId = target.node.nodeId
      if (typeof nodeId === 'string' && !document.nodes[nodeId]) {
        issues.push(
          createAdapterValidationIssue('example.adapter', {
            code: 'example.missing_target_node',
            severity: 'error',
            message: `目标节点不存在：${nodeId}`,
            nodeId: node.id,
            path: `nodes.${node.id}.components.example.target.node`,
          }),
        )
      }
    }

    const asset = node.components?.['example.asset']
    if (isRecord(asset) && isRecord(asset.resource) && asset.resource.kind === 'resource') {
      const resourceId = asset.resource.resourceId
      if (typeof resourceId === 'string' && !document.resources[resourceId]) {
        issues.push(
          createAdapterValidationIssue('example.adapter', {
            code: 'example.missing_asset_resource',
            severity: 'error',
            message: `资源不存在：${resourceId}`,
            nodeId: node.id,
            path: `nodes.${node.id}.components.example.asset.resource`,
          }),
        )
      }
    }
  }
  return { valid: issues.length === 0, issues }
}

function readCreateMarkerInput(input: unknown): { id: string; label: string; position: Vec3 } {
  if (!isRecord(input) || typeof input.id !== 'string' || typeof input.label !== 'string') {
    throw new ProjectAdapterError(
      'adapter.execution_failed',
      'createMarker input requires string id and label',
      'example.adapter',
    )
  }
  if (
    !Array.isArray(input.position) ||
    input.position.length !== 3 ||
    !input.position.every((value) => typeof value === 'number' && Number.isFinite(value))
  ) {
    throw new ProjectAdapterError(
      'adapter.execution_failed',
      'createMarker input requires a finite [x, y, z] position',
      'example.adapter',
    )
  }
  return { id: input.id, label: input.label, position: input.position as unknown as Vec3 }
}

async function callExampleCapability(
  request: ProjectCapabilityRequest,
  context?: ProjectInvocationContext,
): Promise<ProjectCapabilityResult> {
  context?.signal.throwIfAborted()
  switch (request.capabilityId) {
    case 'countObjects': {
      const byType: Record<string, number> = {}
      for (const node of Object.values(request.document.nodes)) {
        byType[node.type] = (byType[node.type] ?? 0) + 1
      }
      return { output: { total: Object.keys(request.document.nodes).length, byType } }
    }
    case 'createMarker': {
      const input = readCreateMarkerInput(request.input)
      return {
        output: { markerId: input.id },
        patches: [
          {
            op: 'create',
            node: {
              id: input.id,
              type: 'example.marker',
              transform: { ...IDENTITY_TRANSFORM, position: input.position },
              components: {
                'example.presentation': {
                  label: input.label,
                  visible: true,
                  tone: 'warm',
                },
              },
            },
          },
        ],
      }
    }
    case 'validateScene':
      return { validation: validateExampleDocument(request.document) }
    default:
      throw new ProjectAdapterError(
        'adapter.capability_not_found',
        `Unknown Example capability: ${request.capabilityId}`,
        'example.adapter',
      )
  }
}

export function validateExampleDocument(document: SceneDocument): ValidationResult {
  return mergeValidationResults(
    validateDocumentDescriptors({
      adapterId: 'example.adapter',
      document,
      nodeTypes: EXAMPLE_NODE_TYPES,
      components: EXAMPLE_COMPONENTS,
    }),
    validateExampleReferences(document),
  )
}

export const exampleAdapter: WorldformProjectAdapter = defineProjectAdapter({
  manifest: {
    id: 'example.adapter',
    displayName: 'Worldform Example Adapter',
    description: '用于验证第三方节点、组件、Capability 与 Export 的通用示例。',
    adapterApiVersion: WORLDFORM_ADAPTER_API_VERSION,
    sceneSchemaVersion: '1.0.0',
    version: '1.0.0',
  },
  listNodeTypes: () => EXAMPLE_NODE_TYPES,
  listComponentTypes: () => EXAMPLE_COMPONENTS,
  listValidators: () => [
    { id: 'descriptor', displayName: 'Descriptor Schema' },
    { id: 'references', displayName: 'Example References' },
  ],
  listCapabilities: () => [
    {
      id: 'validateScene',
      title: 'Validate Scene',
      mutatesScene: false,
      inputSchema: { type: 'object', additionalProperties: false },
    },
    {
      id: 'countObjects',
      title: 'Count Objects',
      mutatesScene: false,
      inputSchema: { type: 'object', additionalProperties: false },
    },
    {
      id: 'createMarker',
      title: 'Create Marker',
      mutatesScene: true,
      inputSchema: {
        type: 'object',
        required: ['id', 'label', 'position'],
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          position: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'number' } },
        },
      },
    },
  ],
  validateDocument: validateExampleDocument,
  callCapability: callExampleCapability,
  listExportTargets: () => [
    { id: 'example-json', displayName: 'Example Scene JSON', description: '稳定 Worldform JSON。' },
  ],
  async exportDocument(targetId, document, context) {
    context?.signal.throwIfAborted()
    if (targetId !== 'example-json') {
      throw new ProjectAdapterError(
        'adapter.export_target_not_found',
        `Unknown Example export target: ${targetId}`,
        'example.adapter',
      )
    }
    return {
      fileName: `${document.id}.example.json`,
      mediaType: 'application/json',
      content: serializeSceneDocument(document),
    }
  },
})
