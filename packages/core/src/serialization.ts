import { migrateSceneDocument, type SceneDocumentMigration } from './migration.js'
import type { SceneDocument } from './model.js'

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonObject | readonly JsonValue[]
export interface JsonObject {
  readonly [key: string]: JsonValue
}

export interface SerializeSceneDocumentOptions {
  /** JSON 缩进空格数；默认 2，设为 0 可输出紧凑格式。 */
  space?: number
}

export interface DeserializeSceneDocumentOptions {
  /** 指定后会在解析基础结构后按显式 migration 链迁移。 */
  targetSchemaVersion?: string
  migrations?: readonly SceneDocumentMigration[]
}

export class SceneSerializationError extends Error {
  public override readonly name = 'SceneSerializationError'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function assertString(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string') throw new SceneSerializationError(`${path} must be a string`)
}

/**
 * 检查反序列化后的最小数据外形。
 * parent/root/reference 等跨对象一致性故意交给 Validator，以便一次报告全部结构问题。
 */
function assertSceneDocumentShape(value: unknown): asserts value is SceneDocument {
  if (!isRecord(value)) throw new SceneSerializationError('Scene document must be an object')
  assertString(value.id, 'id')
  assertString(value.schemaVersion, 'schemaVersion')

  if (value.projectAdapterId !== undefined) {
    assertString(value.projectAdapterId, 'projectAdapterId')
  }
  if (!isRecord(value.nodes)) throw new SceneSerializationError('nodes must be an object')
  if (!Array.isArray(value.rootNodeIds)) {
    throw new SceneSerializationError('rootNodeIds must be an array')
  }
  for (const [index, rootId] of value.rootNodeIds.entries()) {
    assertString(rootId, `rootNodeIds[${index}]`)
  }

  for (const [key, node] of Object.entries(value.nodes)) {
    if (!isRecord(node)) throw new SceneSerializationError(`nodes.${key} must be an object`)
    assertString(node.id, `nodes.${key}.id`)
    assertString(node.type, `nodes.${key}.type`)
    if (node.parentId !== undefined) assertString(node.parentId, `nodes.${key}.parentId`)
    if (!isRecord(node.transform)) {
      throw new SceneSerializationError(`nodes.${key}.transform must be an object`)
    }
  }

  if (value.resources !== undefined && !isRecord(value.resources)) {
    throw new SceneSerializationError('resources must be an object')
  }
}

/** 将任意 Core 数据规范化为键排序稳定的 JSON 值，并拒绝 JSON 无法无损表示的数据。 */
function toStableJsonValue(value: unknown, path: string, ancestors: WeakSet<object>): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new SceneSerializationError(`${path} contains a non-finite number`)
    }
    return Object.is(value, -0) ? 0 : value
  }

  if (typeof value !== 'object') {
    throw new SceneSerializationError(`${path} contains a non-JSON value`)
  }
  if (ancestors.has(value)) throw new SceneSerializationError(`${path} contains a cycle`)

  ancestors.add(value)
  try {
    if (Array.isArray(value)) {
      const result: JsonValue[] = []
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.hasOwn(value, index)) {
          throw new SceneSerializationError(`${path} contains a sparse array entry`)
        }
        result.push(toStableJsonValue(value[index], `${path}[${index}]`, ancestors))
      }
      return result
    }

    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) {
      throw new SceneSerializationError(`${path} must contain only plain JSON objects`)
    }
    if (Object.getOwnPropertySymbols(value).length > 0) {
      throw new SceneSerializationError(`${path} contains symbol keys that JSON cannot preserve`)
    }
    if (Object.getOwnPropertyNames(value).length !== Object.keys(value).length) {
      throw new SceneSerializationError(`${path} contains non-enumerable fields`)
    }

    const result: Record<string, JsonValue> = {}
    for (const key of Object.keys(value).sort()) {
      result[key] = toStableJsonValue(
        (value as Record<string, unknown>)[key],
        `${path}.${key}`,
        ancestors,
      )
    }
    return result
  } finally {
    ancestors.delete(value)
  }
}

/**
 * 输出适合磁盘、Git、CLI 与外部 Agent 使用的确定性 JSON。
 * 对象键固定排序，默认两空格缩进并保留文件末尾换行。
 */
export function serializeSceneDocument(
  document: SceneDocument,
  options: SerializeSceneDocumentOptions = {},
): string {
  const space = options.space ?? 2
  if (!Number.isInteger(space) || space < 0 || space > 10) {
    throw new RangeError(`JSON indentation must be an integer from 0 to 10: ${space}`)
  }

  const stableValue = toStableJsonValue(document, '$', new WeakSet<object>())
  return `${JSON.stringify(stableValue, null, space)}\n`
}

/** 解析稳定 JSON，并可选地迁移到调用方指定的 schemaVersion。 */
export function deserializeSceneDocument(
  serialized: string,
  options: DeserializeSceneDocumentOptions = {},
): SceneDocument {
  let parsed: unknown
  try {
    parsed = JSON.parse(serialized)
  } catch (error) {
    const reason = error instanceof Error ? `: ${error.message}` : ''
    throw new SceneSerializationError(`Invalid scene JSON${reason}`, { cause: error })
  }

  assertSceneDocumentShape(parsed)
  const document =
    options.targetSchemaVersion === undefined
      ? parsed
      : migrateSceneDocument(parsed, options.targetSchemaVersion, options.migrations ?? [])
  assertSceneDocumentShape(document)
  return document
}
