# @worldform/adapter-sdk

第三方 Project Adapter 的开发辅助层。稳定业务协议位于 `@worldform/adapter-api`；SDK 提供类型推断 helper、descriptor 基础验证、fixture 与 contract report。

## 入口

- `defineProjectAdapter()`：保留 Adapter 具体类型；
- `defineNodeType()` / `defineComponent()` / `defineProperty()`：声明动态 Editor descriptor；
- `validateDocumentDescriptors()`：检查未知节点、组件、属性类型、必填字段和数值范围；
- `checkAdapterContract()`：返回机器可读 contract report；
- `assertAdapterContract()`：用于单元测试或 CI。

SDK 不加载 Adapter，也不决定 in-process/stdio/HTTP。运行生命周期、timeout、cancellation 和 Transport 属于 Workspace 的 Adapter Host。
