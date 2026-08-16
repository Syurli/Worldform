# P1-002 — Core Contract Hardening

## 目标

在更多上层系统依赖 Core 前，收口场景协议、版本、revision 与 mutation 边界。

## 实现范围

1. 明确并命名 Document format / Adapter API / Project scene schema / Adapter implementation 四类版本；
2. 为运行态文档定义 revision 基线；
3. 定义 DraftChange 最小公共类型或其 Core/Workspace 边界；
4. 评估并实现 Resource create/update/delete Patch；
5. 评估 component/property 细粒度 mutation，避免 Inspector 整块覆盖互不相关组件；
6. 收口 ValidationIssue source/code/path 规范；
7. 增加迁移、版本不兼容和冲突测试；
8. 更新 Core README 与 API 文档。

## 禁止

- 不实现 Workspace；
- 不实现 MCP/CLI；
- 不加入 TWR/Place 业务类型；
- 不为了未来假想功能扩展完整通用 ECS。

## 验收

- 版本含义不再混用；
- 资源变更可撤销并稳定序列化；
- revision/DraftChange 后续可被 Workspace 使用；
- 关键边界有测试；
- `pnpm check && pnpm test && pnpm lint` 通过。
