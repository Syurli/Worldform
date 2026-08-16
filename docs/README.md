# Docs Index

## 产品与核心文档

- [`PRODUCT_DEFINITION.md`](PRODUCT_DEFINITION.md) — 产品定位与平台优先原则
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — Core / Workspace / Adapter / Editor / Agent 分层
- [`ROADMAP.md`](ROADMAP.md) — Platform Alpha 到真实项目接入路线
- [`PROJECT_ADAPTER.md`](PROJECT_ADAPTER.md) — Adapter API / SDK / Host 与开发方法
- [`THIRD_PARTY_INTEGRATION.md`](THIRD_PARTY_INTEGRATION.md) — 独立项目正式接入流程
- [`AGENT_INTERFACE.md`](AGENT_INTERFACE.md) — Skill / CLI / MCP 外部 Agent 策略
- [`UPSTREAMS.md`](UPSTREAMS.md) — Pascal / Aedifex 使用与许可边界

## 架构决策

- [`decisions/ADR-001-WORLDFORM-BOUNDARIES.md`](decisions/ADR-001-WORLDFORM-BOUNDARIES.md)
- [`decisions/ADR-002-PASCAL-AUTHORING-LAYER.md`](decisions/ADR-002-PASCAL-AUTHORING-LAYER.md)
- [`decisions/ADR-003-EXTERNAL-AGENT-FIRST.md`](decisions/ADR-003-EXTERNAL-AGENT-FIRST.md)
- [`decisions/ADR-004-PLATFORM-FIRST-INTEGRATION.md`](decisions/ADR-004-PLATFORM-FIRST-INTEGRATION.md)
- [`decisions/ADR-005-WORKSPACE-APPLICATION-LAYER.md`](decisions/ADR-005-WORKSPACE-APPLICATION-LAYER.md)

## 当前任务

- [`tasks/README.md`](tasks/README.md) — Phase 1 执行顺序
- `P1-001` 已完成；当前从 `P1-002` Core Contract Hardening 开始
- `P1-003` Workspace / Session
- `P1-004` Adapter SDK + Example Adapter
- `P1-005` Pascal Authoring Alpha
- `P1-006` CLI
- `P1-007` MCP + Ghost Preview
- `P1-008` Third-party Developer Kit
- `P1-009` Clean-room Validation

Phase 2 的真实项目验收任务位于 [`tasks/phase2/`](tasks/phase2/)。

## Agent

外部 Agent 稳定入口：[`../agent/README.md`](../agent/README.md)。仓库级 Skills 位于 `../.agents/skills/`。

## 当前阶段

当前为 **Phase 1 — Platform Alpha / Third-party Ready**。完成标准是独立项目能够按正式第三方流程接入，而不是 Worldform 仓库内部已经写入两款游戏的 Adapter。
