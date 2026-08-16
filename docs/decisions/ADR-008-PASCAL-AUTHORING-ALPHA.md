# ADR-008 — Pascal Authoring Alpha 接入策略

## 状态

已接受，2026-08-16。

## 决策

Worldform 使用 Pascal 作为非权威 Authoring Layer，并锁定：

- `@pascal-app/core@0.9.2`；
- `@pascal-app/viewer@0.9.2`；
- npm 包 `gitHead`：`cdf026bb92426cb7bd2807ce447e029dadbdaa86`。

所有 Pascal import 集中在 `@worldform/pascal-adapter` 和 Editor Host。正式关系为：

```text
SceneDocument → Pascal Projection → Pascal/Three interaction
                                      ↓
                         ScenePatch[] → DraftChange → Workspace
```

Pascal Store 是可重建的工作副本，不参与 SceneDocument 序列化，也不拥有 revision。

## 实际使用的能力

- Pascal Plugin registry 注册一个通用 `worldform:node`；
- Pascal Viewer 提供 WebGPU 场景宿主；
- Pascal event emitter、registry 和 outliner 支撑节点事件与树结构；
- React Three Fiber / Drei 提供通用 TransformControls；
- Adapter descriptor 决定节点预览、Inspector 字段和创建菜单。

## 已确认的上游缺口

1. `@pascal-app/core@0.9.2` 的发布 JS 使用无扩展名内部 ESM import，Vite 能解析，但 Node 直接 import 会失败。因此投影逻辑保持纯函数并独立测试，Node 工具不直接加载 Pascal runtime。
2. `@pascal-app/viewer@0.9.2` 浏览器 bundle 读取 `process.env.NODE_ENV`；Editor Vite 配置显式注入该常量。
3. Pascal 默认 SelectionManager 仍按 Building → Level → Zone 层级选择，无法覆盖任意第三方节点。Worldform 保留 Pascal emitter/registry/outliner，使用薄的通用 Host 选择管理器。
4. Pascal 公共 Plugin API 没有提供脱离完整 Editor Shell 的通用 Gizmo。当前使用 Drei TransformControls，并通过投影差异生成正式 Patch。

这些处理均位于隔离层，没有修改或复制 Pascal 上游源码。

## History 分工

Worldform Workspace 唯一拥有 revision、DraftChange 和 Undo/Redo History。Pascal 内部 history 不作为正式提交记录。一次 Gizmo 手势结束后生成一组 Patch 和一个 Draft；Apply 成功后才进入 Workspace History。

## Editor 视觉与面板基线

Worldform Authoring Editor 不建立一套与 Pascal 冲突的通用仪表盘视觉。面板排版与配色以锁定上游提交的 Pascal Editor 为基线，并只做 Worldform 语义扩展：

- 使用 Pascal 的中性 `#171717 / #2C2C2E` 灰阶与低对比边框，不使用大面积品牌色；
- 保留左侧场景栏、圆角视口、32px 紧凑分组工具条和悬浮 Inspector 卡片的层级；
- 选中态使用轻量灰阶/边线，危险与验证结果才使用语义色；
- Worldform 增加的 Draft、revision、Adapter 信息沿用相同面板密度；
- 固定界面文案优先中文；项目 Adapter 提供的业务名称按原值显示；
- 后续面板新增或重排必须先与 Pascal 现有组件/布局比较，避免另起设计语言。

Worldform 不复制 Pascal 上游 UI 源码；当前 Host CSS 复现其公开的 design token 与布局原则，正式数据边界仍由本 ADR 其它部分约束。

## 2D Floorplan 判断

2D floorplan 对空间平面编辑有长期价值，但 Pascal 当前 2D 工作流假设 Building/Level/Zone 语义。Phase 1 不复制这套项目模型，也不在 Core 引入楼层规则。后续应先定义可由 Adapter 描述的通用 2D 投影协议，再评估复用 Pascal 2D 包。

## 升级策略

1. Pascal 依赖使用精确版本，不使用范围升级；
2. 每次只升级一个上游版本并核对 npm `gitHead`；
3. 运行投影单测、Editor type check、生产构建与浏览器 smoke test；
4. 重新验证 registry、event emitter、selection、WebGPU Viewer 和 TransformControls；
5. 若必须补丁，只允许保存在 Pascal 隔离层并记录原因，禁止让 Core 依赖上游内部模型。

## 许可

Pascal Editor 采用 MIT License。Worldform 分发相关 npm 包时保留上游许可和归属信息；详见 `docs/THIRD_PARTY_NOTICES.md`。
