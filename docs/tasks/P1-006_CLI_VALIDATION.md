# P1-006 — CLI Validation

## 状态

已完成。

## 目标

让 Agent、CI 和第三方 Adapter 开发者可以在没有 Editor 的情况下验证工作。

## 首批命令

```text
worldform validate <scene>
worldform adapter check <adapter>
worldform inspect <scene>
worldform export <scene> --target <target>
```

## 约束

- CLI 调用 Workspace / Adapter Host；
- 不重新实现 Validation / lifecycle；
- 机器可读输出优先，需定义稳定 exit code；
- 错误保留 code/source/path；
- 可在 CI 中无交互执行。

## 验收

Example Adapter 可通过 `adapter check`；非法 Adapter/Scene 返回非零退出码和结构化诊断；`pnpm check && pnpm test && pnpm lint` 通过。

## 实现记录

- `validate` 通过 Workspace 统一执行 Core + Adapter 验证；
- `adapter:check` / `adapter check` 通过 Adapter SDK 与 Host lifecycle 检查动态模块；
- `inspect` 输出版本、revision、节点、资源和类型汇总；
- `export` 先验证，再调用 Adapter Host exporter，可输出 JSON 或写入指定文件；
- 支持 npm package、本地 ESM 文件和三种稳定 Adapter 导出命名；
- 人类输出与 `--json` 输出共用同一结构化结果；
- 定义 `0/2/3/10/11/12` 稳定退出码；
- 实际 Node ESM bin 由 esbuild 生成，入口 smoke test 通过。

## 验证

CLI 5 项测试覆盖 Example Adapter 契约、有效场景、非法场景诊断、inspect/export、参数与加载错误；Workspace 直接验证入口回归测试通过。
