# @worldform/workspace

当前 Platform Alpha 包版本为 `0.1.0-alpha.1`，第三方宿主应只通过本包统一管理 Draft、Preview、Apply 与 History。

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
- Project capability 的受控 dispatch；
- 基于 Draft 的结构化 Ghost Preview。

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

Workspace 通过 `WorkspaceAdapterSession` 挂载 Adapter：

```ts
interface WorkspaceAdapterSession {
  readonly adapterId: string
  validateDocument(document: SceneDocument): Promise<ValidationResult> | ValidationResult
  listCapabilities?(): readonly ProjectCapabilityDescriptor[]
  callCapability?(request: ProjectCapabilityRequest): Promise<ProjectCapabilityResult>
}
```

P1-004 的 `AdapterHost` 已实现该接口，并负责 in-process lifecycle、版本检查、timeout、cancellation、capability/export dispatch 与结构化错误归一化。Workspace 不感知 Transport。

## 状态隔离与事件

所有 document、draft、snapshot 和 event 都以深拷贝返回。外围监听器异常会被隔离，不能破坏 Workspace 权威状态。

事件包括 document load、Draft create/validate/apply/discard、undo/redo 与 Adapter attach/detach。

`createWorldformGhostPreview(workspace, draftId)` 比较当前正式文档和候选文档，统一返回节点/资源的 created、updated、deleted。它供 Editor 与 MCP 共同使用，不拥有独立 revision。
