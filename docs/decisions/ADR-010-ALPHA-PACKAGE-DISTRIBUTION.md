# ADR-010 — Platform Alpha 包分发基线

- 状态：Accepted
- 日期：2026-08-16

## 决策

Worldform 的公开开发者包统一使用 `0.1.0-alpha.1`，以 `dist/` ESM JavaScript 与 TypeScript declaration 作为唯一消费入口。monorepo 开发时 TypeScript 通过源码 path alias 检查；正式 package build 清空 alias，只从已经构建的上游 `dist/` 解析，以暴露缺失 export 和隐式源码依赖。

CLI 与 MCP 在 declaration build 后使用 esbuild 生成可执行 Node bin。`pnpm pack:packages` 产生可独立安装的 tarball；P1-008 和 P1-009 必须在仓库外安装这些产物验证。

Editor 和 Director 当前不进入公共 package 组。Worldform 正式开源许可尚未确定，因此 manifest 使用 `UNLICENSED`，技术验收不等同于公共发布授权。

## 理由

只在 workspace 中运行会掩盖包入口、声明文件、依赖版本和 bin 的错误。dist-only tarball 与仓库外安装能够让第三方开发体验成为持续可验证的产品契约，同时避免提前承诺 Editor 产品分发形态或许可。

## 后果

- 所有公共包必须可按依赖顺序独立 build；
- 对外 import 只能经过 package `exports`；
- Alpha 包必须整组升级；
- 公共 registry 发布需另行完成许可决策；
- 每个发布候选必须执行外部 tarball smoke test。
