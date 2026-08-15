# 物有所归适配样例（规划占位）

此目录用于验证 Worldform 的“小空间 + 高密度互动”适配能力。

## Worldform 负责编辑

- PlaceObject
- Zone
- Placement Target
- Container
- Secret / Memory Marker
- Physics Profile 引用
- Camera / 展示辅助

## 《物有所归》项目继续拥有

- Placement 合法性
- Physical Snap
- Jolt 交互与模拟规则
- Discover / Secret / Completion
- Settled State 判定
- Babylon Runtime

## 第一轮 capability

```text
validatePlacement
evaluateScene
exportPlace
```

## 第一轮 PoC 验收

1. 导入或创建《还有五分钟》中的一个小区域；
2. 编辑多个家具和小物件；
3. 标记一个 Placement Target；
4. 标记一个 Secret / Memory Object；
5. 调用项目真实 Placement Validator；
6. 导出合法 `.place.json`；
7. 在项目 Runtime 中读取同一份数据。

> 此目录当前只定义契约与验收目标。不要在 Worldform 内重新实现《物有所归》的实际归位和物理规则。
