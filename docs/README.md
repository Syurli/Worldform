# Docs Index

## 核心文档

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — 架构基线与分层边界
- [`ROADMAP.md`](ROADMAP.md) — 分阶段开发路线与 Phase 1 验收
- [`PROJECT_ADAPTER.md`](PROJECT_ADAPTER.md) — 项目适配协议与开发方法
- [`AGENT_INTERFACE.md`](AGENT_INTERFACE.md) — Markdown / CLI / MCP 外部 Agent 策略
- [`UPSTREAMS.md`](UPSTREAMS.md) — Pascal / Aedifex 的使用与许可边界

## 架构决策

- [`decisions/ADR-001-WORLDFORM-BOUNDARIES.md`](decisions/ADR-001-WORLDFORM-BOUNDARIES.md)
- [`decisions/ADR-002-PASCAL-AUTHORING-LAYER.md`](decisions/ADR-002-PASCAL-AUTHORING-LAYER.md)
- [`decisions/ADR-003-EXTERNAL-AGENT-FIRST.md`](decisions/ADR-003-EXTERNAL-AGENT-FIRST.md)

## Agent

外部 Agent 稳定入口：[`../agent/README.md`](../agent/README.md)

## 当前阶段

当前阶段为 **Phase 1 — Foundation**。

本阶段的目标不是完成可发布编辑器，而是证明以下边界正确：

```text
Worldform Core
   +
Project Adapter
   +
Pascal Authoring Layer
   +
两个真实项目 Spike
```

当代码行为改变架构边界时，应先增加或更新 ADR。
