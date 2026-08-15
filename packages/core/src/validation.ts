import type { SceneDocument, SceneNode, SceneNodeId, SceneReference } from './model.js'

export type ValidationSeverity = 'error' | 'warning' | 'info'

export interface ValidationIssue {
  code: string
  severity: ValidationSeverity
  message: string
  nodeId?: SceneNodeId
  path?: string
  source?: 'core' | 'adapter' | 'bridge'
}

export interface ValidationResult {
  valid: boolean
  issues: readonly ValidationIssue[]
}

function addCoreError(
  issues: ValidationIssue[],
  code: string,
  message: string,
  details: Pick<ValidationIssue, 'nodeId' | 'path'> = {},
): void {
  issues.push({ code, severity: 'error', message, source: 'core', ...details })
}

function isFiniteTuple(value: unknown, length: number): value is readonly number[] {
  return (
    Array.isArray(value) &&
    value.length === length &&
    value.every((component) => typeof component === 'number' && Number.isFinite(component))
  )
}

function validateTransform(transform: unknown, node: SceneNode, issues: ValidationIssue[]): void {
  const path = `nodes.${node.id}.transform`
  if (!isRecord(transform)) {
    addCoreError(issues, 'core.invalid_transform', `Transform must be an object: ${node.id}`, {
      nodeId: node.id,
      path,
    })
    return
  }
  if (!isFiniteTuple(transform.position, 3)) {
    addCoreError(
      issues,
      'core.invalid_transform_position',
      `Transform position must contain three finite numbers: ${node.id}`,
      { nodeId: node.id, path: `${path}.position` },
    )
  }
  if (!isFiniteTuple(transform.rotation, 4)) {
    addCoreError(
      issues,
      'core.invalid_transform_rotation',
      `Transform rotation must contain four finite numbers: ${node.id}`,
      { nodeId: node.id, path: `${path}.rotation` },
    )
  } else if (transform.rotation.every((component) => component === 0)) {
    addCoreError(
      issues,
      'core.zero_quaternion',
      `Transform rotation quaternion must not be all zero: ${node.id}`,
      { nodeId: node.id, path: `${path}.rotation` },
    )
  }
  if (!isFiniteTuple(transform.scale, 3)) {
    addCoreError(
      issues,
      'core.invalid_transform_scale',
      `Transform scale must contain three finite numbers: ${node.id}`,
      { nodeId: node.id, path: `${path}.scale` },
    )
  }
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateReference(
  reference: unknown,
  path: string,
  node: SceneNode,
  document: SceneDocument,
  issues: ValidationIssue[],
): void {
  if (!isRecord(reference)) {
    addCoreError(issues, 'core.invalid_reference', `Invalid scene reference: ${path}`, {
      nodeId: node.id,
      path,
    })
    return
  }

  const typedReference = reference as Partial<SceneReference>
  if (typedReference.kind === 'node' && typeof typedReference.nodeId === 'string') {
    if (!document.nodes[typedReference.nodeId]) {
      addCoreError(
        issues,
        'core.dangling_node_reference',
        `Referenced node does not exist: ${typedReference.nodeId}`,
        { nodeId: node.id, path },
      )
    }
    return
  }

  if (typedReference.kind === 'resource' && typeof typedReference.resourceId === 'string') {
    if (!document.resources?.[typedReference.resourceId]) {
      addCoreError(
        issues,
        'core.dangling_resource_reference',
        `Referenced resource does not exist: ${typedReference.resourceId}`,
        { nodeId: node.id, path },
      )
    }
    return
  }

  addCoreError(issues, 'core.invalid_reference', `Invalid scene reference: ${path}`, {
    nodeId: node.id,
    path,
  })
}

function validateNodeReferences(
  node: SceneNode,
  document: SceneDocument,
  issues: ValidationIssue[],
): void {
  if (node.references === undefined) return
  if (!isRecord(node.references)) {
    addCoreError(
      issues,
      'core.invalid_references',
      `Node references must be an object: ${node.id}`,
      { nodeId: node.id, path: `nodes.${node.id}.references` },
    )
    return
  }

  for (const [name, value] of Object.entries(node.references)) {
    const path = `nodes.${node.id}.references.${name}`
    if (Array.isArray(value)) {
      value.forEach((reference, index) => {
        validateReference(reference, `${path}[${index}]`, node, document, issues)
      })
    } else {
      validateReference(value, path, node, document, issues)
    }
  }
}

function validateResources(document: SceneDocument, issues: ValidationIssue[]): void {
  for (const [key, resource] of Object.entries(document.resources ?? {})) {
    if (!isRecord(resource)) {
      addCoreError(issues, 'core.invalid_resource', `Resource must be an object: ${key}`, {
        path: `resources.${key}`,
      })
      continue
    }
    if (resource.id !== key) {
      addCoreError(
        issues,
        'core.resource_key_mismatch',
        `Resource key does not match resource id: ${key} != ${resource.id}`,
        { path: `resources.${key}.id` },
      )
    }
    if (typeof resource.id !== 'string' || resource.id.length === 0) {
      addCoreError(issues, 'core.invalid_resource_id', 'Resource id must not be empty', {
        path: `resources.${key}.id`,
      })
    }
    if (typeof resource.uri !== 'string' || resource.uri.length === 0) {
      addCoreError(
        issues,
        'core.invalid_resource_uri',
        `Resource URI must not be empty: ${String(resource.id)}`,
        { path: `resources.${key}.uri` },
      )
    }
  }
}

/**
 * 校验所有不依赖具体项目语义的 SceneDocument 结构。
 * Adapter 组件内部 schema 与业务规则必须在后续 Adapter Validator 阶段处理。
 */
export function validateSceneDocument(document: SceneDocument): ValidationResult {
  const issues: ValidationIssue[] = []
  const roots = new Set<SceneNodeId>()

  for (const [index, rootId] of document.rootNodeIds.entries()) {
    if (roots.has(rootId)) {
      addCoreError(issues, 'core.duplicate_root', `Root node is listed more than once: ${rootId}`, {
        nodeId: rootId,
        path: `rootNodeIds[${index}]`,
      })
    }
    roots.add(rootId)

    const root = document.nodes[rootId]
    if (!root) {
      addCoreError(issues, 'core.missing_root', `Root node does not exist: ${rootId}`, {
        nodeId: rootId,
        path: `rootNodeIds[${index}]`,
      })
      continue
    }
    if (root.parentId !== undefined) {
      addCoreError(issues, 'core.root_has_parent', `Root node must not have parentId: ${rootId}`, {
        nodeId: rootId,
        path: `rootNodeIds[${index}]`,
      })
    }
  }

  for (const [key, node] of Object.entries(document.nodes)) {
    if (node.id !== key) {
      addCoreError(
        issues,
        'core.node_key_mismatch',
        `Node key does not match node id: ${key} != ${node.id}`,
        { nodeId: node.id, path: `nodes.${key}.id` },
      )
    }
    if (node.id.length === 0) {
      addCoreError(issues, 'core.invalid_node_id', 'Scene node id must not be empty', {
        nodeId: node.id,
        path: `nodes.${key}.id`,
      })
    }
    if (node.type.length === 0) {
      addCoreError(
        issues,
        'core.invalid_node_type',
        `Scene node type must not be empty: ${node.id}`,
        {
          nodeId: node.id,
          path: `nodes.${key}.type`,
        },
      )
    }

    if (node.parentId !== undefined && !document.nodes[node.parentId]) {
      addCoreError(issues, 'core.missing_parent', `Parent node does not exist: ${node.parentId}`, {
        nodeId: node.id,
        path: `nodes.${key}.parentId`,
      })
    }

    if (node.parentId === undefined && !roots.has(node.id)) {
      addCoreError(
        issues,
        'core.unlisted_root',
        `Root node is missing from rootNodeIds: ${node.id}`,
        { nodeId: node.id, path: `nodes.${key}` },
      )
    }

    const visited = new Set<SceneNodeId>([node.id])
    let cursor = node.parentId
    while (cursor !== undefined) {
      if (visited.has(cursor)) {
        addCoreError(issues, 'core.parent_cycle', `Parent cycle detected from node: ${node.id}`, {
          nodeId: node.id,
          path: `nodes.${key}.parentId`,
        })
        break
      }
      visited.add(cursor)
      cursor = document.nodes[cursor]?.parentId
    }

    validateTransform(node.transform, node, issues)
    validateNodeReferences(node, document, issues)
  }

  validateResources(document, issues)
  return {
    valid: !issues.some((issue) => issue.severity === 'error'),
    issues,
  }
}
