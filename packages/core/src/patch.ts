import { cloneSceneData } from './clone.js'
import type {
  SceneDocument,
  SceneNode,
  SceneNodeId,
  SceneResource,
  SceneResourceId,
} from './model.js'

export type SceneNodeOptionalKey =
  | 'name'
  | 'parentId'
  | 'components'
  | 'references'
  | 'tags'
  | 'metadata'

export interface CreateSceneNodePatch {
  op: 'create'
  node: SceneNode
  /** 根节点插入位置。仅在创建无 parentId 的节点时有效。 */
  rootIndex?: number
}

export interface UpdateSceneNodePatch {
  op: 'update'
  id: SceneNodeId
  changes: Partial<Omit<SceneNode, 'id'>>
  /**
   * 显式删除可选字段。不能用 undefined 表达删除，因为 undefined 不是稳定 JSON 数据。
   */
  unset?: readonly SceneNodeOptionalKey[]
  /** 更新后节点为根节点时，可显式恢复或调整其根列表位置。 */
  rootIndex?: number
}

export interface DeleteSceneNodePatch {
  op: 'delete'
  id: SceneNodeId
  cascade?: boolean
}

export type SceneResourceOptionalKey = 'type' | 'metadata'

export interface CreateSceneResourcePatch {
  op: 'resource.create'
  resource: SceneResource
}

export interface UpdateSceneResourcePatch {
  op: 'resource.update'
  id: SceneResourceId
  changes: Partial<Omit<SceneResource, 'id'>>
  unset?: readonly SceneResourceOptionalKey[]
}

export interface DeleteSceneResourcePatch {
  op: 'resource.delete'
  id: SceneResourceId
}

export interface SetSceneComponentPatch {
  op: 'component.set'
  id: SceneNodeId
  component: string
  value: unknown
}

export interface DeleteSceneComponentPatch {
  op: 'component.delete'
  id: SceneNodeId
  component: string
}

export interface SetSceneComponentPropertyPatch {
  op: 'component.setProperty'
  id: SceneNodeId
  component: string
  /** Phase 1 属性路径只穿过普通对象，不隐式操作数组索引。 */
  path: readonly string[]
  value: unknown
}

export interface DeleteSceneComponentPropertyPatch {
  op: 'component.deleteProperty'
  id: SceneNodeId
  component: string
  path: readonly string[]
}

export type ScenePatch =
  | CreateSceneNodePatch
  | UpdateSceneNodePatch
  | DeleteSceneNodePatch
  | CreateSceneResourcePatch
  | UpdateSceneResourcePatch
  | DeleteSceneResourcePatch
  | SetSceneComponentPatch
  | DeleteSceneComponentPatch
  | SetSceneComponentPropertyPatch
  | DeleteSceneComponentPropertyPatch

export interface ApplyPatchResult {
  document: SceneDocument
  applied: number
}

export interface ApplyPatchWithInverseResult extends ApplyPatchResult {
  /** 按返回顺序执行即可恢复 source 文档。 */
  inversePatches: readonly ScenePatch[]
}

const OPTIONAL_NODE_KEYS = new Set<SceneNodeOptionalKey>([
  'name',
  'parentId',
  'components',
  'references',
  'tags',
  'metadata',
])

const MUTABLE_NODE_KEYS = new Set<keyof Omit<SceneNode, 'id'>>([
  'type',
  'name',
  'parentId',
  'transform',
  'components',
  'references',
  'tags',
  'metadata',
])

const OPTIONAL_RESOURCE_KEYS = new Set<SceneResourceOptionalKey>(['type', 'metadata'])

const MUTABLE_RESOURCE_KEYS = new Set<keyof Omit<SceneResource, 'id'>>(['uri', 'type', 'metadata'])

const UNSAFE_PROPERTY_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

interface MutableDocumentState {
  nodes: Record<SceneNodeId, SceneNode>
  rootNodeIds: SceneNodeId[]
  resources: Record<SceneResourceId, SceneResource>
}

function isRoot(node: SceneNode): boolean {
  return node.parentId === undefined
}

function assertRootIndex(rootIndex: number, maximum: number): void {
  if (!Number.isInteger(rootIndex) || rootIndex < 0 || rootIndex > maximum) {
    throw new RangeError(`Invalid root index: ${rootIndex}`)
  }
}

function insertRoot(rootNodeIds: SceneNodeId[], id: SceneNodeId, rootIndex?: number): void {
  if (rootNodeIds.includes(id)) {
    throw new Error(`Root node is already listed: ${id}`)
  }

  if (rootIndex === undefined) {
    rootNodeIds.push(id)
    return
  }

  assertRootIndex(rootIndex, rootNodeIds.length)
  rootNodeIds.splice(rootIndex, 0, id)
}

