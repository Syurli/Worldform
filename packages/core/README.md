# @worldform/core

`@worldform/core` 是 Worldform 的纯 TypeScript 权威数据层，不依赖 UI、渲染器、物理引擎、Pascal 或具体项目代码。

## P1-001 基线

当前 Core 提供：

- `SceneDocument`、扁平节点层级与 Transform；
- 通用节点引用和资源引用；
- `create / update / delete` Patch；
- Patch 逆操作；
- `SceneHistory` 的 apply / undo / redo；
- 确定性 JSON 序列化与反序列化；
- 显式 schema migration 链；
- 通用结构 Validator。

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

迁移通过显式 `SceneDocumentMigration { fromVersion, toVersion, migrate }` 链完成。Core 不假定版本号一定采用 semver，也不自动猜测迁移路径。

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
