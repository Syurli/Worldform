# @worldform/mcp

Worldform 的官方 stdio MCP 入口。它使用 `@modelcontextprotocol/server@2.0.0` 的 `serveStdio(factory)`，同时服务当前 2026-era 与旧 2025-era 客户端。

## 启动

```bash
pnpm --filter @worldform/mcp build
node packages/mcp/dist/stdio.js --scene scene.worldform.json --adapter ./adapter.mjs
```

stdout 只承载 MCP JSON-RPC；诊断和启动信息写入 stderr。

## 安全边界

- MCP 只操作进程内共享 `WorldformWorkspace`；
- 不暴露 shell、任意文件读写或通用代码执行工具；
- `scene.create/update/delete` 只创建带 `baseRevision` 的 Draft；
- `change.preview` 执行验证并返回结构化 Ghost diff；
- 只有 `change.apply` 会修改正式场景并进入 History；
- Project Capability 返回的 Patch 同样必须进入 Draft。

## 工具

`scene.get/query/create/update/delete`、`project.listCapabilities/callCapability/validate`、`change.preview/apply/discard`、`history.undo/redo`、`preview.play/stop`。

Editor 与 MCP 在同一宿主进程共享 Workspace/MCP Session 时，Editor 的 Draft 面板和 `subscribePreview` 可以直接显示同一个 Ghost 状态。独立 stdio 进程当前不跨进程同步 Editor，这一 IPC Bridge 留给后续阶段。
