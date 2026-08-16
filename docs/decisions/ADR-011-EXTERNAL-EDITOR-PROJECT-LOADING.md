# ADR-011 — Editor 外部项目加载边界

- 状态：Accepted
- 日期：2026-08-17

## 决策

`WorldformEditorSession` 必须由 `WorldformProjectAdapter + SceneDocument` 构造，不拥有 Example 或具体项目语义。Example Adapter 只作为无启动参数时的仓库开发默认值。

Platform Alpha Editor 支持成对 URL 参数：

```text
?adapter=<browser-esm-url>&scene=<scene-document-url>
```

Adapter URL 是受信任项目代码执行入口，只适用于开发者明确选择的本地/项目服务。模块必须是浏览器可解析的 ESM；跨源服务必须提供 CORS。SceneDocument 仍经 Core 反序列化并由 Workspace/Adapter 验证。

## 理由

P1-009 证明硬编码 Example Adapter 会让 SDK、CLI 和 MCP 虽可外部消费，Editor 却仍不是平台。构造器注入保留单元可组合性，URL 入口为当前私有 Editor 产品提供最小、可实际验证的外部加载方式，不提前设计完整项目管理 UI。

## 后果

- Editor 的菜单、Scene Tree、Preview 与 Inspector 只读 Adapter descriptor；
- URL Adapter 与 CLI/MCP 的 Node 模块加载不同，消费者需要额外 browser bundle；
- 不从不受信任来源加载 Adapter；
- 跨进程 Editor/MCP 同步不由此入口解决；
- 后续图形化项目选择器应产生同一构造配置，不建立新状态模型。
