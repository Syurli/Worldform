# Worldform 开发路线

## 总原则

优先顺序：**协议 > 可验证能力 > 统一应用层 > 编辑体验 > 项目接入 > 扩展范围**。

Worldform 不以“尽快把《战术巫师》或《物有所归》做进编辑器”为第一阶段目标，而是先证明第三方项目能够按正式方式接入。

---

# Phase 1 — Platform Alpha / Third-party Ready

目标：一个独立项目无需修改 Worldform 源码，即可通过正式文档、SDK、Skill、CLI 和 MCP 完成 Adapter 开发与场景操作。

## P1-001 Core History / Serialization — 已完成

已有：SceneDocument、Patch、逆 Patch、SceneHistory、稳定 JSON、Migration、资源/引用和结构验证。

## P1-002 Core Contract Hardening — 已完成

收口：

- Document format / Adapter API / Project schema / implementation version 区分；
- revision 基线；
- DraftChange 最小公共类型；
- Resource mutation 策略；
- component/property 细粒度 Patch 方案评估；
- ValidationIssue 来源与错误规范；
- 兼容/迁移测试。

不扩展游戏业务。

## P1-003 Workspace / Session — 已完成

建立统一应用层，集中：

- document + revision；
- history；
- draftChanges；
- validation pipeline；
- adapter session；
- preview/apply/discard；
- undo/redo；
- events。

Editor、CLI、MCP 后续只能调用这一层。

## P1-004 Adapter SDK + Example Adapter — 已完成

完成：

- adapter-api 兼容版本；
- Adapter lifecycle；
- Adapter Host 基线；
- timeout/cancellation/error；
- node/component/property descriptor；
- schema 注册边界；
- contract test 工具；
- 通用 `example-adapter`。

Example Adapter 只包含 Box / Prop / Marker / Zone / TestComponent 等无业务节点。

## P1-005 Pascal Authoring Alpha — 已完成

用通用 Example Adapter 验证：

- Web Editor Host；
- Scene Tree；
- Selection；
- Gizmo；
- 创建/删除节点；
- Inspector 动态属性；
- Patch → Workspace；
- Undo/Redo；
- Authoring Preview。

已锁定 Pascal `core/viewer@0.9.2` 与 npm `gitHead`，通过隔离层补足通用选择和 Gizmo；具体分工与升级策略见 ADR-008。

## P1-006 CLI

正式实现首批命令：

```text
worldform validate
worldform adapter check
worldform inspect
worldform export
```

CLI 必须调用 Workspace / Adapter Host，而不是复制一套逻辑。

## P1-007 MCP + Ghost Preview

首批工具域：

```text
scene.*
project.*
change.*
history.*
preview.*
```

完成：query、结构化 mutation、baseRevision、DraftChange、Validate、Ghost Preview、Apply/Discard、Undo/Redo。

MCP 不提供任意文件系统或任意代码执行能力。

## P1-008 Third-party Developer Kit

整理真正给外部项目使用的入口：

- `.agents/skills`；
- Adapter SDK 文档；
- 第三方接入指南；
- 示例 Adapter；
- 契约测试；
- CLI/MCP 配置示例；
- 兼容性说明；
- package/build/distribution 策略。

## P1-009 Clean-room Validation

建立一个完全独立的测试仓库：

1. 不允许修改 Worldform；
2. 只读取公开文档、Skill、SDK；
3. 由 Codex/开发者实现一个新 Adapter；
4. 通过 `adapter check`；
5. 在 Editor 中加载；
6. 通过 MCP 修改场景；
7. Validate → Preview → Apply → Undo；
8. 输出验收报告。

**P1-009 是进入真实游戏接入的阶段门槛。**

---

# Phase 2 — Real Project External Integration

Worldform 平台不再与游戏代码一起长，而是让真实项目作为独立消费者接入。

## P2-001 《战术巫师》外部 Adapter

Adapter 实现在 TWR 项目仓库侧。验证“大空间 + 程序生成”：WFC 样板、Connector、Anchor、Generator/Validator/Seed 等。TC-WFC、Topology、Portal、Navigation 始终由 TWR 真实代码提供。

## P2-002 《物有所归》外部 Adapter

Adapter 实现在 Place & Seek 项目仓库侧。验证“小空间 + 高密度互动”：对象、容器、Zone、Placement Target、Secret/Memory、Physics Profile。真实 Placement/Jolt/Completion 规则留在游戏代码。

这两个项目如果都需要同一项新能力，再评估是否晋升到 Worldform 公共层。

---

# Phase 3 — Director

实现轻量导演台：Camera / Actor / Object / Event / Marker、基础 Timeline、Cut/Blend/Follow、Timeline Validation 与 Web Preview。

Director 同样通过 Workspace mutation 管线，不建立独立状态体系。

---

# Phase 4 — Runtime / Engine Bridges

按真实需求逐步增加：

1. Web Runtime Bridge；
2. Unreal Bridge；
3. Godot / Unity（有真实项目时再做）。

只同步 Worldform 权责范围，不追求成熟引擎全场景无损同步。

---

# 暂不进入近期路线

- 内置 LLM / Chat；
- 完整材质/VFX/动画编辑器；
- 通用物理/导航/任务系统；
- 大型 Terrain；
- 完整 Sequencer；
- Unity/Unreal 替代品。

详细可执行任务见 `docs/tasks/README.md`。
