# Project Adapter 开发说明

## 1. 目的

Project Adapter 让 Worldform 调用项目自己的真实能力，而不是在编辑器里复制业务逻辑。

```text
Worldform Workspace
      ↓
Adapter Host
      ↓
Project Adapter
      ↓
项目真实代码 / Runtime / 服务
```

一个 Adapter 应尽量薄：负责翻译、描述和调用，不负责重新实现项目。

## 2. 三层职责

### `@worldform/adapter-api`

最小稳定协议。定义 manifest、capability、validation、export 等公共类型。

### `@worldform/adapter-sdk`

面向第三方开发者的便利层，已提供 schema/descriptor helper、fixture、contract report 与诊断入口；模板和发布流程在 P1-008 完成。

### Adapter Host

属于 Worldform Workspace，当前已实现 in-process lifecycle、timeout/cancellation、capability/export dispatch 与错误归一化；后续 Transport 复用同一业务协议。

不要把 stdio / HTTP / IPC 细节直接写进业务 Adapter 类型。

## 3. 版本规则

正式 Adapter 必须区分：

- `adapterApiVersion`：协议兼容版本；
- `sceneSchemaVersion`：该项目的场景语义版本；
- `version`：Adapter 实现自身版本；
- Worldform 文档格式版本由 Core 单独管理。

不能用一个 `schemaVersion` 同时承担多个含义。

## 4. Capability

Capability 表示项目愿意暴露给 Worldform 的真实能力，典型类型包括 generate / validate / simulate / query / compile。

Capability 可以返回：

- 普通结构化 output；
- 建议的 `ScenePatch[]`；
- ValidationResult；
- 诊断消息。

如果 Capability 产生场景修改，应进入 Workspace DraftChange，而不是直接修改当前文档。

## 5. Node / Component / Property 描述

Core 的 `SceneNode.components` 是通用容器，业务 schema 与编辑方式由 Adapter 声明。

P1-004 将建立 descriptor/schema 边界，使 Editor 不需要预先知道项目节点：

```text
Adapter 注册未知 Node/Component
        ↓
Editor 读取 descriptor/schema
        ↓
动态 Scene Tree / Inspector
        ↓
ScenePatch
```

这项能力先由通用 Example Adapter 验证，禁止直接拿 TWR/Place 作为唯一设计来源。

## 6. Validator 分层

```text
Core structural validation
        ↓
Adapter schema validation
        ↓
Project business validation
        ↓
Bridge/runtime validation（如需要）
```

所有结果统一归一为 Worldform ValidationIssue，并保留来源。

## 7. Exporter / Preview

Exporter 从 Worldform 场景语义转换为项目正式格式，不允许把 Pascal/Three 内部序列化结果当项目格式。

Project Preview 由项目真实环境负责；Authoring Preview 与 Project Preview 分离。

## 8. Transport

Adapter 的业务契约不绑定进程模型。Host 可逐步支持：

- in-process TypeScript；
- stdio 本地进程；
- local HTTP / IPC；
- 引擎 Bridge。

Transport 只解决“怎么连接”，不改变 Capability 语义。

## 9. 第三方项目的正确接入位置

正式 Adapter 默认应位于消费者项目仓库，而不是 Worldform 仓库：

```text
YourGame/
├─ src/...
├─ tools/worldform/ 或 plugins/worldform/
│  ├─ adapter
│  ├─ schemas
│  ├─ tests
│  └─ README.md
└─ ...
```

开发者或 Codex 应只依赖 Worldform 的 SDK/Skill/CLI/MCP。若不得不修改 Worldform 才能接入，应把它记录为平台缺口，而不是把项目代码偷偷搬进 Core。

## 10. Adapter 验收清单

至少要求：

- 唯一 Adapter ID；
- 明确 API / project schema / implementation 版本；
- 节点/组件 descriptor；
- Validator；
- Capability 列表及输入输出 schema；
- Export target（如需要）；
- 契约测试；
- 明确项目真实规则所有权；
- 不依赖 Pascal/Three 内部持久化；
- 能在不修改 Worldform 的情况下加载和验证。

完整外部接入流程见 `THIRD_PARTY_INTEGRATION.md`。
