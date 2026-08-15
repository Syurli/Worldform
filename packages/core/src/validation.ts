import type { SceneDocument, SceneNodeId } from './model.js'

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

export function validateSceneDocument(document: SceneDocument): ValidationResult {
  const issues: ValidationIssue[] = []
  const roots = new Set(document.rootNodeIds)

  for (const rootId of document.rootNodeIds) {
    const root = document.nodes[rootId]
    if (!root) {
      issues.push({
        code: 'core.missing_root',
        severity: 'error',
        message: `Root node does not exist: ${rootId}`,
        nodeId: rootId,
        source: 'core',
      })
      continue
    }
    if (root.parentId) {
      issues.push({
        code: 'core.root_has_parent',
        severity: 'error',
        message: `Root node must not have parentId: ${rootId}`,
        nodeId: rootId,
        source: 'core',
      })
    }
  }

  for (const node of Object.values(document.nodes)) {
    if (node.parentId && !document.nodes[node.parentId]) {
      issues.push({
        code: 'core.missing_parent',
        severity: 'error',
        message: `Parent node does not exist: ${node.parentId}`,
        nodeId: node.id,
        source: 'core',
      })
    }

    if (!node.parentId && !roots.has(node.id)) {
      issues.push({
        code: 'core.unlisted_root',
        severity: 'error',
        message: `Root node is missing from rootNodeIds: ${node.id}`,
        nodeId: node.id,
        source: 'core',
      })
    }

    const visited = new Set<SceneNodeId>([node.id])
    let cursor = node.parentId
    while (cursor) {
      if (visited.has(cursor)) {
        issues.push({
          code: 'core.parent_cycle',
          severity: 'error',
          message: `Parent cycle detected from node: ${node.id}`,
          nodeId: node.id,
          source: 'core',
        })
        break
      }
      visited.add(cursor)
      cursor = document.nodes[cursor]?.parentId
    }
  }

  return {
    valid: !issues.some((issue) => issue.severity === 'error'),
    issues,
  }
}
