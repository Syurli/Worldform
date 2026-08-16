# @worldform/pascal-adapter

当前 Platform Alpha 包版本为 `0.1.0-alpha.1`，并继续锁定 Pascal `0.9.2`。

Pascal 作者视图的隔离层。它把权威 `SceneDocument` 投影为 Pascal 工作副本，并把视图中的变化重新收敛为 `ScenePatch[]`。

## 数据边界

```text
Workspace SceneDocument
        ↓ project
Pascal working copy
        ↓ collect diff
ScenePatch[] → DraftChange → Workspace
```

Pascal Store、Three Object3D 和 React state 都不是正式场景数据。调用方必须通过 Workspace 验证并 Apply Patch。

## 已锁定上游

- `@pascal-app/core@0.9.2`
- `@pascal-app/viewer@0.9.2`
- npm 构建对应上游 commit：`cdf026bb92426cb7bd2807ce447e029dadbdaa86`

升级、上游缺口和 History 分工见 `docs/decisions/ADR-008-PASCAL-AUTHORING-ALPHA.md`。

## 当前公共能力

- `projectSceneDocumentToPascal`：按 Adapter descriptor 投影节点、层级和预览信息；
- `collectPascalProjectionPatches`：产生 Transform、Create、Delete Patch；
- `PascalAuthoringSession`：管理 Pascal 工作副本的装载、快照和释放；
- `ensureWorldformPascalPlugin`：注册通用 namespaced Pascal 节点和 renderer。

项目节点类型保留在 `worldformType`，Pascal registry 只注册一个 `worldform:node`。因此第三方 Adapter 增加节点类型时不需要修改此包。
