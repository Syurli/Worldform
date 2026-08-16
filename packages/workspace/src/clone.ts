/** Workspace 对外只返回深拷贝，防止 UI/MCP 意外修改权威状态。 */
export function cloneWorkspaceData<T>(value: T): T {
  try {
    return structuredClone(value)
  } catch (error) {
    throw new TypeError('Workspace data cannot be cloned', { cause: error })
  }
}
