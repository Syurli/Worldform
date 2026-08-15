# 万类 · Worldform

> 百舸体系下的通用场景与空间内容编辑框架。

**万类**取意自《沁园春·长沙》“万类霜天竞自由”。`Worldform` 为当前英文工作名。

万类不是游戏引擎，也不试图重新实现 Unity / Unreal。它提供一套轻量、开放、结构化的场景工作环境，让人工或外部智能体能够设计空间、布置对象、编辑白盒、调用项目真实规则进行验证，并将结果交给对应游戏或正式引擎。

## 核心定位

```text
人 / 外部 Agent
      │
      ▼
 Worldform Editor
      │
      ├─ SceneDocument / Operations / Undo / Diff
      ├─ 3D / 2D Authoring
      ├─ Project Adapter
      ├─ Validation / Preview
      ├─ Director（后续阶段）
      └─ CLI / MCP（后续阶段）
      │
      ▼
项目自己的真实能力
      │
      ├─ Web Runtime
      ├─ Unreal
      ├─ Unity / Godot
      └─ 自研运行时
```

### 长期原则

1. **万类不拥有项目业务规则。** WFC、物理放置、导航、任务等规则始终来源于对应项目代码库。
2. **万类不绑定大语言模型。** 不维护聊天窗口、模型供应商、API Key、模型路由或对话历史；外部 Agent 通过文档、CLI、MCP 使用万类。
3. **编辑数据与运行时解耦。** Three.js / Babylon.js / Unreal Actor 都不是场景语义的权威数据。
4. **至少两个真实项目都需要的能力，才考虑进入 Core。** 游戏专属能力进入 Project Adapter。
5. **Authoring Preview 与 Project Preview 分离。** 编辑器追求快速可靠，正式效果由项目自己的运行环境负责。

## 第一批真实项目

### 《战术巫师：裂隙突围》

验证“大空间 + 程序生成”工作流：WFC 样板间、Connector、Walk Surface、Obstacle、Enemy/Loot Anchor、固定关卡、Seed/QA/Batch 等。TC-WFC、Mission Topology、Portal、Navigation、Validator 仍由游戏项目提供。

### 《物有所归 / Place & Seek》

验证“小空间 + 高密度互动”工作流：家具、小物件、容器、整理区域、秘密、回忆物、物理属性与互动对象。放置合法性、物理模拟、归位判定和完成条件仍由游戏项目提供。

## 技术起点

- **Pascal Editor**：作为通用场景编辑、参数化对象、2D/3D 视图和工具体系的重要技术参考与接入候选。
- **Aedifex**：重点参考其“结构化操作 → 校验 → Ghost Preview → 确认 → Apply”的智能体编辑闭环。
- **Worldform Core**：长期真正需要独立沉淀的部分，包括 `SceneDocument + Operations + Adapter + Bridge + Director + CLI/MCP/Skill`。

> 万类不会简单 Fork Pascal 或 Aedifex 后改名。上游项目是技术起点与参考，Worldform 的项目协议、场景语义和跨项目适配能力保持独立。

## 仓库结构

```text
Worldform/
├─ apps/
│  └─ editor/                 # 独立 Web 编辑器宿主（第一阶段占位骨架）
├─ packages/
│  ├─ core/                   # SceneDocument / Operations / Patch / Validation
│  ├─ adapter-api/            # 项目适配协议
│  ├─ pascal-adapter/         # Pascal 接入边界（第一阶段只定义边界）
│  ├─ cli/                    # Agent / CI 可调用命令行（后续实现）
│  ├─ mcp/                    # 操作运行中编辑器（后续实现）
│  └─ director/               # 轻量导演台（后续阶段）
├─ examples/
│  ├─ tactical-wizard/        # 战术巫师适配样例占位
│  └─ place-and-seek/         # 物有所归适配样例占位
├─ docs/
│  ├─ ARCHITECTURE.md
│  ├─ ROADMAP.md
│  ├─ PROJECT_ADAPTER.md
│  ├─ AGENT_INTERFACE.md
│  └─ decisions/
├─ agent/                     # 给外部 Agent 阅读的稳定入口
└─ AGENTS.md                  # Codex / Agent 开发约束
```

## 当前阶段：Phase 1 — Foundation

第一阶段只建立“正确的骨架”，不急于扩展完整产品功能：

- 建立 TypeScript monorepo 与包边界；
- 定义最小 `SceneDocument`、节点、Transform、Patch 与操作接口；
- 定义 Project Adapter 最小协议；
- 建立 Pascal 接入隔离层；
- 建立两个真实项目的适配占位与契约测试方向；
- 建立 Agent 文档入口；
- 为后续 CLI、MCP、Ghost Preview 和 Director 保留稳定边界。

详见 [`docs/ROADMAP.md`](docs/ROADMAP.md) 与 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)。

## 开发

```bash
pnpm install
pnpm check
pnpm test
```

当前仓库处于基础搭建阶段。第一阶段原则上不引入具体游戏 Runtime，也不在 Core 中依赖 Three.js、Babylon.js、React、Jolt 或任何游戏业务代码。

## 许可说明

Worldform 自身的最终开源许可尚待单独确认。Pascal Editor 与 Aedifex 为独立上游项目；任何后续代码复用、分发与归属均必须保留对应上游许可与归属信息。