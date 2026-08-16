import type { ProjectNodeTypeDescriptor } from '@worldform/adapter-api'
import type { SceneDocument, SceneNode, ScenePatch, TransformData } from '@worldform/core'
import { Euler, Quaternion } from 'three'
import { WORLDFORM_PASCAL_NODE_KIND, WORLDFORM_PASCAL_PLUGIN_ID } from './constants.js'

export interface PascalWorldformNode {
  id: string
  type: typeof WORLDFORM_PASCAL_NODE_KIND
  object: 'node'
  parentId: string | null
  children: string[]
  visible: boolean
  metadata: Record<string, unknown>
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  worldformType: string
  worldformName: string
  worldformComponents: Record<string, unknown>
  previewKind: 'box' | 'sphere' | 'zone' | 'marker' | 'light' | 'custom'
  previewColor: string
  dimensions: [number, number, number]
}

export interface PascalSceneProjection {
  nodes: Record<string, PascalWorldformNode>
  rootNodeIds: string[]
  installedPlugins: string[]
}

const DEFAULT_PREVIEW_COLOR = '#6f8cff'
const DEFAULT_DIMENSIONS: [number, number, number] = [1, 1, 1]

function cloneJsonValue<T>(value: T): T {
  return structuredClone(value)
}

function quaternionToEuler(transform: TransformData): [number, number, number] {
  const quaternion = new Quaternion(...transform.rotation)
  const euler = new Euler().setFromQuaternion(quaternion, 'XYZ')
  return [euler.x, euler.y, euler.z]
}

function eulerToQuaternion(rotation: readonly [number, number, number]): TransformData['rotation'] {
  const quaternion = new Quaternion().setFromEuler(new Euler(...rotation, 'XYZ')).normalize()
  return [quaternion.x, quaternion.y, quaternion.z, quaternion.w]
}

function readDimensions(node: SceneNode): [number, number, number] {
  const value = node.components?.['example.dimensions']
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return [...DEFAULT_DIMENSIONS]
  }
  const record = value as Record<string, unknown>
  const width = typeof record.width === 'number' ? record.width : DEFAULT_DIMENSIONS[0]
  const height = typeof record.height === 'number' ? record.height : DEFAULT_DIMENSIONS[1]
  const depth = typeof record.depth === 'number' ? record.depth : DEFAULT_DIMENSIONS[2]
  return [width, height, depth]
}

/**
 * 将正式 SceneDocument 投影为 Pascal 工作副本。
 *
 * 投影只使用一个 namespaced Pascal 节点种类，真实项目类型保存在 worldformType 中，
 * 因而第三方 Adapter 增加类型时无需修改 Pascal dispatcher。
 */
export function projectSceneDocumentToPascal(
  document: SceneDocument,
  descriptors: readonly ProjectNodeTypeDescriptor[],
): PascalSceneProjection {
  const byType = new Map(descriptors.map((descriptor) => [descriptor.type, descriptor]))
  const childrenByParent = new Map<string, string[]>()
  for (const node of Object.values(document.nodes)) {
    if (!node.parentId) continue
    const children = childrenByParent.get(node.parentId) ?? []
    children.push(node.id)
    childrenByParent.set(node.parentId, children)
  }

  const nodes: Record<string, PascalWorldformNode> = {}
  for (const node of Object.values(document.nodes)) {
    const descriptor = byType.get(node.type)
    nodes[node.id] = {
      id: node.id,
      type: WORLDFORM_PASCAL_NODE_KIND,
      object: 'node',
      parentId: node.parentId ?? null,
      children: [...(childrenByParent.get(node.id) ?? [])],
      visible: true,
      metadata: { worldformProjection: true },
      position: [...node.transform.position],
      rotation: quaternionToEuler(node.transform),
      scale: [...node.transform.scale],
      worldformType: node.type,
      worldformName: node.name ?? descriptor?.displayName ?? node.id,
      worldformComponents: cloneJsonValue({ ...(node.components ?? {}) }),
      previewKind: descriptor?.preview?.kind ?? 'custom',
      previewColor: descriptor?.preview?.color ?? DEFAULT_PREVIEW_COLOR,
      dimensions: readDimensions(node),
    }
  }

  return {
    nodes,
    rootNodeIds: [...document.rootNodeIds],
    installedPlugins: [WORLDFORM_PASCAL_PLUGIN_ID],
  }
}

function transformFromPascal(node: PascalWorldformNode): TransformData {
  return {
    position: [...node.position],
    rotation: eulerToQuaternion(node.rotation),
    scale: [...node.scale],
  }
}

function valuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

/** 把 Pascal 工作副本与基线文档的差异收敛为可审查的 Worldform Patch。 */
export function collectPascalProjectionPatches(
  baseline: SceneDocument,
  projection: PascalSceneProjection,
): readonly ScenePatch[] {
  const patches: ScenePatch[] = []
  const projectedIds = new Set(Object.keys(projection.nodes))

  for (const node of Object.values(baseline.nodes)) {
    const projected = projection.nodes[node.id]
    if (!projected) {
      // 只为缺失子树的最高层节点生成级联删除，避免先删父节点后再次删除已不存在的子节点。
      const parentIsAlsoMissing = node.parentId ? !projectedIds.has(node.parentId) : false
      if (!parentIsAlsoMissing) patches.push({ op: 'delete', id: node.id, cascade: true })
      continue
    }

    const transform = transformFromPascal(projected)
    if (!valuesEqual(transform, node.transform)) {
      patches.push({ op: 'update', id: node.id, changes: { transform } })
    }
  }

  for (const projected of Object.values(projection.nodes)) {
    if (baseline.nodes[projected.id]) continue
    patches.push({
      op: 'create',
      node: {
        id: projected.id,
        type: projected.worldformType,
        name: projected.worldformName,
        ...(projected.parentId ? { parentId: projected.parentId } : {}),
        transform: transformFromPascal(projected),
        components: cloneJsonValue(projected.worldformComponents),
      },
    })
  }

  return patches
}
