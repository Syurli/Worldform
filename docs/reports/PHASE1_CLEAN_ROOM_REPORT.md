# Phase 1 Clean-room Validation 报告

- 日期：2026-08-17
- 结论：通过
- 外部仓库：`%TEMP%/worldform-p1-009-museum-212d82b6d0774d7e9900147d300b3306`
- 外部仓库提交：`41defd288451e64c5d65d142880d6ef372e0e186`
- Worldform package 组：`0.1.0-alpha.1`

## 1. 测试方式

在 Worldform monorepo 外新建独立 Git 仓库，从零实现 Museum Adapter。该仓库：

- 只安装 `artifacts/packages/*.tgz` 与公开第三方依赖；
- 不引用 `../../packages/*` 或任何 Worldform `src/`；
- 只依据公开文档、Adapter Development Skill 和 package declaration；
- 不修改、复制或进入 Worldform 内部实现；
- 不使用《战术巫师》或《物有所归》语义。

测试业务包含：

- `museum.gallery` / `museum.exhibit` 两个自定义节点；
- `museum.gallery-config` / `museum.exhibit-info` 两个动态组件；
- string、number、boolean、enum 属性；
- 展厅容量 validator；
- 项目真实 `summarizeMuseum()` 目录统计；
- 查询型 `museum.summarize` 与修改型 `museum.createExhibit` capability；
- `museum-catalog` exporter。

## 2. 自动验收结果

| 验收项 | 结果 |
| --- | --- |
| tarball `pnpm install` | 通过 |
| TypeScript + 独立 browser ESM build | 通过 |
| SDK contract test | 通过 |
| 项目 validator 失败用例 | 通过 |
| 项目真实 capability | 通过 |
| `worldform adapter:check` | 通过，0 issues |
| `worldform validate` | 通过，0 issues |
| `worldform inspect` | 通过，2 nodes / 2 types |
| `worldform export` | 通过，生成 Museum Catalog |
| MCP 官方 Client/InMemoryTransport | 通过 |
| MCP Query → Capability Draft → Ghost Preview → Apply → Undo | 通过 |
| Clean-room 测试总数 | 2 files / 4 tests 全通过 |
| Monorepo `pnpm check` / `test` / `lint` / `build` | 通过，65 项测试全通过 |

MCP 闭环验证了正式文档在 Apply 前不变、Preview revision 仍为 0、Apply 后 revision 为 1、Undo 后 revision 为 2 且新节点消失。

## 3. Editor 验收

Clean-room Adapter 额外打成浏览器 ESM，通过带 CORS 的本地项目服务提供。Worldform Editor 使用运行时 URL 加载：

```text
http://127.0.0.1:4173/
  ?adapter=http://127.0.0.1:4310/dist/browser-adapter.js
  &scene=http://127.0.0.1:4310/museum.worldform.json
```

浏览器可见验收结果：

- 标题显示 `Museum Clean-room Adapter`；
- 创建菜单动态显示“展厅”“展品”；
- Scene Tree 显示 `museum.gallery` 与 `museum.exhibit`；
- Inspector 动态显示“展品标题”“年代”“重点展品”；
- 编辑标题后统一经过 Workspace，revision 由 0 增至 1；
- Draft 面板显示 applied change；
- Core + Adapter 校验显示“校验通过”；
- Pascal Authoring Preview 正常投影外部节点；
- 运行日志无 error，只有 Three Clock 上游弃用 warning。

最终面板视觉同步采用锁定 Pascal 上游的中性灰阶、紧凑工具条、左侧场景栏与悬浮属性卡基线；Worldform 固定面板/属性文案已中文化。该约束已写入 ADR-008。

## 4. 暴露的问题与修改

### 已修复：Editor 写死 Example Adapter

初次审查发现 `WorldformEditorSession` 内部直接构造 Example Adapter/fixture，第三方项目无法加载。修复为：

- Session 构造器接收正式 `WorldformProjectAdapter + SceneDocument`；
- 默认 Example 只保留为仓库开发入口；
- Editor 增加成对的 `adapter/scene` URL 启动参数；
- Adapter 模块按 CLI/MCP 相同约定发现导出；
- 缺失一半配置、无合法导出或场景读取失败时明确报错；
- 增加运行时外部项目加载测试。

最终 Clean-room 重跑未再修改 Editor。

### 已明确：本地 tarball 的 pnpm 解析

包尚未进入 registry 时，pnpm 需要在外部仓库 `pnpm-workspace.yaml` 把包间的 `0.1.0-alpha.1` 依赖覆盖为本地 tarball。正式 registry 发布后不需要该覆盖。这是本地分发装配步骤，P1-008 已记录。

## 5. 最终第三方接入步骤

1. 安装同一版本组的 Core、Adapter API/SDK、CLI、MCP；
2. 声明 manifest 与项目命名空间 descriptor；
3. Adapter 调用项目真实 validator/capability/exporter；
4. 用 SDK contract test 和 fixture 验证；
5. build 后执行 CLI adapter check / validate / inspect / export；
6. 为 Editor 提供受信任的 browser ESM Adapter 与 SceneDocument URL；
7. 配置 `worldform-mcp --scene ... --adapter ...`；
8. MCP mutation 执行 Query → Draft → Preview → Apply/Discard → Undo。

## 6. 剩余限制

- Worldform 正式许可未确定，当前 `UNLICENSED` tarball 只用于本地技术验收，不能视为公共发布授权；
- Editor URL Adapter 是受信任代码加载入口，需要消费者预打包 browser ESM 并提供 CORS；尚无图形化项目选择器；
- 独立 stdio MCP 与浏览器 Editor 当前是不同进程，不自动共享内存 Workspace；同进程宿主已能共享 Draft/Ghost，跨进程 Bridge 留到有真实需求时实现；
- Editor production bundle 仍有体积 warning；
- Pascal/Three 仍有 `THREE.Clock` 弃用 warning，不影响功能。

## 7. 阶段结论

P1-009 的全部门槛已通过：陌生业务 Adapter 能在不修改 Worldform 源码的最终流程中完成安装、声明、验证、Editor 动态显示、CLI、MCP Draft/Ghost/Apply/Undo 与项目能力调用。

**Phase 1 / Platform Alpha 完成，技术上允许开始 Phase 2 的两个真实项目外部 Adapter；许可和跨进程同步限制继续按本文边界执行。**
