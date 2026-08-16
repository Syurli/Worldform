# P1-004 — Adapter SDK + Example Adapter

## 目标

让一个 Worldform 事先不知道的项目语义可以通过正式 SDK 注册、验证和被编辑器发现。

## 工程位置

- `packages/adapter-api`：收口最小协议；
- `packages/adapter-sdk`：实现第三方便利层与 contract test；
- Workspace 内的 Adapter Host：实现 lifecycle/dispatch；
- `examples/example-adapter`：无游戏业务样例。

## SDK 最小范围

- `adapterApiVersion`；
- lifecycle；
- timeout / cancellation 基线；
- 统一错误类型；
- node/component/property descriptor；
- input/output schema 边界；
- capability descriptor；
- contract test helper；
- fixture。

## Example Adapter

只使用通用测试语义，例如：

- Box
- Prop
- Marker
- Zone
- TestComponent
- Number / String / Boolean / Enum / Reference 属性

至少提供一个 validator、一个 query capability、一个返回 Patch 的 capability 和一个 export target。

## 验收

- Example Adapter 不修改 Core 即可注册未知语义；
- contract test 能发现 manifest/schema/capability 常见错误；
- Workspace 可加载并调用它；
- 无 TWR/Place 业务依赖。
