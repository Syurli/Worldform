# P1-008 — Third-party Developer Kit（已完成）

## 目标

把“我们自己能写 Adapter”提升为“陌生项目开发者或 Codex 能按文档写 Adapter”。

## 交付

- Adapter SDK 稳定入口；
- `PROJECT_ADAPTER.md` 与 `THIRD_PARTY_INTEGRATION.md` 完整；
- `.agents/skills/worldform-adapter-development`；
- Example Adapter；
- CLI 使用说明；
- MCP 配置/连接说明；
- 版本兼容矩阵；
- contract test 文档；
- package/build/distribution 方案；
- 最小项目模板或脚手架（如必要）。

## 验收

不阅读 Worldform 内部实现代码，也能回答：如何声明节点、如何调用项目真实能力、如何验证 Adapter、如何连接运行中的 Worldform，以及哪些规则禁止复制进平台。

## 完成记录

- 公开包已形成 `0.1.0-alpha.1` dist/types/exports/tarball 分发组；
- 提供 `templates/adapter-minimal`、完整接入文档、兼容矩阵、Skill、CLI/MCP 配置与故障排查；
- 独立目录的 tarball 安装、构建、contract test、CLI/MCP bin 与 ESM import 已通过；
- 验收证据见 `docs/reports/P1-008_PACKAGE_SMOKE.md`。
