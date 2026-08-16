# Editor Host

`apps/editor` 是 Worldform 独立 Web 作者工具的宿主。

## Phase 1 状态

P1-005 Pascal Authoring Alpha 已完成。当前宿主使用 Pascal `core/viewer@0.9.2`、React 19、Three 0.185 和 Vite 7，业务语义完全由 Example Adapter 的 descriptor/schema 驱动。

## 依赖方向

Editor 不直接组织一套独立的 Scene 状态机。正式关系应为：

```text
Editor UI
   ↓
Worldform Workspace / Session
   ↓
Core + Adapter Host
   ↓
Pascal Authoring Projection / Project Adapter
```

## 运行

```bash
pnpm --filter @worldform/editor-host dev
pnpm --filter @worldform/editor-host build
```

页面包含 Scene Tree、Pascal WebGPU 3D Viewport、通用选择、移动/旋转 Gizmo、创建/删除、动态 Inspector、Validate、DraftChange 和 Undo/Redo。

任何创建、删除、Inspector 或 Gizmo 修改都会先成为 `ScenePatch[]` 和 `DraftChange`，再由 Workspace Apply。Pascal Store 只保留可随时重建的工作副本。

不得使用《战术巫师》或《物有所归》作为 Editor API 的唯一设计来源。

## 当前边界与后续职责

- 已实现 Pascal/Three Authoring View、Scene Tree、Inspector、Validation 与 DraftChange；
- 已支持同进程 MCP 共享 Workspace：Draft 面板显示 `+新增 / ~修改 / -删除` Ghost 摘要，Apply/Undo/Redo 后自动重建 Pascal 投影；
- Project Preview 与 Director 工作区保留到后续阶段；
- Pascal 自带 Building/Level/Zone 选择策略不适用于通用节点，宿主使用 Pascal emitter/registry/outliner 上的通用选择管理器。

## 明确禁止

- 不把编辑器内部 store 当正式项目数据；
- 不在 app 内实现项目算法；
- 不维护模型供应商或聊天系统；
- 不绕过 Workspace 直接让 Agent 或 Gizmo 修改正式文档。
