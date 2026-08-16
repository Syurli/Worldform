# ADR-007 — Adapter API / SDK / Host Separation

- 状态：Accepted
- 日期：2026-08-16

## 背景

第三方 Adapter 同时需要稳定业务协议、开发便利工具与可靠运行生命周期。如果这些职责都进入一个接口，stdio/HTTP 等 Transport 细节会污染业务 Adapter，Editor/CLI/MCP 也可能各自实现 timeout 和错误处理。

## 决策

- `@worldform/adapter-api` 只定义 manifest、descriptor、lifecycle、capability、validation、export 与结构化错误；
- `@worldform/adapter-sdk` 提供 define helper、descriptor 基础验证、fixture 与 contract report；
- Workspace `AdapterHost` 负责加载后的 lifecycle、API/schema 兼容检查、timeout、cancellation、dispatch 与错误归一化；
- Phase 1 实际运行方式为 in-process，业务接口不绑定 Transport；
- 通用 Example Adapter 作为唯一 Phase 1 业务语义样例。

## 后果

第三方 Adapter 可以在独立仓库中实现和测试；Editor、CLI 与 MCP 共享同一个 Host；未来增加 stdio/HTTP/IPC 时不改变 capability 语义。
