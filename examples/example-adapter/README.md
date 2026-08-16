# Example Adapter

当前发布为 `@worldform/example-adapter@0.1.0-alpha.1`，用于平台测试与 descriptor 参考，不包含真实项目业务。

Phase 1 唯一正式业务语义测试 Adapter。它完全虚构，不代表《战术巫师》或《物有所归》。

## 注册内容

- Node：Box、Prop、Light、Zone、Marker；
- Component：dimensions、presentation、target、asset；
- Property：number、string、boolean、enum、node reference、resource reference；
- Capability：`validateScene`、`countObjects`、`createMarker`；
- Export target：`example-json`。

Editor 不应硬编码这些类型，而应从 Adapter descriptor 动态生成 Scene Tree、创建菜单、Authoring Preview 和 Inspector。

## 验证

```bash
pnpm --filter @worldform/example-adapter check
pnpm --filter @worldform/example-adapter test
```

测试证明 SDK contract、AdapterHost lifecycle、query/Patch capability、export 与 Workspace Draft 应用能够形成闭环。
