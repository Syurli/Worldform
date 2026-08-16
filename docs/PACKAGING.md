# Worldform 包构建与分发

## 公共包

Platform Alpha 的第三方开发者入口为：

- `@worldform/core`
- `@worldform/adapter-api`
- `@worldform/adapter-sdk`
- `@worldform/workspace`
- `@worldform/pascal-adapter`
- `@worldform/cli`
- `@worldform/mcp`
- `@worldform/example-adapter`

`apps/editor` 与 `packages/director` 仍是私有产品/占位包，不进入当前 SDK 分发组。

## 构建

```bash
pnpm build:packages
pnpm pack:packages
```

每个公共包使用独立 `tsconfig.build.json` 输出 ESM JavaScript、source map 与 declaration 到 `dist/`。发布 tarball 只包含 `dist/`、`README.md` 与 `package.json`，不会把 monorepo `src/` 或测试文件作为运行依赖泄漏给消费者。

`pack:packages` 将 tarball 放入忽略版本控制的 `artifacts/packages/`。包内 `workspace:*` 依赖在 pack 时固化为当前发布版本；外部验证必须安装整组 tarball，不能依赖 monorepo workspace 解析。

## 发布前验证

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm lint
pnpm build
pnpm pack:packages
```

随后在仓库外的全新目录安装 tarball，验证 ESM import、TypeScript declaration、contract test、CLI bin 与 MCP bin。仓库内测试通过不能替代该验证。

## 许可边界

当前 package manifest 明确标记 `UNLICENSED`。这不影响本地构建、tarball 安装与 Clean-room 技术验收，但在 Worldform 正式许可确定前，不应发布到公共 npm registry，也不应把 Alpha tarball 解释为获得再分发授权。Pascal 等上游归属见 `THIRD_PARTY_NOTICES.md`。
