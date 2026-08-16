# P1-007 — MCP + Ghost Preview

## 目标

让外部 Agent 操作正在运行中的 Worldform Session，同时保持 revision、验证、预览和可撤销性。

## 首批工具域

```text
scene.get / scene.query
scene.create / scene.update / scene.delete
project.listCapabilities / project.callCapability / project.validate
change.preview / change.apply / change.discard
history.undo / history.redo
preview.play / preview.stop（可先最小实现）
```

## 强制规则

- MCP 只调用 Workspace；
- query 与 mutation 明确区分；
- mutation 带 baseRevision；
- mutation 先成为 DraftChange；
- Apply 前 Core + Adapter Validate；
- destructive operation 可审计；
- 不暴露任意文件系统或任意代码执行。

## Ghost Preview

编辑器至少能显示新增/修改/删除的结构化差异；第一版视觉表现可以简单，但语义必须来自同一 DraftChange。

## 验收

外部 Agent 能完成：读取场景 → 提议修改 → Preview → Apply → Undo；过期 revision 修改被拒绝或明确处理。
