# P1-004 — Place & Seek Adapter Spike

## 目标

用《物有所归 / Place & Seek》验证 Worldform 对“小空间 + 高密度互动项目”的适配能力。

## 前置

- Pascal PoC 能稳定编辑 Prop / Zone / Anchor；
- 明确 Place 项目的 `PlaceScene / PlaceObject / Placement / Physics` 数据与校验入口。

## Worldform 侧最小语义

- PlaceObject
- Zone
- Placement Target
- Container
- Secret / Memory Marker
- Physics Profile 引用

## Adapter 最小能力

```text
validatePlacement
evaluateScene
exportPlace
```

如项目能力已准备好，可增加：

```text
simulatePlacement
evaluateSettledState
validateSecrets
```

## 核心约束

Worldform 不能复制：

- Placement 真实判定；
- Physical Snap；
- Jolt 交互规则；
- Discover / Secret / Completion；
- Settled State 判定。

## 推荐 PoC

使用《还有五分钟》中的一个局部区域，而不是一开始导入整关。

至少包含：

- 桌面或抽屉区域；
- 10+ 个可见物件；
- 1 个 Placement Target；
- 1 个 Container；
- 1 个 Secret / Memory Object。

## 验收

1. Worldform 可编辑对象位置与基础语义；
2. 调用 Place 项目真实 Placement Validator；
3. 生成合法 `.place.json`；
4. Place Runtime 能读取同一份正式数据；
5. Worldform 作者视图与 Babylon Runtime 可以表现不同，但场景语义一致；
6. Core 无 Place 项目业务依赖。