function moveRoot(rootNodeIds: SceneNodeId[], id: SceneNodeId, rootIndex: number): void {
  const currentIndex = rootNodeIds.indexOf(id)
  if (currentIndex < 0) throw new Error(`Root node is not listed: ${id}`)

  rootNodeIds.splice(currentIndex, 1)
  assertRootIndex(rootIndex, rootNodeIds.length)
  rootNodeIds.splice(rootIndex, 0, id)
}

/** 以父节点优先的顺序收集整个子树，供级联删除及逆操作恢复使用。 */
function collectSubtree(
  nodes: Readonly<Record<SceneNodeId, SceneNode>>,
  rootId: SceneNodeId,
): SceneNode[] {
  const result: SceneNode[] = []
  const visited = new Set<SceneNodeId>()
  const queue = [rootId]

  while (queue.length > 0) {
    const currentId = queue.shift()
    if (currentId === undefined || visited.has(currentId)) continue
    visited.add(currentId)

    const current = nodes[currentId]
    if (current) result.push(current)

    for (const node of Object.values(nodes)) {
      if (node.parentId === currentId && !visited.has(node.id)) queue.push(node.id)
    }
  }

  return result
}

function assertUpdatePatch(patch: UpdateSceneNodePatch): void {
  const changeKeys = Object.keys(patch.changes)
  for (const key of changeKeys) {
    if (!MUTABLE_NODE_KEYS.has(key as keyof Omit<SceneNode, 'id'>)) {
      throw new Error(`Scene node field cannot be updated: ${key}`)
    }
    if (patch.changes[key as keyof typeof patch.changes] === undefined) {
      throw new Error(`Use unset instead of undefined for scene node field: ${key}`)
    }
  }

  const seenUnset = new Set<SceneNodeOptionalKey>()
  for (const key of patch.unset ?? []) {
    if (!OPTIONAL_NODE_KEYS.has(key)) throw new Error(`Scene node field cannot be unset: ${key}`)
    if (seenUnset.has(key)) throw new Error(`Scene node field is unset more than once: ${key}`)
    if (Object.hasOwn(patch.changes, key)) {
      throw new Error(`Scene node field cannot be changed and unset together: ${key}`)
    }
    seenUnset.add(key)
  }
}

function applyCreatePatch(
  state: MutableDocumentState,
  patch: CreateSceneNodePatch,
): readonly ScenePatch[] {
  if (state.nodes[patch.node.id]) {
    throw new Error(`Scene node already exists: ${patch.node.id}`)
  }
  if (patch.node.parentId !== undefined && !state.nodes[patch.node.parentId]) {
    throw new Error(`Parent node does not exist: ${patch.node.parentId}`)
  }
  if (!isRoot(patch.node) && patch.rootIndex !== undefined) {
    throw new Error(`rootIndex can only be used for a root node: ${patch.node.id}`)
  }

  const node = cloneSceneData(patch.node)
  state.nodes[node.id] = node
  if (isRoot(node)) insertRoot(state.rootNodeIds, node.id, patch.rootIndex)

  return [{ op: 'delete', id: node.id, cascade: true }]
}

function createInverseUpdatePatch(
  current: SceneNode,
  patch: UpdateSceneNodePatch,
  rootIndex: number | undefined,
): UpdateSceneNodePatch {
  const changes: Partial<Omit<SceneNode, 'id'>> = {}
  const unset: SceneNodeOptionalKey[] = []
  const touchedKeys = new Set<string>([...Object.keys(patch.changes), ...(patch.unset ?? [])])

  for (const key of touchedKeys) {
    if (Object.hasOwn(current, key)) {
      Object.assign(changes, { [key]: cloneSceneData(current[key as keyof SceneNode]) })
    } else if (OPTIONAL_NODE_KEYS.has(key as SceneNodeOptionalKey)) {
      unset.push(key as SceneNodeOptionalKey)
    }
  }

  return {
    op: 'update',
    id: current.id,
    changes,
    ...(unset.length > 0 ? { unset } : {}),
    ...(rootIndex !== undefined ? { rootIndex } : {}),
  }
}

