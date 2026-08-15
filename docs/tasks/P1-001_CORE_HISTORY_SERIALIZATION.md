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

## 实施记录

- 状态：已完成；
- Patch 通过 `applyScenePatchesWithInverse()` 生成可独立检查的逆 Patch；
- `SceneHistory` 以 `SceneChange { patches, inversePatches }` 统一 apply / undo / redo；
- `update.unset`、`rootIndex` 与父级优先的子树恢复保证可选字段、根顺序和级联删除可逆；
- 稳定 JSON 使用确定性对象键排序，并拒绝循环、非有限数值和非 JSON 值；
- migration 使用显式 `fromVersion -> toVersion` 链，不绑定具体版本号方案；
- 通用引用只检查 `SceneNode.references`，不猜测项目组件内部语义；
- 详细 API 与边界见 `packages/core/README.md`。
