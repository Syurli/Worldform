# P1-003 — Tactical Wizard Adapter Spike

## 目标

用《战术巫师：裂隙突围》验证 Worldform 对“大空间 + 程序生成项目”的适配能力。

## 前置

- Pascal PoC 可以编辑自定义 Connector / Anchor；
- 明确 TWR_Dev 中可共享/可调用的关卡定义、Generator 和 Validator 入口。

## Worldform 侧最小语义

- Module
- Connector
- Walk Surface
- Obstacle
- Enemy Anchor
- Loot Anchor
- Extraction / Key Node

## Adapter 最小能力

```text
validateModule
generateLevel
validateLevel
exportDefinition
```

如项目已有稳定能力，可额外接：

```text
validateSeedBatch
inspectPortalGraph
inspectNavigationGraph
```

## 核心约束

Worldform 不能复制：

- TC-WFC；
- Mission Topology；
- Portal Graph；
- Navigation；
- Seed/Retry/Fallback 算法。

这些必须通过 TWR Adapter 调项目真实代码。

## 验收

1. 在 Worldform 编辑一个 WFC 样板；
2. 调 TWR 真实 Validator；
3. 导出项目正式定义；
4. 用 TWR 真实 Generator 生成关卡；
5. 将生成结果回显到 Worldform；
6. 同 seed/content/version 的结果与项目侧一致；
7. Worldform Core 无 TWR 业务依赖。
