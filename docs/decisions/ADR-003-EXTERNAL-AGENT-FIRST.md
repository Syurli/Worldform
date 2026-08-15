# ADR-003：外部 Agent 优先，不内置 LLM

- 状态：Accepted
- 日期：2026-08-15

## 决策

Worldform 不内置聊天机器人，也不维护模型供应商层。

Agent 接口采用三级结构：

1. Markdown / Skill；
2. CLI；
3. MCP。

运行中场景修改统一转换为 ScenePatch，并经过 Validation / Preview / Apply。

## 原因

内置模型会迫使 Worldform 长期承担：

- API Key；
- 模型路由；
- Token 与上下文；
- 聊天 UI；
- Provider 兼容；
- 模型成本与版本变化。

这些都不是场景编辑框架的核心竞争力。

外部 Agent（如 Codex、Claude Code 等）已经具备代码理解与工具调用能力。Worldform 更应该成为“可被 Agent 使用的结构化工作环境”。

## Aedifex 借鉴

保留 Aedifex 最有价值的模式：

```text
结构化操作 → 校验 → Ghost Preview → 确认 → Apply
```

不继承其模型调用、聊天历史和建筑领域专用 Agent Runtime。

## 后果

- Worldform 不需要绑定模型生态；
- 用户可自由选择外部 Agent；
- CLI/MCP/文档质量成为核心产品能力；
- 第一阶段可以完全不实现任何 AI API。
