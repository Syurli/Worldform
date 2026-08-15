# Agent Entry — Worldform / 万类

如果你是 Codex、Claude Code 或其它代码智能体，请按顺序阅读：

1. `../AGENTS.md`
2. `../docs/ARCHITECTURE.md`
3. `../docs/PROJECT_ADAPTER.md`
4. `../docs/ROADMAP.md`
5. 与当前任务相关的 `../docs/decisions/`

## 最重要的五条规则

1. 不在 Worldform Core 中复制游戏规则。
2. 不把 Pascal/Three/Babylon/Unreal 内部对象当正式数据。
3. 项目能力通过 Project Adapter 调用。
4. 可持久化场景修改应落为 `ScenePatch[]`。
5. Worldform 不内置 LLM；Agent 通过仓库、CLI、MCP 与之协作。

## 当前阶段

当前为 Phase 1 / Foundation。

优先任务：

```text
SceneDocument
Patch / Validation
Project Adapter
Pascal PoC
TWR Adapter Spike
Place & Seek Adapter Spike
Agent docs
```

暂不要扩展完整 Director、MCP、材质/VFX/动画系统。

## 常用检查

```bash
pnpm install
pnpm check
pnpm test
```

## 新建 Project Adapter

开始前阅读 `../docs/PROJECT_ADAPTER.md`。

先列出：

- 哪些数据只是 Worldform 通用场景语义；
- 哪些是项目独有组件；
- 哪些规则必须调用项目真实代码；
- 需要暴露哪些 capability；
- 正式导出格式是什么；
- Project Preview 在哪里运行。

如果无法明确这些边界，不要先写大规模实现。
