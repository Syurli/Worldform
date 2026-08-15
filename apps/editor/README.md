# Editor Host

`apps/editor` 是 Worldform 独立 Web 作者工具的宿主。

## Phase 1 状态

当前只建立依赖边界，不提前安装 React / Next / Pascal。

原因：第一阶段先验证 `SceneDocument + Project Adapter + Pascal Adapter` 的边界，再通过真实 Pascal PoC 决定具体 UI 集成方式和上游版本。

## 后续职责

PoC 通过后，本应用负责组合：

- Pascal Core / Viewer / Editor；
- Worldform Scene Tree / Inspector；
- Project Adapter 面板；
- Validation 结果；
- Ghost Preview；
- Authoring Preview；
- Project Preview 入口；
- 后续 Director 工作区。

## 明确禁止

- 不把编辑器内部 store 当正式项目数据；
- 不把具体游戏算法实现写进 app；
- 不在 app 内维护模型供应商或聊天系统；
- 不直接让 Agent 修改 Three/Pascal 内部对象而绕过 Patch。
