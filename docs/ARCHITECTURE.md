# Worldform 架构基线

> 状态：Phase 1 / Foundation

## 1. 目标

Worldform（万类）是一套通用场景与空间内容编辑框架。

它负责：

- 描述场景；
- 编辑空间与对象；
- 记录结构化修改；
- 调用项目真实能力；
- 验证与预览；
- 将结果交给项目 Runtime 或成熟引擎。

它不负责成为完整游戏引擎，也不复制项目业务系统。

## 2. 分层

```text
                    Worldform
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
      Core          Editor Host     Director
        │              │              │
 SceneDocument      Pascal/Three   Timeline
 Operations         2D / 3D        Camera
 Patch              Inspector      Actor/Object
 Validation         Asset Browser  Event/Marker
        │              │              │
        └───────┬──────┴──────┬───────┘
                ▼             ▼
          Project Adapter   Agent Interface
                │             │
       Capability/Validator  Markdown
       Export/Preview        CLI / MCP
                │             │
                └──────┬──────┘
                       ▼
                     Bridge
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
     Web Runtime      Unreal       Unity/Godot
```

## 3. 权威数据

### 3.1 SceneDocument

Worldform 的权威场景数据是 `SceneDocument`，不是渲染器对象。

第一阶段采用扁平节点结构：

```text
SceneDocument
├─ id
├─ schemaVersion
├─ projectAdapterId
├─ rootNodeIds[]
└─ nodes{}
   └─ SceneNode
      ├─ id
      ├─ type
      ├─ parentId
      ├─ transform
      ├─ components
      ├─ tags
      └─ metadata
```

`components` 是扩展容器。Core 不解释诸如 `wfcConnector`、`lootAnchor`、`placementRule` 的业务语义，具体 schema 与行为由项目 Adapter 提供。

### 3.2 不允许成为权威数据的对象

以下对象只能是投影或 Runtime 表现：

- Three.js `Object3D`
- Pascal Scene Store
- Babylon.js Node / Mesh
- Jolt Body
- Unreal Actor
- Unity GameObject

它们必须可以从正式场景数据重新构建。

## 4. Scene Operations 与 Patch

所有可持久化修改最终都应该被表达为结构化 Patch：

```text
create(node)
update(id, changes)
delete(id, cascade)
```

第一阶段 `@worldform/core` 已提供最小纯函数 Patch 执行器。

后续能力都应尽量建立在它之上：

```text
人工编辑
   │
外部 Agent
   │
MCP
   │
Project Capability
   │
   ▼
ScenePatch[]
   │
   ├─ Validate
   ├─ Ghost Preview
   ├─ Apply / Discard
   ├─ Undo / Redo
   └─ Diff / History
```

禁止为 AI、MCP、Gizmo 各自维护互不兼容的修改通路。

## 5. Project Adapter

Project Adapter 是 Worldform 最关键的扩展边界。

最小职责：

```text
manifest
listCapabilities()
validateDocument()
callCapability()
listExportTargets()
exportDocument()
```

项目能力可以来自：

- 项目自己的共享 TypeScript package；
- 本地进程；
- HTTP 服务；
- 引擎插件 Bridge；
- 其它稳定 IPC。

Worldform 只调用，不复制算法。

### 示例：《战术巫师》

Worldform Adapter 可暴露：

```text
generateWfcLevel
validateLevel
validateNavigation
validateSeedBatch
inspectPortalGraph
exportResolvedLevel
```

但 TC-WFC / Mission Topology / Portal / Navigation 实现仍留在游戏项目。

### 示例：《物有所归》

可暴露：

```text
validatePlacement
simulatePlacement
evaluateSettledState
validateSecrets
exportPlace
```

实际归位、物理与完成规则仍留在游戏项目。

## 6. Pascal 接入

Pascal 是 Authoring Layer，不是 Worldform Core。

推荐关系：

```text
Worldform SceneDocument
        │
        ▼
@worldform/pascal-adapter
        │
        ▼
Pascal Core / Viewer / Editor
        │
        ▼
作者视图
```

反向编辑应转换为 `ScenePatch[]` 后再进入 Worldform 正式文档。

第一阶段不直接引入 `@pascal-app/*`，先验证：

1. 自定义节点；
2. Transform / Gizmo；
3. 2D/3D 投影；
4. Selection；
5. Undo/Redo 与 Worldform Patch 的边界；
6. 自定义 Inspector；
7. Connector / Anchor 等游戏节点；
8. 导入 / 导出一份真实样板间。

PoC 通过后，在 `packages/pascal-adapter` 锁定明确的上游版本或 commit。

## 7. Aedifex 借鉴范围

Aedifex 最值得借鉴的是：

```text
结构化操作
  ↓
本地校验
  ↓
Ghost Preview
  ↓
用户确认
  ↓
Apply
```

Worldform 不复制它的建筑领域提示词和内置聊天系统。

Worldform 的 Agent 操作应最终调用自身 Operations / Project Capability，并保持模型供应商无关。

## 8. Agent Interface

Worldform 自己不提供 LLM。

三级入口：

1. **Markdown / Skill**：让 Agent 理解项目与扩展方式；
2. **CLI**：让 Agent 能在无 UI 环境验证、导出、检查 Adapter；
3. **MCP**：让 Agent 操作正在运行的 Worldform 会话。

对话发生在用户选择的 Codex / Claude Code / 其它 Agent 中。

## 9. 预览分层

必须区分：

### Authoring Preview

用于编辑器快速反馈，当前计划基于 Pascal + Three.js/WebGPU。

### Project Preview

使用项目自己的正式环境：

- 战术巫师：Babylon / Jolt / Voxel 路线；
- 物有所归：Babylon / Jolt；
- Unreal 项目：Unreal Preview / PIE / 专用 Bridge。

Worldform 不为了像素级一致而重新实现每个项目的渲染器。

## 10. Director 边界

Director 是轻量导演台，不是完整 Sequencer。

第一阶段只锁定五类语义：

- Camera
- Actor
- Object
- Event
- Marker

未来 Web 项目可直接运行 Timeline JSON；成熟引擎则通过 Bridge 转换为基础 Camera / Marker / Sequence 内容后进入正式引擎精修。

## 11. Bridge 边界

Bridge 只同步 Worldform 负责的数据，例如：

- Transform
- 白盒
- Camera
- Zone
- Anchor
- Marker
- Gameplay Metadata

不追求无损双向同步：

- Nanite
- Niagara
- Landscape
- 复杂 Blueprint
- 完整 Sequencer
- World Partition
- 项目专属高级材质

## 12. Core 晋升规则

新增功能进入 Core 前必须回答：

> 是否至少两个真实项目都需要它？

典型 Core：Transform、Scene Tree、Patch、Undo/Redo、Schema、Diff、Validation Result、基础 Timeline。

典型 Adapter：WFC、敌人刷新、归位规则、体素破坏、任务系统、某项目导航算法。

## 13. 第一阶段完成定义

Phase 1 完成时应满足：

- Core 可独立 typecheck/test；
- SceneDocument 与 Patch 有基础测试；
- Adapter API 可被独立项目实现；
- Pascal 接入只经过隔离层；
- 两个真实项目各有一个最小 Adapter 验证样例；
- Agent 能从仓库文档理解如何新增 Adapter；
- 不需要启动任何 LLM 即可完成上述验证。
