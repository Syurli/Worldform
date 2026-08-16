# Worldform Platform Alpha 兼容矩阵

## 当前发布组

| 项目 | 支持值 | 规则 |
| --- | --- | --- |
| Worldform npm 包 | `0.1.0-alpha.1` | 所有 `@worldform/*` 公共包整组使用同一版本 |
| Node.js | `>=20.9` | 与仓库 `engines` 一致 |
| pnpm | `11.x` | 仓库开发与打包基线 |
| SceneDocument format | `1.0.0` | 只通过 Core 显式 migration 升级 |
| Adapter API | `1.0.0` | Phase 1 按主版本判断公共协议兼容 |
| Project schema | Adapter 自定义 | 文档值必须与 Adapter manifest 精确相等 |
| Pascal core/viewer | `0.9.2` | 仅 Pascal Authoring 隔离层锁定 |
| MCP SDK | `@modelcontextprotocol/server@2.0.0` | 官方 v2 stdio server |

## Alpha 策略

`0.1.0-alpha.1` 是开发者预览，不承诺旧 Alpha 的源码或包布局兼容。升级时整组更新 Worldform 包并重新运行 contract test、CLI 验证和项目导出验证。

对外磁盘格式与 Adapter 协议不会静默破坏：

- SceneDocument 格式变化必须有显式 migration；
- Adapter API 不兼容变化必须提升协议主版本；
- 项目 schema 变化由项目 Adapter 提供迁移策略；
- Adapter 实现版本只标识实现，不替代其它三个版本。

本矩阵描述“协议是否允许连接”，不保证项目语义正确；项目 validator 与真实 runtime 仍是最终业务权威。
