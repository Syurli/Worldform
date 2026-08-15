# 万类 · Worldform 产品定义

> 百舸体系下，面向人工编辑与外部智能体操作的通用场景与空间内容编辑框架。

## 1. 项目是什么

万类不是游戏引擎，也不是要重新做 Unity / Unreal。

它解决的是：

> 如何用一套轻量、开放、结构化的工具，让人或外部 Agent 设计场景、空间、白盒、对象布局、镜头与基础调度，再调用项目自己的真实能力进行验证，最终把结果交给对应游戏或引擎。

可以浓缩为：

```text
空间怎么设计
+
对象怎么布置
+
项目规则怎么调用
+
镜头怎么看
+
事件怎么调度
+
外部 Agent 怎么参与
+
结果怎么进入正式项目
```

## 2. 三种主要使用方式

### 2.1 完整轻量场景编辑器

面向 Web 游戏、自研 Runtime、小型项目。

代表项目：

- 《战术巫师：裂隙突围》；
- 《物有所归 / Place & Seek》。

在这类项目中，Worldform 可以承担主要场景制作工作，但项目自己的运行时规则仍由 Project Adapter 调用。

### 2.2 成熟引擎的白盒与空间设计工作台

面向 Unreal、Unity、Godot 等成熟引擎。

Worldform 不替代引擎编辑器，而负责：

```text
概念
 ↓
白盒
 ↓
空间布局
 ↓
游戏语义
 ↓
镜头预演
 ↓
验证
 ↓
Bridge
 ↓
正式引擎
```

例如 Unreal 项目可以在 Worldform 中完成：

- 厂房/建筑白盒；
- 路线；
- 房间；
- 掩体；
- 出生点；
- Zone / Marker；
- Camera；
- 基础演出预演。

最终美术、灯光、Blueprint、Niagara、完整 Sequencer 等仍留在 Unreal。

### 2.3 轻量导演台

Worldform 的 Director 负责：

> 场景中的对象什么时候做什么，以及镜头什么时候看哪里。

不是完整 Sequencer。

首批只处理：

| 类型 | 内容 |
|---|---|
| Camera | 位置、朝向、焦距、Cut、Blend、Follow |
| Actor | MoveTo、LookAt、Rotate、Wait、Animation 引用 |
| Object | 移动、旋转、显示、触发 |
| Event | 对话、音效、特效、灯光、游戏事件引用 |
| Marker | 任务点、对白点、爆炸点、关键动作点 |

可用于：

- 白盒预演；
- 剧情调度；
- 战斗调度；
- 镜头设计；
- 宣传片预演；
- AI 视频镜头规划。

## 3. 项目能力调用

Worldform 自身不拥有具体项目规则。

```text
Worldform
 ↓
Project Adapter
 ↓
项目真实代码
 ↓
generate / validate / simulate / query / compile
```

例如：

```text
Worldform
 ↓
TWR Adapter
 ↓
战术巫师真实 TC-WFC / Validator
```

```text
Worldform
 ↓
Place Adapter
 ↓
物有所归真实 Placement / Physics / Completion
```

## 4. AI / Agent 产品策略

Worldform 不提供 AI 模型，也不做内置聊天机器人。

不维护：

- 聊天窗口；
- 模型供应商；
- API Key；
- Token；
- 对话历史；
- 模型路由；
- Agent Runtime。

Worldform 要做的是让外部 Agent 天然可用：

```text
Markdown / Skill
      ↓
CLI
      ↓
MCP
```

最终对话发生在用户选择的外部 Agent 中。

## 5. 预览策略

Worldform 始终区分两类预览。

### Authoring Preview

快速作者视图。当前技术起点为 Pascal + Three.js/WebGPU。

### Project Preview

调用项目自己的正式环境：

- 战术巫师 → Babylon / Jolt / Voxel；
- 物有所归 → Babylon / Jolt；
- Unreal 项目 → Unreal Preview。

Worldform 不为了画面完全一致而复制项目 Runtime。

## 6. Bridge 的边界

Worldform 不追求成熟引擎的全场景无损双向同步。

主要桥接：

- Transform；
- 白盒；
- Camera；
- Zone；
- Anchor；
- Marker；
- 基础 Actor；
- Gameplay Metadata。

不属于 Worldform 的典型内容：

- Nanite；
- Niagara；
- Landscape；
- 复杂 Blueprint；
- 完整 Sequencer；
- World Partition；
- 高级材质制作。

## 7. 泛用化规则

> 至少两个真实项目都需要的能力，才优先考虑进入 Worldform Core。

例如：

| 能力 | Core |
|---|---:|
| Transform | 是 |
| Scene Tree | 是 |
| Patch / Undo / Redo | 是 |
| Schema / Migration | 是 |
| Diff | 是 |
| Director 基础 Timeline | 是 |
| Project Adapter | 是 |
| WFC | 否 |
| 敌人刷新 | 否 |
| 归位规则 | 否 |
| 体素破坏 | 否 |
| 某游戏任务系统 | 否 |

## 8. 第一阶段明确不做

- 完整动画编辑器；
- 材质编辑器；
- VFX 编辑器；
- 通用物理引擎；
- 通用导航系统；
- 完整任务系统；
- 完整 Sequencer；
- 完整地形系统；
- 游戏 Runtime；
- LLM Provider；
- 聊天系统；
- Unreal/Unity 全场景无损同步。

## 9. 百舸体系定位

```text
百舸 BAIGE
│
├─ 能动 Volition
│  → 智能体如何思考、决策和行动
│
├─ 流形 Flowform
│  → 角色如何产生运动
│
└─ 万类 Worldform
   → 世界如何被描述、构造、调度与观察
```

三者未来可以互相连接，但应保持独立成立、独立接入。

## 10. 当前正式定义

> **万类，是百舸体系下的通用场景与空间内容编辑框架。**
>
> 它提供通用场景编辑、空间白盒、结构化场景数据、项目能力调用、验证与预览、轻量导演台以及跨运行时桥接，并通过开放的文档、CLI 与 MCP，使任意外部智能体能够理解、扩展和操作整个工作环境。
>
> 万类自身不绑定任何大语言模型，不维护聊天系统，也不持有具体游戏的业务规则。
