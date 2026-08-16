# @worldform/workspace

`@worldform/workspace` 是 Editor、CLI 与 MCP 共用的唯一 Worldform 应用层。它不依赖 React、Pascal、Three.js、CLI parser、MCP SDK 或具体项目代码。

## 权威状态

`WorldformWorkspace` 统一持有：

- 当前 `SceneDocument`；
- 单调递增 `SceneRevision`；
- `SceneHistory`；
- `DraftChange` 集合；
- Core → Adapter 验证管线；
- Adapter Session 最小挂载点；
- Workspace lifecycle 事件。

Editor、CLI 与 MCP 不应自己重新组合 History、revision 或 Draft 状态机。

## 标准修改流程

```text
getDocument / getRevision
        ↓
createDraft(baseRevision, patches)
        ↓
previewDraft（只生成候选文档）
        ↓
validateDraft（Core → Adapter）
        ↓
applyDraft / discardDraft
        ↓
History + revision
```

`applyDraft()` 每次都会重新验证。`baseRevision` 与当前 revision 不一致时抛出 `RevisionConflictError`，不会静默覆盖新场景。

Undo/Redo 是新的运行态修改，因此成功时同样递增 revision。加载新文档会明确重置 History 与 Draft。

## Adapter 挂载

P1-003 只定义 `WorkspaceAdapterSession`：

```ts
interface WorkspaceAdapterSession {
  readonly adapterId: string
  validateDocument(document: SceneDocument): Promise<ValidationResult> | ValidationResult
}
```

P1-004 的正式 `AdapterHost` 将实现该接口并负责 lifecycle、timeout、cancellation 与 capability dispatch。Workspace 不感知 Transport。

## 状态隔离与事件

所有 document、draft、snapshot 和 event 都以深拷贝返回。外围监听器异常会被隔离，不能破坏 Workspace 权威状态。

事件包括 document load、Draft create/validate/apply/discard、undo/redo 与 Adapter attach/detach。
