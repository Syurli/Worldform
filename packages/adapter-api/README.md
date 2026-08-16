# @worldform/adapter-api

当前 Platform Alpha 包版本为 `0.1.0-alpha.1`，应与 Core、SDK、Workspace、CLI/MCP 整组使用。

Worldform 与第三方 Project Adapter 之间的小型稳定协议包。

## 公共契约

- manifest：`adapterApiVersion / sceneSchemaVersion / version`；
- lifecycle：`initialize / dispose`；
- discovery：Node、Component、Property、Validator、Capability、Export target；
- invocation：`ProjectInvocationContext { signal, timeoutMs }`；
- mutation：Capability 只返回建议 `ScenePatch[]`，由 Workspace 建立 Draft；
- errors：`ProjectAdapterError` 与稳定 error code。

Adapter API 不包含加载、Transport、重试或 Workspace 状态。`@worldform/adapter-sdk` 提供开发辅助，`AdapterHost` 负责运行边界。
