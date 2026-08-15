# P1-002 — Pascal Authoring PoC

## 目标

验证 Pascal 能否作为 Worldform 的独立作者视图，而不成为正式数据权威。

## 前置

- 阅读 `docs/decisions/ADR-002-PASCAL-AUTHORING-LAYER.md`；
- P1-001 的核心 Patch/History 边界基本稳定。

## PoC 场景

只做一个小型真实空间：一个房间/仓库白盒，包含：

- 墙/边界；
- 一个通用 Prop；
- 一个 Connector；
- 一个 Anchor；
- 一个 Zone。

## 实现步骤

1. 调研并锁定 Pascal 可用 package/commit；
2. 在 `packages/pascal-adapter` 加真实依赖；
3. 在 `apps/editor` 建最小 Web 页面；
4. 从 `SceneDocument` 创建 Pascal 节点；
5. 支持 Selection + Gizmo；
6. 支持创建/删除上述 PoC 节点；
7. 支持 Inspector 修改；
8. 将修改转换成 `ScenePatch[]`；
9. 应用 Patch 后重建/同步作者视图；
10. 验证 Undo / Redo；
11. 验证导出后不依赖 Pascal 内部序列化。

## 重点记录

PoC 完成后新增 ADR 或报告，回答：

- Pascal 发布包是否足够；
- 是否需要维护薄补丁；
- Plugin API 哪些能力缺失；
- Pascal history 与 Worldform history 如何分工；
- 2D Floorplan 是否能直接服务游戏节点；
- 上游升级策略。

## 禁止

- 不直接 Fork 整个 Pascal 后大改；
- 不让 Pascal Store 成为项目 JSON；
- 不在 PoC 中实现完整游戏编辑器；
- 不加入内置聊天/LLM。

## 验收

人工完成一次：

```text
打开 Worldform 场景
→ 移动对象
→ 新增 Connector
→ 修改属性
→ 生成 Patch
→ Validate
→ Undo
→ Redo
→ 导出 SceneDocument
```

且 Core 测试继续通过。
