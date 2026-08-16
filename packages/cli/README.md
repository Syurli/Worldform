# @worldform/cli

当前 Platform Alpha 包版本为 `0.1.0-alpha.1`；安装后提供 `worldform` bin。

Worldform 面向开发者、Agent 与 CI 的无交互命令行。CLI 读取正式 `SceneDocument`，并复用 Workspace、Adapter Host 与 Adapter SDK，不维护独立验证或修改逻辑。

## 命令

```bash
worldform validate scene.worldform.json --adapter ./adapter.mjs
worldform inspect scene.worldform.json
worldform export scene.worldform.json --adapter ./adapter.mjs --target project-json
worldform adapter:check ./adapter.mjs
```

所有命令支持 `--json`。`adapter check` 是 `adapter:check` 的等价写法。Adapter 模块应提供唯一的 `default`、`adapter` 或 `worldformAdapter` 导出。

## 退出码

| 退出码 | 含义 |
| --- | --- |
| `0` | 成功 |
| `2` | 命令或参数错误 |
| `3` | 场景读取或反序列化错误 |
| `10` | Core/Adapter 验证失败 |
| `11` | Adapter 加载、契约或调用错误 |
| `12` | 其它执行错误 |

诊断 JSON 保留 `code`、`source`、`sourceId`、`path` 与 `severity`，可直接用于 CI 注释或 Agent 决策。

仓库开发时先运行 `pnpm --filter @worldform/cli build`，即可通过 `node packages/cli/dist/bin.js --help` 验证实际 Node 入口。正式 package 的 `worldform` bin 指向同一构建产物。
