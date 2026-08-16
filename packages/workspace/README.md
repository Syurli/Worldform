# @worldform/workspace（planned package）

本目录预留给 Worldform 的统一应用层 / Session。

正式实现由 `docs/tasks/P1-003_WORKSPACE_SESSION.md` 完成。在该任务前不创建临时状态管理器来替代它。

预期职责：document + revision、SceneHistory、DraftChange、validation pipeline、Adapter Session/Host、preview/apply/discard、undo/redo 与事件。

Editor、CLI、MCP 将共同依赖这一层；它不依赖 Pascal/React，也不拥有项目业务算法。
