import {
  createAdapterValidationIssue,
  type ProjectComponentDescriptor,
  type ProjectNodeTypeDescriptor,
  type ProjectPropertyDescriptor,
} from '@worldform/adapter-api'
import type { SceneDocument, ValidationIssue, ValidationResult } from '@worldform/core'

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function matchesPropertyType(value: unknown, descriptor: ProjectPropertyDescriptor): boolean {
  switch (descriptor.type) {
    case 'number':
      return typeof value === 'number' && Number.isFinite(value)
    case 'string':
      return typeof value === 'string'
    case 'boolean':
      return typeof value === 'boolean'
    case 'enum':
      return (
        typeof value === 'string' &&
        (descriptor.enumOptions ?? []).some((option) => option.value === value)
      )
    case 'node-reference':
      return isRecord(value) && value.kind === 'node' && typeof value.nodeId === 'string'
    case 'resource-reference':
      return isRecord(value) && value.kind === 'resource' && typeof value.resourceId === 'string'
  }
}

function validateNumberRange(
  adapterId: string,
  value: number,
  descriptor: ProjectPropertyDescriptor,
  path: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (descriptor.minimum !== undefined && value < descriptor.minimum) {
    issues.push(
      createAdapterValidationIssue(adapterId, {
        code: 'adapter.property_below_minimum',
        severity: 'error',
        message: `${descriptor.label} must be at least ${descriptor.minimum}`,
        path,
      }),
    )
  }
  if (descriptor.maximum !== undefined && value > descriptor.maximum) {
    issues.push(
      createAdapterValidationIssue(adapterId, {
        code: 'adapter.property_above_maximum',
        severity: 'error',
        message: `${descriptor.label} must be at most ${descriptor.maximum}`,
        path,
      }),
    )
  }
  return issues
}

/**
 * 根据公开 descriptor 校验节点与组件基础结构。
 * 真实项目算法仍由 Adapter 自己的 validator/capability 负责。
 */
export function validateDocumentDescriptors(input: {
  adapterId: string
  document: SceneDocument
  nodeTypes: readonly ProjectNodeTypeDescriptor[]
  components: readonly ProjectComponentDescriptor[]
}): ValidationResult {
  const issues: ValidationIssue[] = []
  const nodeTypes = new Map(input.nodeTypes.map((descriptor) => [descriptor.type, descriptor]))
  const components = new Map(input.components.map((descriptor) => [descriptor.id, descriptor]))

  for (const node of Object.values(input.document.nodes)) {
    const nodeDescriptor = nodeTypes.get(node.type)
    if (!nodeDescriptor) {
      issues.push(
        createAdapterValidationIssue(input.adapterId, {
          code: 'adapter.unknown_node_type',
          severity: 'error',
          message: `Unknown adapter node type: ${node.type}`,
          nodeId: node.id,
          path: `nodes.${node.id}.type`,
        }),
      )
      continue
    }

    for (const [componentId, componentValue] of Object.entries(node.components ?? {})) {
      const componentDescriptor = components.get(componentId)
      const path = `nodes.${node.id}.components.${componentId}`
      if (!componentDescriptor || !nodeDescriptor.components.includes(componentId)) {
        issues.push(
          createAdapterValidationIssue(input.adapterId, {
            code: 'adapter.component_not_allowed',
            severity: 'error',
            message: `Component ${componentId} is not allowed on ${node.type}`,
            nodeId: node.id,
            path,
          }),
        )
        continue
      }
      if (!isRecord(componentValue)) {
        issues.push(
          createAdapterValidationIssue(input.adapterId, {
            code: 'adapter.component_not_object',
            severity: 'error',
            message: `Component ${componentId} must be an object`,
            nodeId: node.id,
            path,
          }),
        )
        continue
      }

      const propertyIds = new Set(componentDescriptor.properties.map((property) => property.id))
      for (const key of Object.keys(componentValue)) {
        if (!propertyIds.has(key)) {
          issues.push(
            createAdapterValidationIssue(input.adapterId, {
              code: 'adapter.unknown_property',
              severity: 'error',
              message: `Unknown property ${componentId}.${key}`,
              nodeId: node.id,
              path: `${path}.${key}`,
            }),
          )
        }
      }

      for (const property of componentDescriptor.properties) {
        const propertyPath = `${path}.${property.id}`
        const value = componentValue[property.id]
        if (value === undefined) {
          if (property.required) {
            issues.push(
              createAdapterValidationIssue(input.adapterId, {
                code: 'adapter.required_property_missing',
                severity: 'error',
                message: `Required property is missing: ${componentId}.${property.id}`,
                nodeId: node.id,
                path: propertyPath,
              }),
            )
          }
          continue
        }

        if (!matchesPropertyType(value, property)) {
          issues.push(
            createAdapterValidationIssue(input.adapterId, {
              code: 'adapter.invalid_property_type',
              severity: 'error',
              message: `Invalid value for ${componentId}.${property.id}; expected ${property.type}`,
              nodeId: node.id,
              path: propertyPath,
            }),
          )
          continue
        }
        if (property.type === 'number') {
          issues.push(
            ...validateNumberRange(input.adapterId, value as number, property, propertyPath),
          )
        }
      }
    }
  }

  return { valid: !issues.some((issue) => issue.severity === 'error'), issues }
}
