# Agent Entry — Worldform / 万类

如果你是 Codex、Claude Code 或其它代码智能体，请先判断你正在做哪类工作。

## A. 开发 Worldform 本身

按顺序阅读：

1. `../AGENTS.md`
2. `../docs/PRODUCT_DEFINITION.md`
3. `../docs/ARCHITECTURE.md`
4. `../docs/ROADMAP.md`
5. 当前 `../docs/tasks/` 任务
6. 相关 `../docs/decisions/`
7. `../.agents/skills/worldform-development/SKILL.md`

## B. 在独立项目中接入 Worldform

阅读：

1. `../docs/PROJECT_ADAPTER.md`
2. `../docs/THIRD_PARTY_INTEGRATION.md`
3. `../docs/COMPATIBILITY.md`
4. `../.agents/skills/worldform-adapter-development/SKILL.md`
5. `../templates/adapter-minimal/README.md`

正式接入原则上只修改消费者项目，不修改 Worldform。

## 最重要的规则

1. SceneDocument 是权威数据。
2. 项目业务规则不复制到 Worldform。
3. 可持久化修改统一为 Patch。
4. Editor / CLI / MCP 共用 Workspace / Session。
5. Adapter API、SDK、Host 与 Transport 分层。
6. Worldform 不内置 LLM。
7. P1-009 前不进入 TWR / Place 正式 Adapter 开发。

## 当前阶段

当前为 Phase 1 / Platform Alpha。Core、Workspace、Adapter SDK、Pascal Authoring Alpha、CLI、MCP 与第三方开发者包已完成；阶段门槛是 P1-009 Clean-room Validation。

## 常用检查

```bash
pnpm install
pnpm check
pnpm test
pnpm lint
```

如果任务要求接入某个具体游戏，但 P1-009 尚未通过，应先确认它是否只是测试 fixture；不要直接把游戏业务写进 Worldform。
