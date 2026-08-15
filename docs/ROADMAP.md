# Worldform 开发路线

## 总原则

优先顺序：**协议 > 可验证能力 > 编辑体验 > 扩展范围**。

不要先做漂亮的大型编辑器，再回头补数据与适配边界。

---

# Phase 1 — Foundation

目标：证明 Worldform 能作为独立框架成立，并且不会被 Pascal 或任一游戏项目绑死。

## 1.1 仓库与 Core 基线

当前首轮已建立：

- TypeScript workspace；
- `@worldform/core`；
- `SceneDocument`；
- `SceneNode` / Transform；
- `ScenePatch`；
- 基础 Patch 执行器；
- 基础结构 Validator；
- Core smoke test。

下一步：

- 增加 Patch 反向操作 / Undo 所需信息；
- 增加稳定序列化格式；
- 增加 schema migration 契约；
- 增加引用与资源引用的最小规范；
- 增加更完整的循环引用和删除策略测试。

### 验收

```bash
pnpm check
pnpm test
```

Core 不依赖 UI、渲染、物理或具体项目代码。

## 1.2 Project Adapter API

当前首轮已建立最小：

- manifest；
- capabilities；
- document validation；
- capability call；
- export target。

下一步：

- Adapter lifecycle；
- Capability timeout / cancellation；
- 错误规范；
- JSON Schema 注册；
- 自定义 node/component 描述；
- Inspector 描述协议；
- Project Preview 描述协议。

### 验收

两个完全不同的项目 Adapter 可以在不改 Core 的前提下注册不同语义。

## 1.3 Pascal PoC

目标不是“把 Pascal Fork 过来”，而是验证 Worldform 能控制 Pascal 作者视图。

PoC 只做一份真实测试场景：

1. 加载 Worldform SceneDocument；
2. 显示层级；
3. 选中对象；
4. Gizmo 移动/旋转；
5. 创建墙/区域或通用白盒；
6. 创建一个自定义 Connector；
7. 创建一个 Anchor；
8. 修改 Inspector；
9. 将改动转换为 ScenePatch；
10. 导回 Worldform 文档；
11. 完成一次 Undo / Redo 边界测试。

### 关键决策点

PoC 通过后再决定：

- 使用 Pascal 发布包还是固定 commit；
- 是否需要维护极薄的补丁层；
- 哪些 Pascal 插件 API 足够，哪些需要上游扩展；
- Pascal 自己的历史系统与 Worldform History 如何分工。

## 1.4 《战术巫师》Adapter Spike

目标：验证“大空间 + 程序生成”。

最小闭环：

```text
Worldform 编辑 WFC 样板
        ↓
导出/传递项目定义
        ↓
调用 TWR 真实 Validator / Generator
        ↓
返回结构化结果
        ↓
Worldform 显示结果
```

第一轮节点：

- Module
- Connector
- Walk Surface
- Obstacle
- Enemy Anchor
- Loot Anchor
- Extraction / Key Node

第一轮能力：

- validateModule
- generateLevel
- validateLevel
- exportDefinition

不在 Worldform 内复制 TC-WFC。

## 1.5 《物有所归》Adapter Spike

目标：验证“小空间 + 高密度互动”。

第一轮节点/组件：

- PlaceObject
- Zone
- Placement Target
- Container
- Secret / Memory Marker
- Physics Profile 引用

第一轮能力：

- validatePlacement
- evaluateScene
- exportPlace

不在 Worldform 内复制实际归位或物理规则。

## 1.6 Agent 文档入口

建立稳定入口，使外部 Agent 可以：

- 了解 SceneDocument；
- 了解 Project Adapter；
- 了解禁止复制项目规则的原则；
- 知道如何运行检查；
- 知道如何增加 capability。

第一阶段以 Markdown 为主，不要求 MCP。

---

# Phase 2 — Authoring Workbench

在 Phase 1 契约稳定后再开始：

- Pascal 正式接入；
- 3D/2D 编辑器宿主；
- Scene Tree；
- Inspector；
- Asset Browser；
- Selection / Gizmo / Snapping；
- Patch History；
- Adapter 面板；
- 基础 Project Preview Bridge。

此阶段优先用《战术巫师》样板间和《物有所归》首个 Place 双线验证。

---

# Phase 3 — Agent Operations

- CLI 正式实现；
- MCP 服务；
- Scene Query；
- Capability 调用；
- Patch Preview；
- Apply / Discard；
- Undo / Redo；
- 外部 Agent 使用说明与 Skills。

核心体验：

```text
外部 Agent 提出结构化修改
          ↓
Worldform Validate
          ↓
Ghost Preview
          ↓
用户确认
          ↓
Apply
```

Worldform 仍不提供聊天机器人。

---

# Phase 4 — Director

实现轻量导演台：

- Camera；
- Actor；
- Object；
- Event；
- Marker；
- Cut / Blend / Follow 等基础镜头语义；
- Timeline 验证；
- Web Runtime Preview。

不扩展为完整动画、特效或电影制作工具。

---

# Phase 5 — Engine Bridges

按真实项目需求逐步增加：

1. Web Runtime Bridge；
2. Unreal Bridge；
3. Godot / Unity（有真实需求时再做）。

Unreal 第一轮只处理 Worldform 权责范围：

- Transform；
- 白盒；
- Camera；
- Zone；
- Anchor；
- Marker；
- 基础 Gameplay Metadata。

不追求 Unreal 全场景无损同步。

---

# 暂不进入路线的内容

除非未来重新立项，否则不进入近期主线：

- 内置 LLM / Chat；
- 完整材质编辑器；
- 完整 VFX 编辑器；
- 完整动画编辑器；
- 通用物理引擎；
- 通用导航系统；
- 通用任务系统；
- 大型 Terrain 系统；
- 完整 Sequencer；
- Unity / Unreal 替代品。
