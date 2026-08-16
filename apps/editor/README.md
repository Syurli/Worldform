# Editor Host

`apps/editor` 是 Worldform 独立 Web 作者工具的宿主。

## Phase 1 状态

当前只建立依赖边界，不提前锁定 React / Next / Pascal 具体版本。P1-005 才正式完成 Pascal Authoring Alpha。

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

## P1-005 目标

使用通用 `examples/example-adapter` 验证 Scene Tree、Selection、Gizmo、Inspector、动态项目属性、Patch、Validate 与 Undo/Redo。

不得使用《战术巫师》或《物有所归》作为 Editor API 的唯一设计来源。

## 后续职责

- Pascal/Three Authoring View；
- Scene Tree / Inspector；
- Adapter 面板；
- Validation 与 DraftChange；
- Ghost Preview；
- Project Preview 入口；
- 后续 Director 工作区。

## 明确禁止

- 不把编辑器内部 store 当正式项目数据；
- 不在 app 内实现项目算法；
- 不维护模型供应商或聊天系统；
- 不绕过 Workspace 直接让 Agent 或 Gizmo 修改正式文档。
