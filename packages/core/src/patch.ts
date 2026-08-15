import type { SceneDocument, SceneNode, SceneNodeId } from './model.js'

export type ScenePatch =
  | { op: 'create'; node: SceneNode }
  | { op: 'update'; id: SceneNodeId; changes: Partial<Omit<SceneNode, 'id'>> }
  | { op: 'delete'; id: SceneNodeId; cascade?: boolean }

export interface ApplyPatchResult {
  document: SceneDocument
  applied: number
}

function collectDescendants(
  nodes: Readonly<Record<SceneNodeId, SceneNode>>,
  parentId: SceneNodeId,
): Set<SceneNodeId> {
  const result = new Set<SceneNodeId>()
  const queue = [parentId]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) break

    for (const node of Object.values(nodes)) {
      if (node.parentId === current && !result.has(node.id)) {
        result.add(node.id)
        queue.push(node.id)
      }
    }
  }

  return result
}

/**
 * Core 的最小纯函数 Patch 执行器。
 *
 * 这里故意不处理项目业务规则；Project Adapter 应在提交 Patch 前后执行自己的校验。
 * 后续 Undo / Ghost Preview 都应建立在同一 Patch 语义上。
 */
export function applyScenePatches(
  source: SceneDocument,
  patches: readonly ScenePatch[],
): ApplyPatchResult {
  const nodes: Record<SceneNodeId, SceneNode> = { ...source.nodes }
  let rootNodeIds = [...source.rootNodeIds]

  for (const patch of patches) {
    switch (patch.op) {
      case 'create': {
        if (nodes[patch.node.id]) {
          throw new Error(`Scene node already exists: ${patch.node.id}`)
        }
        if (patch.node.parentId && !nodes[patch.node.parentId]) {
          throw new Error(`Parent node does not exist: ${patch.node.parentId}`)
        }
        nodes[patch.node.id] = patch.node
        if (!patch.node.parentId) rootNodeIds.push(patch.node.id)
        break
      }
      case 'update': {
        const current = nodes[patch.id]
        if (!current) throw new Error(`Scene node does not exist: ${patch.id}`)

        const next = { ...current, ...patch.changes, id: current.id }
        if (next.parentId && !nodes[next.parentId]) {
          throw new Error(`Parent node does not exist: ${next.parentId}`)
        }

        nodes[patch.id] = next
        const wasRoot = !current.parentId
        const isRoot = !next.parentId
        if (wasRoot && !isRoot) rootNodeIds = rootNodeIds.filter((id) => id !== patch.id)
        if (!wasRoot && isRoot && !rootNodeIds.includes(patch.id)) rootNodeIds.push(patch.id)
        break
      }
      case 'delete': {
        if (!nodes[patch.id]) throw new Error(`Scene node does not exist: ${patch.id}`)
        const descendants = collectDescendants(nodes, patch.id)
        if (descendants.size > 0 && !patch.cascade) {
          throw new Error(`Scene node has descendants; use cascade delete: ${patch.id}`)
        }

        const removed = new Set<SceneNodeId>([patch.id, ...descendants])
        for (const id of removed) delete nodes[id]
        rootNodeIds = rootNodeIds.filter((id) => !removed.has(id))
        break
      }
    }
  }

  return {
    document: {
      ...source,
      nodes,
      rootNodeIds,
    },
    applied: patches.length,
  }
}
