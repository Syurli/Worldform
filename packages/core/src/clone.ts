/**
 * 为 Core 的权威数据创建深拷贝。
 *
 * SceneDocument 的扩展容器在类型层允许 unknown，以便 Adapter 声明自己的 JSON 数据。
 * 使用结构化克隆可以在 History 和 Patch 边界切断调用方持有的数组/对象引用；
 * 是否能够进入稳定 JSON 格式，则由 serialization 模块执行更严格的检查。
 */
export function cloneSceneData<T>(value: T): T {
  try {
    return structuredClone(value)
  } catch (error) {
    const reason = error instanceof Error ? `：${error.message}` : ''
    throw new TypeError(`Scene data cannot be cloned${reason}`, { cause: error })
  }
}
