# 外部 Agent 接口设计

## 1. 产品原则

Worldform 不实现聊天机器人，也不绑定模型供应商。它负责让外部 Agent **可理解、可调用、可验证、可预览、可撤销**。

## 2. 两类 Agent 工作必须分开

### 开发 Worldform

读取仓库 `AGENTS.md` 与 `.agents/skills/worldform-development/SKILL.md`，修改 Worldform 自己的代码与协议。

### 在第三方项目接入 Worldform

读取 `.agents/skills/worldform-adapter-development/SKILL.md` 和第三方接入文档。原则上只修改消费者项目，不修改 Worldform。

两类任务不可混为一谈。

## 3. Level 1 — Markdown / Skill

稳定入口包括：

```text
AGENTS.md
agent/README.md
docs/ARCHITECTURE.md
docs/PROJECT_ADAPTER.md
docs/THIRD_PARTY_INTEGRATION.md
.agents/skills/*
```

Skill 教 Agent 执行特定工作流，Markdown 文档解释协议与边界。

## 4. Level 2 — CLI

已实现首批命令：

```text
worldform validate <scene>
worldform adapter check <adapter>
worldform inspect <scene>
worldform export <scene> --adapter <adapter> --target <target>
```

CLI 面向 Agent、CI、批处理脚本和 Adapter 开发者。CLI 必须调用 Workspace/Adapter Host，不复制验证或 Adapter lifecycle。

所有命令支持 `--json`。稳定退出码为：`0` 成功、`2` 参数错误、`3` 输入错误、`10` 验证失败、`11` Adapter 错误、`12` 其它执行错误。诊断保留 `code/source/sourceId/path/severity`。

## 5. Level 3 — MCP

MCP 已可操作正在运行中的 Workspace Session。

首批工具域：

```text
scene.*
project.*
change.*
history.*
preview.*
```

已实现工具：

```text
scene.get / scene.query / scene.create / scene.update / scene.delete
project.listCapabilities / project.callCapability / project.validate
change.preview / change.apply / change.discard
history.undo / history.redo
preview.play / preview.stop
```

Mutation 必须返回或构造结构化 Patch / DraftChange。调用顺序是 `scene.get` 读取 revision，mutation 创建 Draft，`change.preview` 检查 Ghost diff，最后明确 Apply 或 Discard。

MCP 不拥有独立 Scene 状态，不直接改 Pascal store，不提供任意文件系统或任意代码执行。

## 6. Revision / DraftChange

所有 Agent mutation 都必须基于明确 revision：

```text
Agent
  ↓ read revision N
产生 patches + baseRevision=N
  ↓
Workspace Validate
  ↓
DraftChange / Ghost Preview
  ↓
用户或调用方 Apply
```

如果场景已经变为 revision N+1，不能把旧修改静默覆盖到新文档。

## 7. Ghost Preview

建议状态：

```text
DraftChange
├─ id
├─ source
├─ baseRevision
├─ patches[]
├─ validation
└─ status: preview | applied | discarded
```

执行顺序：Patch → Core Validate → Adapter Validate → Preview → Apply/Discard → History。

## 8. Capability 调用

如果项目已经提供 `generate`、`validate`、`simulate` 等 capability，Agent 应调用 capability，而不是自己根据部分源码“模拟”项目算法。

如果缺 capability，优先在项目 Adapter 中补充并运行契约测试。

## 9. 当前阶段

现阶段 Markdown/Skill、Core、Workspace、Adapter SDK/Host、Editor、CLI、MCP 与 Ghost Preview 已可用。MCP 仍只能作为 Workspace 入口，不能成为新的应用层。独立 stdio 进程与浏览器 Editor 的跨进程同步不属于 Phase 1；同进程宿主可直接共享 Workspace。