function applyUpdatePatch(
  state: MutableDocumentState,
  patch: UpdateSceneNodePatch,
): readonly ScenePatch[] {
  assertUpdatePatch(patch)
  const current = state.nodes[patch.id]
  if (!current) throw new Error(`Scene node does not exist: ${patch.id}`)

  const previousRootIndex = isRoot(current) ? state.rootNodeIds.indexOf(current.id) : undefined
  if (previousRootIndex !== undefined && previousRootIndex < 0) {
    throw new Error(`Root node is not listed: ${current.id}`)
  }
  const inverse = createInverseUpdatePatch(current, patch, previousRootIndex)

  const next = cloneSceneData({ ...current, ...patch.changes, id: current.id })
  for (const key of patch.unset ?? []) delete next[key]

  if (next.parentId !== undefined && !state.nodes[next.parentId]) {
    throw new Error(`Parent node does not exist: ${next.parentId}`)
  }

  state.nodes[patch.id] = next
  const wasRoot = isRoot(current)
  const nextIsRoot = isRoot(next)

  if (wasRoot && !nextIsRoot) {
    state.rootNodeIds = state.rootNodeIds.filter((id) => id !== patch.id)
  } else if (!wasRoot && nextIsRoot) {
    insertRoot(state.rootNodeIds, patch.id, patch.rootIndex)
  } else if (nextIsRoot && patch.rootIndex !== undefined) {
    moveRoot(state.rootNodeIds, patch.id, patch.rootIndex)
  } else if (!nextIsRoot && patch.rootIndex !== undefined) {
    throw new Error(`rootIndex can only be used when the updated node is a root: ${patch.id}`)
  }

  return [inverse]
}

function applyDeletePatch(
  state: MutableDocumentState,
  patch: DeleteSceneNodePatch,
): readonly ScenePatch[] {
  const target = state.nodes[patch.id]
  if (!target) throw new Error(`Scene node does not exist: ${patch.id}`)

  const subtree = collectSubtree(state.nodes, patch.id)
  if (subtree.length > 1 && !patch.cascade) {
    throw new Error(`Scene node has descendants; use cascade delete: ${patch.id}`)
  }

  const inversePatches: ScenePatch[] = subtree.map((node) => {
    const rootIndex = isRoot(node) ? state.rootNodeIds.indexOf(node.id) : undefined
    return {
      op: 'create',
      node: cloneSceneData(node),
      ...(rootIndex !== undefined ? { rootIndex } : {}),
    }
  })

  const removedIds = new Set(subtree.map((node) => node.id))
  for (const id of removedIds) delete state.nodes[id]
  state.rootNodeIds = state.rootNodeIds.filter((id) => !removedIds.has(id))

  return inversePatches
}

function assertResourceUpdatePatch(patch: UpdateSceneResourcePatch): void {
  for (const key of Object.keys(patch.changes)) {
    if (!MUTABLE_RESOURCE_KEYS.has(key as keyof Omit<SceneResource, 'id'>)) {
      throw new Error(`Scene resource field cannot be updated: ${key}`)
    }
    if (patch.changes[key as keyof typeof patch.changes] === undefined) {
      throw new Error(`Use unset instead of undefined for scene resource field: ${key}`)
    }
  }

  const seenUnset = new Set<SceneResourceOptionalKey>()
  for (const key of patch.unset ?? []) {
    if (!OPTIONAL_RESOURCE_KEYS.has(key)) {
      throw new Error(`Scene resource field cannot be unset: ${key}`)
    }
    if (seenUnset.has(key)) throw new Error(`Scene resource field is unset more than once: ${key}`)
    if (Object.hasOwn(patch.changes, key)) {
      throw new Error(`Scene resource field cannot be changed and unset together: ${key}`)
    }
    seenUnset.add(key)
  }
}

function applyCreateResourcePatch(
  state: MutableDocumentState,
  patch: CreateSceneResourcePatch,
): readonly ScenePatch[] {
  if (state.resources[patch.resource.id]) {
    throw new Error(`Scene resource already exists: ${patch.resource.id}`)
  }
  state.resources[patch.resource.id] = cloneSceneData(patch.resource)
  return [{ op: 'resource.delete', id: patch.resource.id }]
}

