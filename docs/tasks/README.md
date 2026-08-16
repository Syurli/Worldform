# Phase 1 Tasks — Platform Alpha

Phase 1 已重新排序为“先第三方可接入，再真实项目接入”。

```text
P1-001 Core History / Serialization ✅
           ↓
P1-002 Core Contract Hardening ✅
           ↓
P1-003 Workspace / Session ✅
           ↓
P1-004 Adapter SDK + Example Adapter ✅
           ↓
P1-005 Pascal Authoring Alpha ✅
           ↓
P1-006 CLI ✅
           ↓
P1-007 MCP + Ghost Preview
           ↓
P1-008 Third-party Developer Kit
           ↓
P1-009 Clean-room Validation
           ↓
        Phase 2
     ┌─────┴─────┐
     ↓           ↓
   TWR         Place
 External     External
 Adapter      Adapter
```

## 当前任务文件

- `P1-001_CORE_HISTORY_SERIALIZATION.md` — 已完成
- `P1-002_CORE_CONTRACT_HARDENING.md` — 已完成
- `P1-003_WORKSPACE_SESSION.md` — 已完成
- `P1-004_ADAPTER_SDK_EXAMPLE.md` — 已完成
- `P1-005_PASCAL_AUTHORING_ALPHA.md` — 已完成
- `P1-006_CLI_VALIDATION.md` — 已完成
- `P1-007_MCP_GHOST_PREVIEW.md`
- `P1-008_THIRD_PARTY_DEVELOPER_KIT.md`
- `P1-009_CLEAN_ROOM_VALIDATION.md`

原 `P1-003_TWR_ADAPTER_SPIKE` 与 `P1-004_PLACE_ADAPTER_SPIKE` 已从 Phase 1 移除，对应规划见 `phase2/`。

## 执行规则

- 严格按依赖顺序推进；
- 一个任务只解决声明范围；
- 不因实现方便突破 `AGENTS.md`；
- Editor/CLI/MCP 不绕过 Workspace；
- Example Adapter 不包含真实游戏业务；
- 公共协议变更同步更新 ADR/架构文档；
- 完成后至少执行 `pnpm check && pnpm test && pnpm lint`；
- P1-009 未通过前，不进入正式游戏 Adapter 开发。
