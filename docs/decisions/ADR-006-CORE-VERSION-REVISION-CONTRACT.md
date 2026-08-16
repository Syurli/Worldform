# ADR-006 — Core Version / Revision Contract

- 状态：Accepted
- 日期：2026-08-16

## 背景

P1-001 的 `SceneDocument.schemaVersion` 同时容易被理解为 Worldform 文档格式、项目组件 schema 或 Adapter 实现版本。Editor、CLI 与 MCP 进入开发后，也需要共同的运行态 revision 与冲突拒绝语义。

## 决策

版本正式拆分为：

- `SceneDocument.formatVersion`：Worldform 通用磁盘格式；
- Adapter manifest `adapterApiVersion`：Worldform/Adapter 公共协议；
- `SceneDocument.projectSchemaVersion` 与 manifest `sceneSchemaVersion`：项目语义；
- Adapter manifest `version`：Adapter 实现版本。

运行中 revision 不写入 SceneDocument。Core 定义 `SceneRevision`、`DraftChange`、`baseRevision` 与 `RevisionConflictError`；Workspace 负责生命周期和单调递增。

Patch 增加 Resource、Component 和 Component Property 操作，使动态 Inspector 不必覆盖整个资源表或 components 对象。

## 兼容规则

Phase 1 公共协议使用三段式版本号，主版本一致视为基础兼容。文档迁移仍通过显式 `fromVersion -> toVersion` 链完成，不根据版本大小自动猜测路径。

## 后果

- 磁盘格式与运行态并发语义分离；
- Adapter 兼容错误可以在加载时提前报告；
- Workspace 可统一拒绝过期 DraftChange；
- 细粒度 Inspector 修改继续复用可逆 ScenePatch。
