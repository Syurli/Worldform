# P2-002 — Place & Seek External Adapter

## 目标

在《物有所归 / Place & Seek》自己的仓库中，按正式第三方流程实现 Worldform Adapter，验证“小空间 + 高密度互动”。

## Worldform 侧语义

PlaceObject、Zone、Container、Placement Target、Secret/Memory、Physics Profile 等由 Adapter descriptor 声明。

## 项目真实能力

推荐暴露 validatePlacement、simulatePlacement、evaluateSettledState、validatePlace、exportPlace 等 capability。

真实 Placement 判定、Physical Snap、Jolt 规则、Discover/Secret/Completion 始终留在项目代码。

## 验收

- 不修改 Worldform Core 即可完成接入；
- Editor 动态呈现项目属性；
- CLI/MCP/Workspace 路径完整；
- Project Runtime 读取正式数据并与 Worldform 场景语义一致。
