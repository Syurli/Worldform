# P1-008 第三方开发者包验收报告

- 日期：2026-08-17
- 发布组：`0.1.0-alpha.1`
- 外部目录：`%TEMP%/worldform-p1-008-smoke-1f744958984147baae083488df5e2fd0`

## 隔离条件

- 外部目录由 `templates/adapter-minimal` 复制；
- 不使用 pnpm workspace link；
- 不引用 Worldform `src/`；
- Worldform 依赖全部来自 `artifacts/packages/*.tgz`；
- tarball 只包含 `dist/`、declaration、README 与 package manifest。

pnpm 本地 tarball 尚未发布到 registry，因此验收目录在 `pnpm-workspace.yaml` 中把包间的 `0.1.0-alpha.1` 依赖覆盖到对应 tarball。正式 registry 发布时不需要这层本地覆盖。

## 结果

| 检查 | 结果 |
| --- | --- |
| `pnpm install` | 通过 |
| `pnpm build` | 通过 |
| `pnpm test` | 1/1 通过 |
| `worldform adapter:check ./dist/index.js --json` | 通过，0 issues |
| `worldform validate ... --adapter ... --json` | 通过，0 issues |
| `worldform-mcp --help` | 通过，退出码 0 |
| Core/API/SDK/CLI/MCP ESM import | 5/5 通过 |

## 结论

外部开发者可以只消费正式构建产物完成最小 Adapter；包入口、TypeScript declaration、CLI bin、MCP bin 与契约工具没有隐式 monorepo 源码依赖。公共 npm 发布仍受 Worldform 正式许可决策约束。
