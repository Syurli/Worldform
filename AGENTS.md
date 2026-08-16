# AGENTS.md — Worldform / 万类

本文件是 Codex、Claude Code 及其它代码智能体进入仓库后的首要开发约束。

## 1. 项目定义

万类是“通用场景与空间内容编辑框架”，不是游戏引擎，也不是某一款游戏的专用编辑器 Fork。

长期核心资产：

- SceneDocument / Resource / Reference
- Scene Operations / Patch / History / Diff
- Workspace / Session
- Project Adapter API / SDK / Host
- Authoring Layer / Preview / Bridge
- Director
- CLI / MCP / Agent Skill

Pascal Editor 是当前重要的作者工具技术起点；Aedifex 是结构化 Agent 操作闭环的重要参考。两者都不是 Worldform 的业务权威。

## 2. 当前阶段：Platform Alpha / Third-party Ready

当前不是《战术巫师》或《物有所归》的接入阶段。

执行顺序以 `docs/tasks/README.md` 为准：

1. P1-001 Core History / Serialization（已完成）
2. P1-002 Core Contract Hardening
3. P1-003 Workspace / Session
4. P1-004 Adapter SDK + Example Adapter
5. P1-005 Pascal Authoring Alpha
6. P1-006 CLI
7. P1-007 MCP + Ghost Preview
8. P1-008 Third-party Developer Kit
9. P1-009 Clean-room Validation

在 P1-009 通过前，不要直接实现 TWR / Place 的正式 Adapter，也不要为了它们向 Core 塞入项目专属语义。

## 3. 不可破坏的边界

### 3.1 Core 禁止依赖

`packages/core` 不得依赖：React/Next、Three/Babylon、Jolt、Pascal/Aedifex、Unreal/Unity/Godot SDK 或任何具体游戏代码。

Core 只能描述通用场景数据、Patch、History、Migration、结构验证与必要的通用协议。

### 3.2 Workspace 是唯一应用层

Editor、CLI、MCP 不得各自实现一套：

- 文档加载与 revision；
- History；
- DraftChange；
- Validate / Apply / Discard；
- Adapter lifecycle / capability 调用；
- 变更事件。

这些能力应收敛到 `packages/workspace`。

### 3.3 项目规则禁止复制

正确关系：

```text
Worldform Workspace
      ↓
Adapter Host
      ↓
Project Adapter
      ↓
项目真实 capability
```

例如 generate / validate / simulate / query / compile。Worldform 不重写业务算法。

### 3.4 渲染状态不是权威数据

不得把 Pascal store、Three Object3D、Babylon Node、Unreal Actor 序列化结果当正式 SceneDocument。正式内容必须能在没有 UI 与渲染器时读取、校验和迁移。

## 4. 数据与并发原则

正式实现时必须区分：

- Worldform document format version；
- Adapter API version；
- Project scene schema version；
- Adapter implementation version。

运行中场景必须有 revision。所有 DraftChange / Agent mutation 必须记录 `baseRevision`，旧 revision 的修改不能静默覆盖新状态。

所有持久化修改必须落为 Patch；Ghost Preview、Apply、Undo/Redo 和审计都复用同一语义。

## 5. Adapter 规则

`adapter-api` 保持小而稳定；`adapter-sdk` 提供开发便利、schema/descriptor 帮助、测试工具与模板；`Adapter Host` 负责加载、生命周期和 Transport。

不要把 stdio / HTTP / IPC 细节直接塞进业务 Adapter 接口。项目 Adapter 应描述“提供什么能力”，Host 决定“如何加载与调用”。

新增 Adapter 功能时必须回答：

- 它是通用场景语义还是项目语义？
- 能否不修改 Core 完成？
- 是否能由独立仓库实现并测试？
- 是否需要新的 capability / schema / preview descriptor，而不是新的硬编码分支？

## 6. Agent 策略

Worldform 不实现聊天机器人，不维护模型供应商、API Key、Token、模型路由、对话历史或 Agent Runtime。

外部 Agent 入口：

1. Markdown / `.agents/skills`
2. CLI
3. MCP

仓库开发 Skill 与第三方 Adapter 开发 Skill 必须分开，避免 Agent 把“修改 Worldform”误当成“接入 Worldform”。

## 7. 代码规范

- TypeScript 严格模式；公共 API 禁止用 `any` 绕过边界。
- Core 关键转换优先纯函数。
- 对外格式变更必须考虑迁移与兼容。
- 新增 Core 能力前检查是否至少两个真实项目需要。
- 新增公共协议时同步更新架构、ADR、任务和示例。
- 不为当前 PoC 预先实现完整 Director、材质/VFX/动画、物理、导航或完整引擎双向同步。

## 8. 提交前检查

至少执行：

```bash
pnpm check
pnpm test
pnpm lint
```

涉及 Adapter SDK / Workspace 时还应增加相应契约测试。

## 9. 文档入口

按顺序阅读：

1. `README.md`
2. `docs/PRODUCT_DEFINITION.md`
3. `docs/ARCHITECTURE.md`
4. `docs/ROADMAP.md`
5. `docs/PROJECT_ADAPTER.md`
6. `docs/THIRD_PARTY_INTEGRATION.md`
7. `docs/AGENT_INTERFACE.md`
8. `docs/decisions/`
9. 当前 `docs/tasks/` 任务

如果代码实现与架构文档冲突，不要静默选择其一；应更新 ADR 或明确提出冲突。
