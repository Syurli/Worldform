# P1-005 — Pascal Authoring Alpha

## 状态

已完成。

## 目标

验证 Pascal 可以作为 Worldform 的通用作者视图，而不是某款游戏的专用编辑器。

## 前置

- P1-003 Workspace 可用；
- P1-004 Example Adapter 可注册未知节点与属性。

## PoC

使用 Example Adapter 构造一个小房间：Box/Prop/Zone/Marker/TestComponent。

实现：

1. 最小 Web 页面；
2. Scene Tree；
3. Selection；
4. Gizmo 移动/旋转；
5. 创建/删除节点；
6. 根据 Adapter descriptor/schema 生成 Inspector；
7. 修改转换为 ScenePatch；
8. Patch 进入 Workspace；
9. Validate；
10. Undo/Redo；
11. 导出 SceneDocument。

## 关键决策输出

记录 Pascal package/commit、插件 API 缺口、history 分工、2D floorplan 价值、补丁层与升级策略。

## 禁止

不实现 TWR/Place 节点，不让 Pascal Store 成为正式数据，不内置聊天/LLM。

## 实现记录

- 锁定 Pascal `core/viewer@0.9.2` 与 npm `gitHead`；
- 建立纯 SceneDocument ↔ Pascal Projection 边界；
- 使用 Pascal Plugin registry、Viewer、event emitter 和 outliner；
- Example Adapter 驱动预览、创建菜单与 Inspector；
- 所有 Create/Delete/Inspector/Gizmo 修改统一进入 DraftChange 和 Workspace；
- Workspace 独占 revision 与 Undo/Redo；
- 完成 WebGPU 浏览器 smoke test和生产构建；
- 上游缺口、2D floorplan 与升级策略记录在 ADR-008。

## 验证

```text
pascal-adapter projection tests: 4 passed
Editor type check: passed
Editor production build: passed
Browser: Scene Tree / selection / create / inspector / validate / undo / redo passed
```
