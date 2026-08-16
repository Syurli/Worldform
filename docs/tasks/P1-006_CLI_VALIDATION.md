# P1-006 — CLI Validation

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
