# 上游项目与参考实现

Worldform 当前有两个重要技术参考，但项目不等同于任一上游 Fork。

## 1. Pascal Editor

仓库：`https://github.com/pascalorg/editor`

定位：通用 3D 建筑/空间编辑器。

Worldform 重点利用或验证：

- 场景树与节点注册；
- 3D Viewer；
- 2D Floorplan；
- Gizmo / Selection；
- 墙、区域、楼层等参数化空间编辑；
- Inspector；
- Undo / Redo；
- 插件与自定义节点能力；
- WebGPU / Three.js 作者视图。

### Worldform 边界

Pascal 只作为 Authoring Layer。

禁止把以下内容作为 Worldform 正式协议：

- Pascal 内部 Zustand store；
- Three Object3D；
- IndexedDB 工作副本；
- Pascal 私有节点结构的无约束透传。

所有长期数据应经过 `@worldform/pascal-adapter` 映射到 `SceneDocument / ScenePatch`。

### 版本策略

Pascal 仍处于快速发展阶段。正式接入前：

1. 完成 PoC；
2. 确认必须使用的公开 API；
3. 锁定明确版本或 commit；
4. 所有上游调用集中在 `packages/pascal-adapter` 与 `apps/editor`；
5. 升级必须经过契约测试。

## 2. Aedifex

仓库：`https://github.com/TangSY/aedifex`

Aedifex 基于 Pascal Editor 扩展了 AI 场景设计能力。

Worldform 最值得参考的是它的操作闭环：

```text
场景上下文
   ↓
结构化工具调用
   ↓
本地 Validator
   ↓
Ghost Preview
   ↓
用户确认
   ↓
Apply
```

以及将场景操作统一抽象为可供 AI / MCP 调用的 Scene Operations。

### 不直接继承的部分

Worldform 不计划直接继承：

- 内置聊天 UI；
- OpenAI-compatible provider 配置；
- API Key 管理；
- 对话历史；
- Token 预算与模型循环；
- 建筑/家具领域专用提示词；
- 建筑领域专用 AI Tool 定义。

这些能力应留在外部 Agent。

Worldform 吸收的是“结构化修改 + 校验 + 预览确认”的产品与技术模式。

## 3. 许可

Pascal Editor 与 Aedifex 当前均采用 MIT License。

Worldform 在尚未确定自身最终开源许可前：

- 不复制上游代码进入仓库；
- 如果后续复制或修改上游源码，必须保留对应 MIT License 与版权声明；
- 依赖包与直接源码复用要在文档和 NOTICE 中区分；
- 不得因 Worldform 自己的项目命名而抹除上游归属。

## 4. 何时选择“依赖”而非“复制”

优先顺序：

```text
公开 package / plugin API
        ↓
薄 Adapter
        ↓
必要的上游补丁
        ↓
最后才考虑维护长期 Fork
```

除非 Pascal 的关键编辑能力无法通过公开 API 扩展，否则不建议直接维护大体量 Fork。

## 5. Worldform 真正需要长期沉淀的资产

不是 Pascal 或 Aedifex 的 UI，而是：

```text
SceneDocument
Operations / Patch
Project Adapter
Validation
Bridge
Director
CLI / MCP / Skill
```

这些协议应能在未来替换作者视图技术时继续存在。
