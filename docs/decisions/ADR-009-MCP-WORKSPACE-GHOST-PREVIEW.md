# ADR-009 — MCP 只作为 Workspace 工具入口

## 状态

已接受，2026-08-16。

## 决策

Worldform MCP 使用官方 `@modelcontextprotocol/server@2.0.0` 与 `serveStdio(factory)`，同时支持当前 2026-era 和旧 2025-era stdio 客户端。MCP Session 只引用一个现有 `WorldformWorkspace`，不持有第二份 SceneDocument、revision 或 History。

Mutation 流程固定为：

```text
scene.* / project capability
        ↓ baseRevision
ScenePatch[] → DraftChange
        ↓
Core + Adapter Validation
        ↓
Workspace Ghost Preview
        ↓
change.apply / change.discard
        ↓
Workspace History
```

## Ghost Preview

Ghost diff 是 Workspace 公共能力，比较当前权威文档和 `previewDraft` 候选文档，输出节点/资源的 created、updated、deleted。Editor 与 MCP 使用同一函数和同一 Draft。Preview active state只保存 Draft ID 引用，不复制候选场景作为权威状态。

## 安全边界

- 不注册 shell、任意文件系统、网络抓取或代码执行工具；
- `scene.create/update/delete` 只创建 Draft，不默认 Apply；
- destructive tool 带 MCP annotation，删除行为写入 Draft source detail；
- 过期 `baseRevision` 在创建 Draft 前立即拒绝；
- Capability Patch 必须重新进入 Draft；
- stdout 只用于 JSON-RPC，日志写入 stderr。

## Editor 与进程边界

同一宿主进程可用 `WorldformMcpSession(editorSession.workspace)` 共享实时状态；Editor 订阅 Workspace event 后显示 Draft 和 Ghost 摘要，并在 Apply/Undo/Redo 后重建 Pascal 投影。

独立 stdio 进程从 `--scene` 初始化自己的 Workspace，不跨进程修改另一个浏览器进程。真正的 Editor IPC/会话发现需要后续 Bridge，不在 Phase 1 伪装成已实现能力。

## 依据

- 官方 server guide：`https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md`
- 官方 stdio guide：`https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/serving/stdio.md`
- 官方 v2 packages guide：`https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/get-started/packages.md`
