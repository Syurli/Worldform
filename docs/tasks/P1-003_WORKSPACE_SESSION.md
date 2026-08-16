# P1-003 — Workspace / Session

## 目标

实现 Editor、CLI、MCP 共用的唯一应用层。

## 工程位置

将当前 `packages/workspace/README.md` 占位升级为真正的 `@worldform/workspace` package。

## 最小职责

- 持有当前 SceneDocument 与 revision；
- 封装 SceneHistory；
- 管理 DraftChange；
- Core Validation；
- Adapter Validation 管线接口；
- preview/apply/discard；
- undo/redo；
- 只读 snapshot；
- change/revision 事件；
- Adapter Session/Host 的最小挂载点。

## 必须验证

```text
load document
→ preview patches at revision N
→ validate
→ apply
→ revision N+1
→ undo
→ redo
```

并测试：旧 `baseRevision` 的 DraftChange 不能静默 Apply。

## 禁止

- 不依赖 Pascal/React；
- 不加入具体游戏逻辑；
- 不实现完整远程 Transport；
- 不让 Workspace 成为另一份 SceneDocument 模型。

## 验收

后续 Editor/CLI/MCP 可以只面向 Workspace API，不需要自己拼接 Core History 与 Adapter 调用。
