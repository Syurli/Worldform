# P2-001 — Tactical Wizard External Adapter

## 目标

在《战术巫师：裂隙突围》自己的仓库中，按正式第三方流程实现 Worldform Adapter，验证“大空间 + 程序生成”。

## Worldform 侧语义

WFC Module、Connector、Walk Surface、Obstacle、Enemy/Loot Anchor、Extraction/Key Node 等由 Adapter descriptor 声明。

## 项目真实能力

推荐暴露 validateModule、generateLevel、validateLevel、validateSeedBatch、inspectPortalGraph、exportDefinition 等 capability。

TC-WFC、Mission Topology、Portal、Navigation、Seed/Retry/Fallback 始终留在 TWR 项目代码。

## 验收

- Worldform 仓库无需为 TWR 增加硬编码分支；
- Adapter contract/CLI 检查通过；
- Editor/MCP 可编辑样板并调用真实 Generator/Validator；
- 同 seed/content/version 与项目侧结果一致。
