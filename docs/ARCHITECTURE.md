# Worldform 架构基线

> 状态：Phase 1 / Platform Alpha

## 1. 目标

Worldform 的首要架构目标不是尽快做出某一款游戏的编辑器，而是先形成稳定、可测试、可由独立项目消费的场景平台协议。

## 2. 分层

```text
                  Editor Host
                      │
             CLI ─────┼───── MCP
                      │
                      ▼
             Workspace / Session
       ┌──────────────┼──────────────┐
       ▼              ▼              ▼
     Core        Adapter Host      Preview
       │              │
       │              ├─ lifecycle
       │              ├─ transport
       │              └─ capability dispatch
       │                      │
       ▼                      ▼
 SceneDocument          Project Adapter
 Patch / History               │
 Validation                    ▼
 Migration                项目真实代码
 Resource / Reference
                      │
                      ▼
                Authoring Layer
                Pascal / Three
```

Director 与成熟引擎 Bridge 在后续阶段接入 Workspace，不绕过应用层直接修改 Core 状态。

## 3. 权威数据

### 3.1 SceneDocument

Worldform 的权威场景数据是 `SceneDocument`，不是渲染器对象。

当前核心包含文档 ID、`formatVersion`、`projectAdapterId`、`projectSchemaVersion`、扁平节点、rootNodeIds、资源、引用和 metadata。运行态 revision 由 Workspace 单独维护，不写入磁盘文档。

`components` 是扩展容器。Core 不解释 `wfcConnector`、`placementRule` 等业务语义；具体 schema 与行为由项目 Adapter 提供。

### 3.2 非权威对象

以下只能是投影或 Runtime 表现：Pascal Store、Three Object3D、Babylon Node/Mesh、Jolt Body、Unreal Actor、Unity GameObject。

它们必须可以从正式场景数据重新构建。

## 4. Scene Patch 与 History

所有可持久化修改必须统一落为结构化 Patch。当前 Core 已实现 Node/Resource create/update/delete、Component/Property 细粒度修改、逆 Patch、History、稳定序列化和 Migration。

后续人工编辑、Capability、CLI、MCP、Ghost Preview 不得各自维护独立 mutation 格式。

## 5. Workspace / Session

`packages/workspace` 已实现为 Editor、CLI、MCP 共用的统一应用层。

它至少负责：

- 当前 SceneDocument；
- document revision；
- SceneHistory；
- DraftChange；
- Core + Adapter 验证管线；
- Apply / Discard；
- Adapter Host 会话；
- 变更事件 / 只读快照；
- 后续 Preview 状态。

Editor、CLI、MCP 都调用 Workspace，不直接各自组织 Core + Adapter。

推荐基本对象：

```text
WorldformWorkspace
├─ document
├─ revision
├─ history
├─ adapterSession
├─ draftChanges
├─ validate()
├─ previewChange()
├─ applyChange()
├─ discardChange()
├─ undo()
└─ redo()
```

## 6. Revision 与 DraftChange

运行中场景需要显式 revision。

建议 DraftChange 基线：

```text
DraftChange
├─ id
├─ source
├─ baseRevision
├─ patches[]
├─ validation
└─ status
   ├─ preview
   ├─ applied
   └─ discarded
```

当 `baseRevision` 与当前 revision 不一致时，不允许静默 Apply；必须拒绝、重算或进入明确的冲突处理流程。

## 7. 版本必须分层

不要继续把所有版本都叫 `schemaVersion`。正式协议至少区分：

1. **Document format version**：Worldform 通用文档格式；
2. **Adapter API version**：Worldform 与 Adapter 的协议兼容版本；
3. **Project scene schema version**：项目组件/节点语义版本；
4. **Adapter implementation version**：某个 Adapter 包自身版本。

P1-002 已收口命名、主版本兼容规则与显式迁移边界，详见 ADR-006。

## 8. Project Adapter：API、SDK、Host 分离

### adapter-api

最小而稳定，只定义 Adapter 与 Worldform 的协议类型。

### adapter-sdk

面向第三方开发者，提供：

- descriptor/schema 辅助；
- 测试 fixture；
- contract test；
- Adapter 模板；
- 错误与诊断辅助；
- 后续脚手架。

### Adapter Host

属于 Workspace/Application 侧，负责：

- 加载；
- 生命周期；
- timeout / cancellation；
- capability dispatch；
- Transport；
- 错误归一化。

Adapter 负责“提供什么能力”，Host 负责“如何连接并调用”。

Transport 可以逐步支持 in-process、stdio、本地 HTTP/IPC；不要把 Transport 细节写死进项目业务接口。

## 9. Pascal 接入

Pascal 是 Authoring Layer，不是 Core，也不拥有 Workspace 状态。

```text
Workspace SceneDocument
        │
        ▼
@worldform/pascal-adapter
        │
        ▼
Pascal Authoring View
        │
        ▼
用户编辑
        │
        ▼
ScenePatch[]
        │
        ▼
Workspace
```

Pascal PoC 必须使用通用 Example Adapter，不依赖 TWR / Place 语义，以证明未知项目节点可以通过 descriptor/schema 被编辑器呈现。

## 10. Agent Interface

三级入口：

1. Skill / Markdown：理解协议和接入流程；
2. CLI：无 UI 验证、检查、导出；
3. MCP：操作正在运行的 Workspace Session。

MCP 只是 Workspace 的一个外部入口，不能成为新的状态权威或任意代码执行通道。

## 11. 预览分层

### Authoring Preview

快速编辑反馈，当前计划基于 Pascal + Three.js/WebGPU。

### Project Preview

由项目自己的正式环境提供。Worldform 不重新实现游戏渲染、物理、导航或生成算法。

## 12. Bridge / Director

Bridge 只同步 Worldform 负责的 Transform、白盒、Camera、Zone、Anchor、Marker、Gameplay Metadata 等，不追求成熟引擎全场景无损双向同步。

Director 后续通过 Workspace 进入统一 Patch / Validation / History 管线。

## 13. Core 晋升规则

新增功能进入 Core 前必须回答：

> 是否至少两个真实项目都需要它，而且它无法合理留在 Workspace、Adapter SDK 或 Adapter 中？

## 14. Phase 1 完成定义

Platform Alpha 完成时应满足：

- Core 契约、版本和 revision 边界清晰；
- Workspace 统一 Editor/CLI/MCP 的状态与 mutation 管线；
- Adapter API / SDK / Host 分工明确且有契约测试；
- Pascal 作者视图只经隔离层工作；
- CLI 与 MCP 可用；
- Skill 与第三方文档可用；
- Clean-room 独立仓库能在不修改 Worldform 的情况下实现 Adapter；
- 之后才开始 TWR / Place 外部接入。
