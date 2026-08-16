# @worldform/core

当前 Platform Alpha 包版本为 `0.1.0-alpha.1`；安装、整组兼容与本地 tarball 说明见仓库 `docs/COMPATIBILITY.md` 与 `docs/PACKAGING.md`。

`@worldform/core` 是 Worldform 的纯 TypeScript 权威数据层，不依赖 UI、渲染器、物理引擎、Pascal 或具体项目代码。

## Platform Alpha 基线

当前 Core 提供：

- `SceneDocument`、扁平节点层级与 Transform；
- 通用节点引用和资源引用；
- Node、Resource、Component 与 Component Property 细粒度 Patch；
- Patch 逆操作；
- `SceneHistory` 的 apply / undo / redo；
- 确定性 JSON 序列化与反序列化；
- 显式 schema migration 链；
- 通用结构 Validator。

## 版本与 revision

四类版本不得混用：

| 名称 | 所属层 | 用途 |
|---|---|---|
| `formatVersion` | `SceneDocument` | Worldform 通用磁盘文档格式 |
| `adapterApiVersion` | Adapter manifest | Worldform 与 Adapter 的公共协议 |
| `projectSchemaVersion` | SceneDocument / Adapter | 项目节点、组件和属性语义 |
| `version` | Adapter manifest | Adapter 包自身实现版本 |

当前文档格式为 `1.0.0`。公共协议采用三段式版本号，并以主版本一致作为 Phase 1 基础兼容规则。

`SceneRevision` 是运行中 Workspace 的单调递增版本，不写入磁盘 `SceneDocument`。`DraftChange` 必须携带 `baseRevision`；`assertSceneRevision()` 会拒绝基于旧场景状态的变更。

## Patch 与 History

所有持久化编辑先表达为 `ScenePatch[]`。`applyScenePatchesWithInverse()` 在应用 Patch 时生成逆 Patch，`SceneHistory` 只保存正向与逆向 Patch 组成的 `SceneChange`：

```text
SceneDocument
    ↓
ScenePatch[]
    ↓ applyScenePatchesWithInverse
SceneChange { patches, inversePatches }
    ↓
SceneHistory apply / undo / redo
```

`update` 使用 `unset` 删除可选字段，避免把不可序列化的 `undefined` 写进文档。逆操作还会保存根节点位置和级联删除的完整子树，因此撤销后可以恢复原始层级与 `rootNodeIds` 顺序。

资源支持 `resource.create / resource.update / resource.delete`。组件编辑支持：

```text
component.set / component.delete
component.setProperty / component.deleteProperty
```

属性路径只穿过普通对象；数组或更复杂的项目数据结构应通过 Adapter 提供明确的高级操作，避免 Core 演化成通用 ECS 或任意 JSON Patch 引擎。

History 在输入、输出和审计条目边界都创建深拷贝。调用方不应直接持有或修改内部文档；未来 Ghost Preview、MCP 和编辑器操作应继续复用同一 Patch / Change 语义。

## 引用与资源

Core 只校验显式通用引用：

```ts
{ kind: 'node', nodeId: 'target-node' }
{ kind: 'resource', resourceId: 'mesh.crate' }
```

资源表的最小条目包含 `id` 和 `uri`，可选 `type` 与 `metadata`。Core 不猜测 `components` 或 `metadata` 里的字符串是否为引用，也不负责加载资源；项目组件 schema 与业务引用继续由 Project Adapter 校验。

## 稳定序列化与迁移

`serializeSceneDocument()` 会递归排序对象键、使用固定缩进并保留末尾换行，以便磁盘保存、Git diff、CLI 和外部 Agent 使用。无法被 JSON 无损表达的值、循环对象和非有限数字会被拒绝。

`deserializeSceneDocument()` 只检查 JSON 与最小文档外形。parent、root、引用和 Transform 的一致性由 `validateSceneDocument()` 统一报告，以便调用方一次看到全部结构问题。

迁移通过显式 `SceneDocumentMigration { fromVersion, toVersion, migrate }` 链完成。迁移路径不依赖版本大小排序；公共兼容性检查只使用三段式版本的主版本。

## 验证分层

建议调用顺序：

```text
Core structural validation
        ↓
Adapter schema validation
        ↓
Project business validation
        ↓
Bridge / runtime validation
```

Core 当前检查 root/parent 一致性、节点与资源键、父级循环、通用悬空引用，以及 Transform 元组、有限数值和零四元数。项目业务规则不得加入这里。

`ValidationIssue` 使用稳定的 `namespace.identifier` code，并要求明确 `source`。`path` 只描述 SceneDocument 字段路径，不包含本地文件系统信息；Adapter/Bridge 多实例可通过 `sourceId` 标识实际来源。
