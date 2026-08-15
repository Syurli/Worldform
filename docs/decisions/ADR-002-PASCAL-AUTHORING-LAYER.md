# ADR-002：Pascal 作为 Authoring Layer

- 状态：Accepted
- 日期：2026-08-15

## 决策

Pascal Editor 作为 Worldform 当前的主要作者视图技术起点，但不成为 Worldform Core 或正式场景格式。

关系：

```text
SceneDocument
    ↓
Pascal Adapter
    ↓
Pascal Core / Viewer / Editor
```

## 原因

Pascal 已经提供大量成熟的通用空间编辑能力，可以显著减少 3D/2D 编辑器重复开发；但其技术栈、插件 API 和内部状态仍可能持续变化。

若直接让 Pascal Scene Store 成为正式数据，会导致：

- Worldform 协议被上游实现绑死；
- Project Adapter 难以脱离 Pascal 运行；
- 后续 Babylon / Unreal / 其它作者视图接入困难；
- 上游升级直接影响项目内容格式。

## 实施规则

- 所有 Pascal 依赖集中在 `packages/pascal-adapter` 与 `apps/editor`；
- Core 不 import Pascal / Three / React；
- Pascal 编辑结果转换为 ScenePatch；
- Pascal 工作副本不是 Git 中的正式项目数据；
- 正式接入前先完成一份真实样板 PoC 并锁版本。

## 后果

会增加一层映射成本，但换来长期协议稳定和作者视图可替换性。
