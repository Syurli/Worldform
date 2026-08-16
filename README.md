# 万类 · Worldform

> 百舸体系下的通用场景与空间内容编辑框架。

**万类**取意自《沁园春·长沙》“万类霜天竞自由”。`Worldform` 为当前英文工作名。

万类不是游戏引擎，也不试图重新实现 Unity / Unreal。它提供一套轻量、开放、结构化的场景工作环境，让人工或外部智能体能够设计空间、布置对象、编辑白盒、调用项目真实规则进行验证，并将结果交给对应游戏或正式引擎。

## 当前开发策略

Worldform 从第一天按照“第三方可接入的平台”开发，而不是先内嵌某一款游戏再反向抽象。

当前目标是 **Platform Alpha / Third-party Ready**：

```text
Core
  ↓
Workspace / Session
  ↓
Adapter SDK + Adapter Host
  ↓
Editor / CLI / MCP
  ↓
第三方项目按正式流程接入
```

《战术巫师：裂隙突围》和《物有所归 / Place & Seek》仍是首批真实验收项目，但它们在 Phase 1 平台门槛完成后，作为独立第三方项目接入，不进入当前 Worldform 核心开发流程。

## 不可破坏的原则

1. **SceneDocument 是权威数据。** Pascal / Three / Babylon / Unreal 对象都只是投影或 Runtime 表现。
2. **所有持久化修改统一落为结构化 Patch。** 人工编辑、CLI、MCP、项目能力不得维护互不兼容的修改通路。
3. **Editor、CLI、MCP 共用 Workspace / Session 应用层。** 不分别实现加载、验证、Apply、Undo、Adapter 调用。
4. **项目业务规则留在项目仓库。** WFC、物理放置、导航、任务等只通过 Project Adapter 调用。
5. **Worldform 不绑定大语言模型。** 外部 Agent 通过 Skill、CLI、MCP 使用万类。
6. **至少两个真实项目都需要的能力，才优先进入 Core。**

## 目标架构

```text
                  Editor
                    │
             CLI ───┼─── MCP
                    │
                    ▼
           Worldform Workspace
             / Session Layer
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
      Core      Adapter Host   Preview
       │            │
 SceneDocument      ▼
 Patch/History   Project Adapter
 Validation         │
 Migration          ▼
                项目真实代码
```

## 仓库结构

```text
Worldform/
├─ apps/
│  └─ editor/                    # Web 作者工具宿主
├─ packages/
│  ├─ core/                      # 权威场景数据、Patch、History、Migration、Validation
│  ├─ workspace/                 # 统一应用层 / Session
│  ├─ adapter-api/               # 最小稳定适配协议
│  ├─ adapter-sdk/               # 第三方开发 SDK / 契约测试工具
│  ├─ pascal-adapter/            # Pascal 作者视图隔离层
│  ├─ cli/                       # Agent / CI 命令行
│  ├─ mcp/                       # 运行中编辑会话的 MCP 入口
│  └─ director/                  # 后续轻量导演台
├─ examples/
│  ├─ example-adapter/           # 通用、无游戏业务的适配样例
│  ├─ tactical-wizard/           # Phase 2 验收参考占位
│  └─ place-and-seek/            # Phase 2 验收参考占位
├─ .agents/skills/               # 仓库级 Agent Skills
├─ agent/                        # 外部 Agent 稳定阅读入口
└─ docs/
   ├─ ARCHITECTURE.md
   ├─ ROADMAP.md
   ├─ PROJECT_ADAPTER.md
   ├─ THIRD_PARTY_INTEGRATION.md
   ├─ AGENT_INTERFACE.md
   ├─ decisions/
   └─ tasks/
```

`packages/workspace` 已实现统一应用管线与 AdapterHost；`packages/adapter-sdk` 已提供 descriptor helper、基础 schema 验证和 contract report。

## 当前阶段

Phase 1 的完成标准不是“已经支持两款游戏”，而是：

> 一个不修改 Worldform 源码的独立项目，能够只依赖正式文档、SDK、Skill、CLI 与 MCP，由开发者或 Codex 完成 Adapter，并通过契约测试与 Clean-room 验收。

当前执行顺序见 [`docs/tasks/README.md`](docs/tasks/README.md)。完整路线见 [`docs/ROADMAP.md`](docs/ROADMAP.md)。

## 开发

```bash
pnpm install
pnpm check
pnpm test
```

当前 Core 基线已经具备 SceneDocument、Patch/Inverse Patch、History、稳定序列化、Migration 与结构校验。下一步优先收口协议和统一应用层，不直接进入任何游戏 Adapter。

## 许可说明

Worldform 自身最终开源许可尚待单独确认。Pascal Editor 与 Aedifex 为独立上游项目；任何后续代码复用、分发与归属均必须保留对应上游许可与归属信息。
