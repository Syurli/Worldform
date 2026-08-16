import {
  assertAdapterMatchesDocument,
  WORLDFORM_ADAPTER_API_VERSION,
  type WorldformProjectAdapter,
} from '@worldform/adapter-api'
import { parseProtocolVersion, type SceneDocument } from '@worldform/core'

export interface AdapterContractIssue {
  code: `contract.${string}`
  message: string
  path?: string
}

export interface AdapterContractReport {
  valid: boolean
  issues: readonly AdapterContractIssue[]
}

export interface AdapterContractFixture {
  document: SceneDocument
  expectedValid?: boolean
}

function addIssue(
  issues: AdapterContractIssue[],
  code: AdapterContractIssue['code'],
  message: string,
  path?: string,
): void {
  issues.push({ code, message, ...(path ? { path } : {}) })
}

function findDuplicates(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }
  return [...duplicates]
}

/** 静态检查 Adapter manifest、descriptor、capability 与 export target。 */
export async function checkAdapterContract(
  adapter: WorldformProjectAdapter,
  fixture?: AdapterContractFixture,
): Promise<AdapterContractReport> {
  const issues: AdapterContractIssue[] = []
  const manifest = adapter.manifest
  if (!manifest.id)
    addIssue(issues, 'contract.missing_adapter_id', 'Adapter id is required', 'manifest.id')
  if (!manifest.displayName) {
    addIssue(
      issues,
      'contract.missing_display_name',
      'Adapter displayName is required',
      'manifest.displayName',
    )
  }
  for (const [path, version] of [
    ['manifest.adapterApiVersion', manifest.adapterApiVersion],
    ['manifest.sceneSchemaVersion', manifest.sceneSchemaVersion],
    ['manifest.version', manifest.version],
  ] as const) {
    try {
      parseProtocolVersion(version)
    } catch {
      addIssue(issues, 'contract.invalid_version', `Invalid version: ${version}`, path)
    }
  }
  if (manifest.adapterApiVersion !== WORLDFORM_ADAPTER_API_VERSION) {
    try {
      assertAdapterMatchesDocument(
        adapter,
        fixture?.document ?? {
          id: 'contract-version-probe',
          formatVersion: '1.0.0',
          nodes: {},
          rootNodeIds: [],
          resources: {},
        },
      )
    } catch (error) {
      addIssue(
        issues,
        'contract.incompatible_adapter_api',
        error instanceof Error ? error.message : String(error),
        'manifest.adapterApiVersion',
      )
    }
  }

  const nodeTypes = adapter.listNodeTypes()
  const components = adapter.listComponentTypes()
  const capabilities = adapter.listCapabilities()
  const validators = adapter.listValidators()
  const exportTargets = adapter.listExportTargets()

  for (const duplicate of findDuplicates(nodeTypes.map((item) => item.type))) {
    addIssue(issues, 'contract.duplicate_node_type', `Duplicate node type: ${duplicate}`)
  }
  for (const duplicate of findDuplicates(components.map((item) => item.id))) {
    addIssue(issues, 'contract.duplicate_component', `Duplicate component: ${duplicate}`)
  }
  for (const duplicate of findDuplicates(capabilities.map((item) => item.id))) {
    addIssue(issues, 'contract.duplicate_capability', `Duplicate capability: ${duplicate}`)
  }
  for (const duplicate of findDuplicates(validators.map((item) => item.id))) {
    addIssue(issues, 'contract.duplicate_validator', `Duplicate validator: ${duplicate}`)
  }
  for (const duplicate of findDuplicates(exportTargets.map((item) => item.id))) {
    addIssue(issues, 'contract.duplicate_export_target', `Duplicate export target: ${duplicate}`)
  }

  const componentIds = new Set(components.map((component) => component.id))
  for (const nodeType of nodeTypes) {
    for (const componentId of nodeType.components) {
      if (!componentIds.has(componentId)) {
        addIssue(
          issues,
          'contract.unknown_component_reference',
          `Node type ${nodeType.type} references unknown component ${componentId}`,
        )
      }
    }
  }
  for (const component of components) {
    for (const duplicate of findDuplicates(component.properties.map((property) => property.id))) {
      addIssue(
        issues,
        'contract.duplicate_property',
        `Component ${component.id} has duplicate property ${duplicate}`,
      )
    }
    for (const property of component.properties) {
      if (property.type === 'enum' && (property.enumOptions?.length ?? 0) === 0) {
        addIssue(
          issues,
          'contract.empty_enum',
          `Enum property ${component.id}.${property.id} must declare enumOptions`,
        )
      }
      if (
        property.minimum !== undefined &&
        property.maximum !== undefined &&
        property.minimum > property.maximum
      ) {
        addIssue(
          issues,
          'contract.invalid_number_range',
          `Property ${component.id}.${property.id} has minimum greater than maximum`,
        )
      }
    }
  }

  if (fixture) {
    try {
      assertAdapterMatchesDocument(adapter, fixture.document)
      const result = await adapter.validateDocument(fixture.document)
      if (fixture.expectedValid !== undefined && result.valid !== fixture.expectedValid) {
        addIssue(
          issues,
          'contract.unexpected_fixture_result',
          `Fixture validation expected ${fixture.expectedValid} but received ${result.valid}`,
        )
      }
    } catch (error) {
      addIssue(
        issues,
        'contract.fixture_failed',
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  return { valid: issues.length === 0, issues }
}

export async function assertAdapterContract(
  adapter: WorldformProjectAdapter,
  fixture?: AdapterContractFixture,
): Promise<void> {
  const report = await checkAdapterContract(adapter, fixture)
  if (!report.valid) {
    throw new Error(
      `Adapter contract failed:\n${report.issues.map((issue) => `- ${issue.code}: ${issue.message}`).join('\n')}`,
    )
  }
}