function applyUpdateResourcePatch(
  state: MutableDocumentState,
  patch: UpdateSceneResourcePatch,
): readonly ScenePatch[] {
  assertResourceUpdatePatch(patch)
  const current = state.resources[patch.id]
  if (!current) throw new Error(`Scene resource does not exist: ${patch.id}`)

  const changes: Partial<Omit<SceneResource, 'id'>> = {}
  const unset: SceneResourceOptionalKey[] = []
  const touchedKeys = new Set<string>([...Object.keys(patch.changes), ...(patch.unset ?? [])])
  for (const key of touchedKeys) {
    if (Object.hasOwn(current, key)) {
      Object.assign(changes, { [key]: cloneSceneData(current[key as keyof SceneResource]) })
    } else if (OPTIONAL_RESOURCE_KEYS.has(key as SceneResourceOptionalKey)) {
      unset.push(key as SceneResourceOptionalKey)
    }
  }

  const next = cloneSceneData({ ...current, ...patch.changes, id: current.id })
  for (const key of patch.unset ?? []) delete next[key]
  state.resources[patch.id] = next

  return [
    {
      op: 'resource.update',
      id: current.id,
      changes,
      ...(unset.length > 0 ? { unset } : {}),
    },
  ]
}

function applyDeleteResourcePatch(
  state: MutableDocumentState,
  patch: DeleteSceneResourcePatch,
): readonly ScenePatch[] {
  const current = state.resources[patch.id]
  if (!current) throw new Error(`Scene resource does not exist: ${patch.id}`)
  delete state.resources[patch.id]
  return [{ op: 'resource.create', resource: cloneSceneData(current) }]
}

function assertComponentName(component: string): void {
  if (component.length === 0) throw new Error('Scene component name must not be empty')
}

