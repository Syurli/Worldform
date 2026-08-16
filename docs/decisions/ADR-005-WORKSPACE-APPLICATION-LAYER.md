# ADR-005 — Workspace / Session Application Layer

- 状态：Accepted
- 日期：2026-08-16

## 背景

Core 已有 SceneDocument、Patch、History、Serialization 与 Validation。Editor、CLI、MCP 即将分别接入，如果它们直接组合 Core 与 Adapter，将很容易出现三套 revision、validation、apply、undo 和 lifecycle 逻辑。

## 决策

新增 `packages/workspace` 作为统一应用层。

Workspace/Session 负责：

- 当前文档与 revision；
- SceneHistory；
- DraftChange；
- Core + Adapter Validation；
- Apply / Discard；
- Adapter Host 生命周期；
- Undo / Redo；
- 变更事件和只读快照；
- 后续 Preview 状态。

Editor、CLI、MCP 只能通过 Workspace 操作运行中的 Worldform 状态。

## 非目标

Workspace 不拥有游戏算法，不取代 Core，不绑定 Pascal，也不成为新的通用 Runtime。

## 后果

所有入口共享同一 mutation/validation/history 语义；MCP 只成为应用层外部接口，而不会演化成第二套编辑器后端。
