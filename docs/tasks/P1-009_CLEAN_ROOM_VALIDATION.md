# P1-009 — Clean-room Validation（已完成）

## 目标

用一个完全独立的测试仓库证明 Worldform 已达到 Third-party Ready。

## 规则

- 测试仓库不放在 Worldform monorepo；
- 不允许为了测试修改 Worldform Core/Editor；
- Codex/开发者只使用公开 Skill、文档、SDK、CLI、MCP；
- 测试语义不得复用 TWR/Place 设计。

## 验收流程

1. 新建独立测试项目；
2. 实现至少 2 个自定义 node/component；
3. 实现 validator + capability + export；
4. contract test；
5. `worldform adapter check`；
6. Editor 动态显示属性；
7. MCP 查询并创建 DraftChange；
8. Preview / Apply / Undo；
9. 验证 Project capability；
10. 输出平台缺口报告。

## 阶段门槛

只有本任务通过，才能开始 Phase 2 的《战术巫师》和《物有所归》正式外部 Adapter。

## 完成记录

Museum Clean-room 独立 Git 仓库已通过 2 个节点/组件、validator、capability、export、contract test、CLI、Editor 动态 Inspector，以及官方 MCP Query → Draft → Ghost Preview → Apply → Undo 全闭环。完整证据与剩余限制见 `docs/reports/PHASE1_CLEAN_ROOM_REPORT.md`。
