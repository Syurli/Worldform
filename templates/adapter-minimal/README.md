# Worldform Minimal Adapter Template

这是完全独立的 Hello World Adapter 模板，不依赖 Worldform 仓库源码路径。

```bash
pnpm install
pnpm build
pnpm test
pnpm adapter:check
pnpm scene:validate
```

`worldform.mcp.json` 展示通用 MCP host 配置形状；具体配置文件位置由 Codex、VS Code 或其它 host 决定。

替换 `hello.*` descriptor、validator、capability 和 exporter 时，把项目真实生成/物理/导航/任务算法留在项目仓库，只在 Adapter 中调用它们。
