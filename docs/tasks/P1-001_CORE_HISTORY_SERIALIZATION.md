# P1-001 — Core History / Serialization

## 目标

把当前最小 `SceneDocument + ScenePatch` 扩展成可作为编辑器正式文档基线的纯 TypeScript 核心。

## 范围

1. 为 Patch 增加可生成逆操作的机制；
2. 建立最小 History Store：apply / undo / redo；
3. 定义稳定 JSON serialization；
4. 增加 `schemaVersion` migration 接口，不必实现复杂迁移；
5. 明确引用/资源引用的最小数据形态；
6. 增加结构 Validator：
   - parent cycle；
   - root 一致性；
   - dangling reference（仅通用引用）；
   - 非法 Transform 基础值；
7. 完善测试。

## 禁止

- 不引入 React / Three / Pascal；
- 不实现项目业务组件 schema；
- 不提前实现 CRDT / 多人协作；
- 不为 Undo 直接绑定 Pascal/Zustand history。

## 验收

- `@worldform/core` 可独立运行测试；
- create/update/delete 均可 undo/redo；
- JSON round-trip 不丢失语义；
- migration API 有测试样例；
- `pnpm check && pnpm test` 通过。
