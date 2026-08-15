# AGENTS.md — Worldform / 万类

本文件是 Codex、Claude Code 及其它代码智能体进入仓库后的首要开发约束。

## 1. 项目定义

万类是“通用场景与空间内容编辑框架”，不是游戏引擎，也不是某一款游戏的编辑器 Fork。

长期核心资产：

- SceneDocument
- Scene Operations / Patch / Undo / Diff
- Project Adapter
- Bridge
- Director
- CLI / MCP / Agent Skill

Pascal Editor 是当前重要的编辑器技术起点；Aedifex 是 Agent 操作闭环的重要参考。两者都不是 Worldform 的业务权威。

## 2. 不可破坏的边界

### Core 禁止依赖

`packages/core` 不得依赖：

- React / Next.js
- Three.js / React Three Fiber
- Babylon.js
- Jolt / 任意物理引擎
- Pascal / Aedifex
- Unreal / Unity / Godot SDK
- 《战术巫师》或《物有所归》的业务代码

Core 只能描述通用场景语义、操作与验证结果。

### 项目规则禁止复制

不要在 Worldform 中重写项目真实规则。

错误：

```text
Worldform 内重新实现 TWR WFC
Worldform 内重新实现 Place & Seek 的归位算法
```

正确：

```text
Worldform -> Project Adapter -> 项目真实 capability
```

例如：

```text
generate()
validate()
simulate()
query()
compile()
```

### 渲染状态不是权威数据

不得把 Three Object3D、Babylon Node、Unreal Actor 序列化结果作为正式 SceneDocument。

正式场景内容必须能在没有渲染器时读取、校验和迁移。

## 3. Agent 策略

Worldform 自身不实现聊天机器人，不维护模型供应商、API Key、模型路由、Token 统计或对话历史。

Agent 接口依次通过：

1. Markdown / Skill
2. CLI
3. MCP

对运行中场景的智能体修改必须最终落为可检查的结构化 Operation / Patch。后续 Ghost Preview 应建立在 Patch 上，而不是让 Agent 直接修改渲染对象。

## 4. 第一阶段开发范围

当前阶段优先级：

1. SceneDocument 最小模型
2. Patch / Operations 契约
3. 基础校验
4. Project Adapter API
5. Pascal 接入隔离层
6. 两个真实项目适配样例
7. 构建、测试、文档

本阶段不做：

- 完整 Director
- 完整 MCP
- 完整 CLI 产品体验
- 内置 LLM
- 完整材质/VFX/动画编辑器
- 通用物理或导航系统
- Unreal/Unity 全场景双向同步

## 5. 代码规范

- TypeScript 严格模式。
- 公共 API 需要明确类型，禁止用 `any` 绕过边界。
- Core 的关键转换尽量写成纯函数。
- Schema/version 字段从第一天保留。
- 所有项目适配必须能够独立测试。
- 新增 Core 能力前，先判断是否至少两个真实项目会使用；否则优先进入 adapter。
- 对外格式变更必须考虑迁移策略，不直接静默破坏旧文档。

## 6. 提交前检查

至少执行：

```bash
pnpm check
pnpm test
```

如果修改 Project Adapter，还应增加或更新契约测试。

## 7. 文档入口

开发前阅读：

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/PROJECT_ADAPTER.md`
- `docs/AGENT_INTERFACE.md`
- `docs/decisions/`

如果代码实现与架构文档冲突，不要静默选择其一；应同步更新 ADR 或明确提出冲突。
