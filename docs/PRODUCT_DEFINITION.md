# 万类 · Worldform 产品定义

> 百舸体系下，面向人工编辑与外部智能体操作的通用场景与空间内容编辑框架。

## 1. 产品是什么

万类不是游戏引擎，也不是要重新做 Unity / Unreal。

它解决的是：

> 如何用一套轻量、开放、结构化的工具，让人或外部 Agent 设计场景、空间、白盒、对象布局、镜头与基础调度，再调用项目自己的真实能力进行验证，最终把结果交给对应游戏或引擎。

## 2. 三种主要使用方式

### 2.1 完整轻量场景编辑器

面向 Web 游戏、自研 Runtime、小型项目。Worldform 可以承担主要场景制作，但项目运行规则仍由 Project Adapter 调用。

《战术巫师：裂隙突围》和《物有所归 / Place & Seek》是首批真实验收项目，不是 Worldform Core 的内置业务模块。

### 2.2 成熟引擎的白盒与空间设计工作台

面向 Unreal、Unity、Godot 等成熟引擎。Worldform 负责概念、白盒、空间布局、Gameplay Metadata、镜头预演与验证；高级美术、灯光、Blueprint、Niagara、完整 Sequencer 等留在正式引擎。

### 2.3 轻量导演台

Director 负责“场景中的对象什么时候做什么，以及镜头什么时候看哪里”，但不扩展为完整动画/VFX/电影制作工具。首批语义保持 Camera / Actor / Object / Event / Marker。

## 3. 项目能力调用

Worldform 自身不拥有具体项目规则：

```text
Worldform Workspace
      ↓
Adapter Host
      ↓
Project Adapter
      ↓
项目真实代码
      ↓
generate / validate / simulate / query / compile
```

项目能力可以来自共享 TypeScript 包、本地进程、HTTP/IPC 服务或引擎 Bridge，但算法所有权始终留在项目侧。

## 4. 平台优先策略

Worldform 从第一阶段就按正式第三方接入流程开发。

先完成：

```text
Core
→ Workspace / Session
→ Adapter SDK / Host
→ Example Adapter
→ Editor
→ CLI
→ MCP / Ghost Preview
→ Developer Kit
→ Clean-room 验收
```

然后再让真实项目按外部消费者身份接入。

Phase 1 的成功标准不是“支持了某款游戏”，而是：

> 一个独立仓库可以不修改 Worldform 源码，只依赖公开契约、SDK、Skill、CLI 与 MCP 完成接入。

这一原则用于防止首个项目需求反向污染 Core 与平台 API。

## 5. AI / Agent 产品策略

Worldform 不提供 AI 模型，也不做内置聊天机器人。不维护聊天窗口、模型供应商、API Key、Token、模型路由、对话历史或 Agent Runtime。

Agent 通过：

```text
Markdown / Skill
      ↓
CLI
      ↓
MCP
```

其中仓库开发与第三方接入使用不同 Skill；运行中场景修改必须通过 Workspace 的结构化 Patch/DraftChange 管线。

## 6. 预览策略

始终区分：

- **Authoring Preview**：快速作者视图，当前技术起点为 Pascal + Three.js/WebGPU；
- **Project Preview**：项目自己的正式环境，如 Babylon/Jolt、Unreal Preview 或自研 Runtime。

Worldform 不为了画面完全一致而复制项目 Runtime。

## 7. Bridge 边界

主要桥接 Transform、白盒、Camera、Zone、Anchor、Marker、基础 Actor 与 Gameplay Metadata。

不追求 Nanite、Niagara、Landscape、复杂 Blueprint、完整 Sequencer、World Partition、高级材质等全场景无损同步。

## 8. 泛用化规则

> 至少两个真实项目都需要的能力，才优先考虑进入 Worldform Core。

典型 Core：Transform、Scene Tree、Patch、History、Schema/Migration、Validation、通用资源与引用。

典型 Adapter：WFC、敌人刷新、归位规则、体素破坏、任务系统、项目导航算法。

## 9. 第一阶段明确不做

- 完整动画/材质/VFX 编辑器；
- 通用物理、导航、任务、地形系统；
- 完整 Sequencer；
- 游戏 Runtime；
- LLM Provider / Chat；
- Unreal/Unity 全场景无损同步；
- 为《战术巫师》或《物有所归》提前硬编码节点和规则。

## 10. 百舸体系定位

```text
百舸 BAIGE
│
├─ 能动 Volition
│  → 智能体如何思考、决策和行动
├─ 流形 Flowform
│  → 角色如何产生运动
└─ 万类 Worldform
   → 世界如何被描述、构造、调度与观察
```

三者未来可以互相连接，但应保持独立成立、独立接入。

## 11. 当前正式定义

> **万类，是百舸体系下的通用场景与空间内容编辑框架。**
>
> 它提供通用场景编辑、空间白盒、结构化场景数据、项目能力调用、验证与预览、轻量导演台以及跨运行时桥接，并通过开放的 Skill、文档、CLI 与 MCP，使外部智能体能够理解、扩展和操作工作环境。
>
> 万类自身不绑定任何大语言模型，不维护聊天系统，也不持有具体游戏的业务规则。
