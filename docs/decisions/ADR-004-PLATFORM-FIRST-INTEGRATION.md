# ADR-004 — Platform-first Integration

- 状态：Accepted
- 日期：2026-08-16

## 背景

原 Phase 1 计划在 Pascal PoC 后立即开发《战术巫师》和《物有所归》Adapter。此时 Editor、CLI、MCP、Adapter SDK 与统一应用层尚未稳定，容易让首个项目需求反向塑造公共协议。

## 决策

Worldform 第一阶段改为 **Platform Alpha / Third-party Ready**。

在真实游戏 Adapter 前先完成 Core 契约、Workspace/Session、Adapter SDK/Host、通用 Example Adapter、Editor Alpha、CLI、MCP/Ghost Preview、Developer Kit 与 Clean-room 验收。

TWR / Place 迁移到 Phase 2，并默认在各自项目仓库中实现 Adapter。

## 后果

正面：

- 平台 API 由通用用例驱动；
- 更早发现第三方开发体验缺口；
- 游戏代码与 Worldform 仓库隔离；
- Codex 可按真实外部接入流程工作。

代价：

- 首个游戏可见成果略后移；
- 需要维护 Example Adapter 与 Clean-room 测试。

该代价可接受，因为它直接验证 Worldform 是否真正具备平台属性。
