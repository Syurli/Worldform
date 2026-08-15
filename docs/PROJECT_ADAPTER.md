# Project Adapter 开发说明

## 1. 目的

Project Adapter 让 Worldform 使用项目自己的真实能力，而不是在编辑器里复制一份业务逻辑。

```text
Worldform
   │
   ▼
Project Adapter
   │
   ▼
项目真实代码 / Runtime / 服务
```

一个 Adapter 可以很薄。它的职责是“翻译和调用”，不是重新实现项目。

## 2. 第一阶段接口

接口位于：

```text
packages/adapter-api/src/index.ts
```

核心类型：

- `ProjectAdapterManifest`
- `ProjectCapabilityDescriptor`
- `ProjectCapabilityRequest`
- `ProjectCapabilityResult`
- `ProjectExportTarget`
- `WorldformProjectAdapter`

## 3. Capability

Capability 表示项目愿意暴露给 Worldform 的真实能力。

典型类型：

```text
generate
validate
simulate
query
compile
```

Capability 可以返回：

- 普通结果 `output`；
- 建议的 `ScenePatch[]`；
- `ValidationResult`；
- 面向用户或 Agent 的消息。

### 为什么允许返回 Patch

例如外部 Agent 请求：

> 给当前仓库增加一条侧翼路线。

正确流程可以是：

```text
Agent
  ↓
project.callCapability("suggestFlankRoute")
  ↓
项目真实逻辑
  ↓
ScenePatch[]
  ↓
Worldform Ghost Preview
  ↓
Validate
  ↓
Apply / Discard
```

这样 Agent 和项目逻辑都不需要直接修改 Three/Pascal 场景。

## 4. Schema 与 Component

Worldform Core 的 `SceneNode.components` 是通用容器。

例如战术巫师可以定义：

```json
{
  "components": {
    "twr.connector": {},
    "twr.enemyAnchor": {},
    "twr.lootAnchor": {}
  }
}
```

《物有所归》可以定义：

```json
{
  "components": {
    "place.interaction": {},
    "place.placement": {},
    "place.secret": {},
    "place.physicsProfile": {}
  }
}
```

这些 key 的 schema、编辑方式和业务校验由 Adapter 提供；Core 只保证文档结构。

第一阶段先保持接口简单，后续再补 `registerComponentSchema()` 一类注册 API。

## 5. Validator 分层

建议验证顺序：

```text
Core structural validation
        ↓
Adapter schema validation
        ↓
Project business validation
        ↓
Bridge/runtime validation（如需要）
```

所有问题统一转换成 Worldform `ValidationIssue`，并标记来源。

## 6. Exporter

Exporter 负责从 Worldform 场景语义转换为项目正式格式。

例如：

```text
TWR Adapter
Worldform SceneDocument
→ LevelModuleDefinition / FixedLevelDefinition
```

```text
Place Adapter
Worldform SceneDocument
→ *.place.json
```

不要把 Pascal/Three 的场景序列化结果作为正式项目格式。

## 7. Preview

后续 Project Preview 应通过 Adapter / Bridge 启动项目自己的预览环境。

作者视图与运行预览分开：

```text
Pascal / Three
= Authoring Preview

Babylon / Unreal / 项目 Runtime
= Project Preview
```

## 8. 战术巫师适配建议

Worldform 侧负责编辑：

- WFC Module 外形；
- Connector；
- Walk Surface；
- Obstacle；
- Enemy / Loot Anchor；
- Extraction；
- Key Node；
- 固定关卡结构。

项目侧保留：

- TC-WFC；
- Mission Topology；
- Portal Graph；
- Navigation；
- Seed / Retry / Fallback；
- Runtime 构建。

推荐 Capability：

```text
validateModule
generateLevel
validateLevel
validateSeedBatch
inspectPortalGraph
inspectNavigationGraph
exportDefinition
```

## 9. 物有所归适配建议

Worldform 侧负责编辑：

- PlaceObject；
- Zone；
- Container；
- Placement Target；
- Secret / Memory；
- Physics Profile 引用；
- Camera / 展示辅助。

项目侧保留：

- 真实 Placement 判定；
- Physical Snap；
- Jolt 模拟规则；
- Discover / Secret / Completion；
- Settled State 判定。

推荐 Capability：

```text
validatePlacement
simulatePlacement
evaluateSettledState
validatePlace
exportPlace
```

## 10. 成熟引擎项目

Unreal / Unity / Godot Adapter 不应尝试导入全部引擎对象。

第一轮只定义 Worldform 真正拥有的数据：

- Transform；
- 白盒；
- Zone；
- Anchor；
- Marker；
- Camera；
- 基础 Gameplay Metadata。

再由引擎端 Bridge 创建对应 Actor / Volume / Camera / Marker。

## 11. Adapter 验收清单

一个新的 Adapter 至少需要：

- [ ] 唯一 `manifest.id`；
- [ ] 文档 schemaVersion；
- [ ] 最少一个 Validator；
- [ ] Capability 列表；
- [ ] Capability 输入输出说明；
- [ ] Export target；
- [ ] 契约测试；
- [ ] 明确哪些能力仍由项目真实代码负责；
- [ ] 不依赖 Pascal/Three 内部序列化作为正式格式。
