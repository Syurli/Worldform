# @worldform/adapter-sdk（planned package）

本目录预留给第三方 Project Adapter 开发 SDK。

正式实现由 `docs/tasks/P1-004_ADAPTER_SDK_EXAMPLE.md` 完成。

`adapter-api` 保持最小稳定协议；`adapter-sdk` 提供 descriptor/schema helper、contract test、fixture、诊断和模板。Transport/lifecycle 的运行侧实现属于 Adapter Host，不应把进程模型写死进业务 Adapter API。
