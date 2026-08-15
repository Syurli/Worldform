# 外部 Agent 接口设计

## 1. 产品原则

Worldform 本身不实现聊天机器人，也不绑定任何模型供应商。

不进入 Worldform 核心的内容：

- 聊天窗口；
- OpenAI / Anthropic / 本地模型 SDK；
- API Key 管理；
- Token 统计；
- 模型路由；
- 对话历史；
- Agent Runtime。

对话发生在用户选择的 Codex、Claude Code 或其它外部 Agent 中。

Worldform 负责让这些 Agent **可理解、可调用、可验证、可预览、可撤销**。

## 2. 三级接口

### Level 1 — Markdown / Skill

这是最基础、也必须长期稳定的入口。

Agent 应先阅读：

```text
AGENTS.md
agent/README.md
docs/ARCHITECTURE.md
docs/PROJECT_ADAPTER.md
```

目标：即使没有启动 Worldform，Agent 也能理解场景格式、Adapter 边界和开发约束。

### Level 2 — CLI

规划中的命令：

```text
worldform validate <scene>
worldform adapter:check <adapter>
worldform export <scene> --target <target>
worldform director:validate <timeline>
```

CLI 的主要用户不是普通玩家，而是：

- Codex / Claude Code；
- CI；
- 批处理脚本；
- Adapter 开发者。

典型循环：

```text
Agent 写 Adapter
      ↓
worldform adapter:check
      ↓
失败
      ↓
Agent 修改
      ↓
检查通过
```

### Level 3 — MCP

MCP 用于操作正在运行中的 Worldform 编辑会话。

建议工具域：

```text
scene.*
project.*
preview.*
change.*
history.*
director.*
```

首批目标工具：

```text
scene.get
scene.query
scene.create
scene.update
scene.delete

project.listCapabilities
project.callCapability
project.validate

change.preview
change.apply
change.discard

preview.play
preview.stop

history.undo
history.redo
```

Director 成熟后增加：

```text
director.get
director.createCue
director.updateCue
director.deleteCue
```

## 3. Agent 修改必须结构化

禁止：

```text
LLM -> 直接改 Three Object3D
LLM -> 直接改 Pascal store 内部字段
```

正确：

```text
LLM / Agent
    ↓
Tool / Capability
    ↓
ScenePatch[]
    ↓
Core + Project Validation
    ↓
Ghost Preview
    ↓
Apply / Discard
```

这样可以统一：

- 人工修改；
- Agent 修改；
- MCP 修改；
- 项目能力生成结果；
- Undo / Redo；
- Diff / 审计。

## 4. Ghost Preview

参考 Aedifex 的成熟思路，但改为 Worldform 自己的 Patch 模型。

建议状态：

```text
Draft Change
├─ changeId
├─ source
├─ patches[]
├─ validation
└─ status
   ├─ preview
   ├─ applied
   └─ discarded
```

执行顺序：

1. Agent 产生 Patch；
2. Core 结构校验；
3. Project Adapter 业务校验；
4. 编辑器显示半透明/差异预览；
5. 用户确认；
6. Apply；
7. 进入 History。

## 5. Agent 不应该猜项目规则

如果项目提供 capability：

```text
validateLevel
generateLevel
validatePlacement
simulatePlacement
```

Agent 应调用 capability，而不是阅读部分代码后在提示词里“模拟”业务算法。

如果缺少所需 capability，Agent 可以：

1. 阅读 Project Adapter 文档；
2. 阅读项目真实代码；
3. 为 Adapter 增加 capability；
4. 运行契约测试；
5. 再通过 Worldform 调用。

## 6. 运行中场景与仓库修改的区别

外部 Agent 有两类工作：

### 开发 Worldform / Adapter

通过仓库文件 + CLI + 测试完成。

### 编辑当前场景

通过 MCP / Worldform Operations 完成。

不要让 MCP 变成任意文件系统或任意代码执行通道；MCP 应专注 Worldform 能力。

## 7. 安全与可恢复性

MCP 正式实现时至少要求：

- mutation 与 query 工具区分；
- mutation 可审计；
- 所有修改可落为 Patch；
- destructive operation 有明确语义；
- Apply 前能校验；
- History 可撤销；
- Project capability 返回错误不能静默吞掉。

## 8. 第一阶段状态

当前只实现：

- Agent 文档入口；
- Core Patch 契约；
- Adapter capability 契约；
- CLI/MCP package 边界与计划工具域。

第一阶段不实现任何模型 API。
