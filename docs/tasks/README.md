# Phase 1 Tasks

第一阶段任务按依赖关系推进：

```text
P1-001 Core History / Serialization
           ↓
P1-002 Pascal Authoring PoC
           ↓
   ┌───────┴────────┐
   ↓                ↓
P1-003 TWR       P1-004 Place
Adapter Spike    Adapter Spike
```

任务文件：

- `P1-001_CORE_HISTORY_SERIALIZATION.md`
- `P1-002_PASCAL_AUTHORING_POC.md`
- `P1-003_TWR_ADAPTER_SPIKE.md`
- `P1-004_PLACE_ADAPTER_SPIKE.md`

## 执行规则

- 一个任务只解决它声明的范围；
- 不因实现方便突破 `AGENTS.md` 的依赖边界；
- 每个 Spike 优先验证架构假设，不追求完整 UI；
- 发现架构决策需要改变时先更新 ADR；
- 完成后至少运行 `pnpm check && pnpm test`。