function assertComponentPropertyPath(path: readonly string[]): void {
  if (path.length === 0) throw new Error('Scene component property path must not be empty')
  for (const segment of path) {
    if (segment.length === 0)
      throw new Error('Scene component property path contains an empty segment')
    if (UNSAFE_PROPERTY_KEYS.has(segment)) {
      throw new Error(`Unsafe scene component property path segment: ${segment}`)
    }
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function getNodeForComponent(state: MutableDocumentState, id: SceneNodeId): SceneNode {
  const node = state.nodes[id]
  if (!node) throw new Error(`Scene node does not exist: ${id}`)
  return node
}

function setComponentValue(
  state: MutableDocumentState,
  node: SceneNode,
  component: string,
  value: unknown,
): void {
  const components = cloneSceneData({ ...(node.components ?? {}) })
  components[component] = cloneSceneData(value)
  state.nodes[node.id] = { ...node, components }
}

function applySetComponentPatch(
  state: MutableDocumentState,
  patch: SetSceneComponentPatch,
): readonly ScenePatch[] {
  assertComponentName(patch.component)
  const node = getNodeForComponent(state, patch.id)
  const existed = Object.hasOwn(node.components ?? {}, patch.component)
  const previous = node.components?.[patch.component]
  setComponentValue(state, node, patch.component, patch.value)

  return existed
    ? [
        {
          op: 'component.set',
          id: node.id,
          component: patch.component,
          value: cloneSceneData(previous),
        },
      ]
    : [{ op: 'component.delete', id: node.id, component: patch.component }]
}

function applyDeleteComponentPatch(
  state: MutableDocumentState,
  patch: DeleteSceneComponentPatch,
): readonly ScenePatch[] {
  assertComponentName(patch.component)
  const node = getNodeForComponent(state, patch.id)
  if (!Object.hasOwn(node.components ?? {}, patch.component)) {
    throw new Error(`Scene component does not exist: ${patch.component}`)
  }

  const previous = cloneSceneData(node.components?.[patch.component])
  const components = cloneSceneData({ ...(node.components ?? {}) })
  delete components[patch.component]
  state.nodes[node.id] =
    Object.keys(components).length === 0
      ? (() => {
          const next = { ...node }
          delete next.components
          return next
        })()
      : { ...node, components }

  return [{ op: 'component.set', id: node.id, component: patch.component, value: previous }]
}

function getMutableComponentObject(node: SceneNode, component: string): Record<string, unknown> {
  if (!Object.hasOwn(node.components ?? {}, component)) {
    throw new Error(`Scene component does not exist: ${component}`)
  }
  const value = cloneSceneData(node.components?.[component])
  if (!isPlainRecord(value)) {
    throw new Error(`Scene component must be an object for property mutation: ${component}`)
  }
  return value
}

function getPropertyOwner(
  componentValue: Record<string, unknown>,
  path: readonly string[],
): { owner: Record<string, unknown>; property: string } {
  let owner = componentValue
  for (const segment of path.slice(0, -1)) {
    const next = owner[segment]
    if (!isPlainRecord(next)) {
      throw new Error(`Scene component property parent is not an object: ${segment}`)
    }
    owner = next
  }

  const property = path.at(-1)
  if (property === undefined) throw new Error('Scene component property path must not be empty')
  return { owner, property }
}

function applySetComponentPropertyPatch(
  state: MutableDocumentState,
  patch: SetSceneComponentPropertyPatch,
): readonly ScenePatch[] {
  assertComponentName(patch.component)
  assertComponentPropertyPath(patch.path)
  const node = getNodeForComponent(state, patch.id)
  const componentValue = getMutableComponentObject(node, patch.component)
  const { owner, property } = getPropertyOwner(componentValue, patch.path)
  const existed = Object.hasOwn(owner, property)
  const previous = owner[property]
  owner[property] = cloneSceneData(patch.value)
  setComponentValue(state, node, patch.component, componentValue)

  return existed
    ? [
        {
          op: 'component.setProperty',
          id: node.id,
          component: patch.component,
          path: cloneSceneData(patch.path),
          value: cloneSceneData(previous),
        },
      ]
    : [
        {
          op: 'component.deleteProperty',
          id: node.id,
          component: patch.component,
          path: cloneSceneData(patch.path),
        },
      ]
}

function applyDeleteComponentPropertyPatch(
  state: MutableDocumentState,
  patch: DeleteSceneComponentPropertyPatch,
): readonly ScenePatch[] {
  assertComponentName(patch.component)
  assertComponentPropertyPath(patch.path)
  const node = getNodeForComponent(state, patch.id)
  const componentValue = getMutableComponentObject(node, patch.component)
  const { owner, property } = getPropertyOwner(componentValue, patch.path)
  if (!Object.hasOwn(owner, property)) {
    throw new Error(`Scene component property does not exist: ${patch.path.join('.')}`)
  }

  const previous = cloneSceneData(owner[property])
  delete owner[property]
  setComponentValue(state, node, patch.component, componentValue)
  return [
    {
      op: 'component.setProperty',
      id: node.id,
      component: patch.component,
      path: cloneSceneData(patch.path),
      value: previous,
    },
  ]
}

function applySinglePatch(state: MutableDocumentState, patch: ScenePatch): readonly ScenePatch[] {
  switch (patch.op) {
    case 'create':
      return applyCreatePatch(state, patch)
    case 'update':
      return applyUpdatePatch(state, patch)
    case 'delete':
      return applyDeletePatch(state, patch)
    case 'resource.create':
      return applyCreateResourcePatch(state, patch)
    case 'resource.update':
      return applyUpdateResourcePatch(state, patch)
    case 'resource.delete':
      return applyDeleteResourcePatch(state, patch)
    case 'component.set':
      return applySetComponentPatch(state, patch)
    case 'component.delete':
      return applyDeleteComponentPatch(state, patch)
    case 'component.setProperty':
      return applySetComponentPropertyPatch(state, patch)
    case 'component.deleteProperty':
      return applyDeleteComponentPropertyPatch(state, patch)
  }
}

/**
 * 应用一组 Patch，并同时生成能够精确恢复 source 的逆 Patch。
 *
 * 逆 Patch 自带正确执行顺序，包含可选字段删除、根节点顺序与级联删除子树恢复信息。
 * 输入文档和 Patch 都会在边界处深拷贝，返回结果不会共享调用方的嵌套可变引用。
 */
export function applyScenePatchesWithInverse(
  source: SceneDocument,
  patches: readonly ScenePatch[],
): ApplyPatchWithInverseResult {
  const sourceCopy = cloneSceneData(source)
  const state: MutableDocumentState = {
    nodes: { ...sourceCopy.nodes },
    rootNodeIds: [...sourceCopy.rootNodeIds],
    resources: { ...sourceCopy.resources },
  }
  const inversePatches: ScenePatch[] = []

  for (const inputPatch of patches) {
    const patch = cloneSceneData(inputPatch)
    const inverseForPatch = applySinglePatch(state, patch)
    inversePatches.unshift(...inverseForPatch)
  }

  return {
    document: {
      ...sourceCopy,
      nodes: state.nodes,
      rootNodeIds: state.rootNodeIds,
      resources: state.resources,
    },
    applied: patches.length,
    inversePatches,
  }
}

/**
 * Core 的纯函数 Patch 执行器。
 *
 * 这里故意不处理项目业务规则；Project Adapter 应在提交 Patch 前后执行自己的校验。
 * History、Ghost Preview、人工编辑与 Agent 编辑都应复用同一 Patch 语义。
 */
export function applyScenePatches(
  source: SceneDocument,
  patches: readonly ScenePatch[],
): ApplyPatchResult {
  const { document, applied } = applyScenePatchesWithInverse(source, patches)
  return { document, applied }
}
