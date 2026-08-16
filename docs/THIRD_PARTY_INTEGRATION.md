# Worldform 第三方接入指南

## 1. 接入目标

Worldform 的第三方接入标准是：消费者项目不修改 Worldform 源码，只安装公开包、实现 Project Adapter，并通过 CLI、MCP 与 Editor 使用同一份 `SceneDocument`。

```text
消费者项目真实代码
        ↑ capability / validator / exporter
Project Adapter
        ↑ @worldform/adapter-api + adapter-sdk
Workspace
        ↑
Editor / CLI / MCP
```

Adapter 是翻译与调用边界，不是项目算法的副本。

## 2. 安装与模板

Platform Alpha 的包版本为 `0.1.0-alpha.1`。当前仓库可先生成本地 tarball：

```bash
pnpm pack:packages
```

消费者项目安装相同版本的以下包：

```bash
pnpm add @worldform/core@0.1.0-alpha.1 \
  @worldform/adapter-api@0.1.0-alpha.1 \
  @worldform/adapter-sdk@0.1.0-alpha.1
pnpm add -D @worldform/cli@0.1.0-alpha.1 @worldform/mcp@0.1.0-alpha.1
```

在正式 npm 发布前，可将版本号替换成 `artifacts/packages/*.tgz` 的本地路径。完整可运行起点位于 `templates/adapter-minimal`，复制到 Worldform 仓库外即可使用。

## 3. 接入前分类

编码前把需求分成三类：

| 分类 | 例子 | 所有权 |
| --- | --- | --- |
| 通用场景语义 | 层级、Transform、通用资源引用 | `@worldform/core` |
| 项目专属语义 | 项目节点、组件、属性 | Adapter descriptor / schema |
| 项目真实算法 | generate、physics、navigation、mission、compile | 消费者项目真实代码，通过 capability 调用 |

禁止把项目算法复制进 Worldform Core，也禁止把 Pascal/Three 对象序列化为正式场景。

## 4. 实现 Adapter

### 4.1 Manifest 与 descriptor

```ts
import { WORLDFORM_ADAPTER_API_VERSION } from '@worldform/adapter-api'
import {
  defineComponent,
  defineNodeType,
  defineProjectAdapter,
} from '@worldform/adapter-sdk'

const components = [
  defineComponent({
    id: 'museum.label',
    displayName: '展品标签',
    properties: [
      { id: 'title', label: '标题', type: 'string', required: true },
      { id: 'featured', label: '重点展品', type: 'boolean', defaultValue: false },
    ],
  }),
]

const nodeTypes = [
  defineNodeType({
    type: 'museum.exhibit',
    displayName: '展品',
    components: ['museum.label'],
    preview: { kind: 'box', color: '#8b75ff' },
  }),
]

export default defineProjectAdapter({
  manifest: {
    id: 'museum.adapter',
    displayName: 'Museum Adapter',
    adapterApiVersion: WORLDFORM_ADAPTER_API_VERSION,
    sceneSchemaVersion: '1.0.0',
    version: '0.1.0',
  },
  // 其余方法见最小模板。
})
```

节点 `type`、组件 `id` 与 capability `id` 应使用项目命名空间。属性类型当前支持 number、string、boolean、enum、node-reference 与 resource-reference。

### 4.2 Validator

`validateDocumentDescriptors()` 可检查未知节点/组件、必填项、属性类型与数值范围。项目业务验证仍应调用项目真实 validator，再把结果归一为 `ValidationIssue`：

```text
Core structural validation
        ↓
Adapter descriptor validation
        ↓
Project business validation
        ↓
Runtime / Bridge validation（如需要）
```

每条问题都应有稳定的 `namespace.identifier` code、`source`、`severity`；`path` 只描述文档字段路径，不能泄漏本地文件路径。

### 4.3 Capability

Capability 是项目向 Worldform 明确开放的真实能力。它可以返回结构化 `output`、验证结果或建议 `patches`：

```ts
async function callCapability(request) {
  if (request.capabilityId === 'museum.generateLayout') {
    const result = await projectGenerator.generate(request.input)
    return { output: result.summary, patches: result.scenePatches }
  }
  throw new Error(`未知 capability：${request.capabilityId}`)
}
```

Adapter 不得直接修改正式文档。Capability 返回的 Patch 由 Workspace 建立 Draft，经 Validate → Preview → Apply 后才进入 History。

### 4.4 Exporter

Exporter 将 `SceneDocument` 转换成项目正式文本格式。Phase 1 的 `content` 是文本；二进制构建产物应由项目构建系统或 Bridge 生成。不得导出 Pascal/Three 的运行时对象。

## 5. 契约测试与 CLI

在消费者项目中加入契约测试：

```ts
import { checkAdapterContract } from '@worldform/adapter-sdk'
import adapter from '../src/index.js'

const report = await checkAdapterContract(adapter, sceneDocument)
if (!report.ok) throw new Error(JSON.stringify(report.issues, null, 2))
```

每次提交至少执行：

```bash
pnpm build
pnpm test
worldform adapter:check ./dist/index.js --json
worldform validate ./scene.worldform.json --adapter ./dist/index.js --json
worldform inspect ./scene.worldform.json --json
worldform export ./scene.worldform.json --adapter ./dist/index.js --target project-json
```

CLI 成功返回 0；参数错误为 2；读取错误为 3；验证失败为 10；Adapter 错误为 11；其它执行错误为 12。CI 应依据退出码失败，并保留 JSON 诊断。

## 6. Editor 加载

Platform Alpha Editor 可从受信任的项目服务加载 browser ESM Adapter 与 SceneDocument：

```text
http://127.0.0.1:4173/
  ?adapter=http://127.0.0.1:4310/dist/browser-adapter.js
  &scene=http://127.0.0.1:4310/scene.worldform.json
```

`adapter` 与 `scene` 必须同时提供。Adapter 需要预先打成浏览器可独立解析的 ESM，跨源服务需要 CORS。该模块会在浏览器中执行，只能加载开发者明确信任的项目代码。Editor 使用同一 Adapter descriptor 动态生成创建菜单、Authoring Preview 与 Inspector；任何修改仍进入 Workspace Draft/Patch。

## 7. MCP 连接

先构建 Adapter，再让 MCP host 启动公开 stdio bin：

```json
{
  "mcpServers": {
    "worldform": {
      "command": "worldform-mcp",
      "args": [
        "--scene",
        "./scene.worldform.json",
        "--adapter",
        "./dist/index.js"
      ]
    }
  }
}
```

配置文件放置位置由 Codex、VS Code 或其它 MCP host 决定。`stdout` 专供 JSON-RPC，诊断写入 `stderr`。公开工具域为：

- `scene.*`：读取、查询和建立结构化 mutation Draft；
- `project.*`：列出/调用 capability 与验证；
- `change.*`：Preview、Apply、Discard；
- `history.*`：Undo、Redo；
- `preview.*`：Authoring Preview 生命周期。

MCP 不提供 shell、任意文件读写或任意代码执行。跨进程 Editor 同步不属于当前 stdio Alpha；在同一宿主进程共享 Workspace 时，Editor 与 MCP 共享 Draft/Ghost 状态。

## 8. 版本与升级

四类版本不能混用：

- `SceneDocument.formatVersion`：Worldform 磁盘格式；
- `manifest.adapterApiVersion`：Adapter 公共协议；
- `manifest.sceneSchemaVersion` / `document.projectSchemaVersion`：项目语义；
- `manifest.version`：Adapter 实现版本。

具体支持范围见 `COMPATIBILITY.md`。Alpha 期间升级公共包应整组升级；项目 schema 变化必须提供项目侧显式迁移，不能静默接受不匹配文档。

## 9. 故障排查

| 现象 | 检查 |
| --- | --- |
| `Adapter 模块没有导出` | 提供唯一 `default`、`adapter` 或 `worldformAdapter` 导出，并先 build |
| `adapter.incompatible_version` | 核对 Adapter API 主版本、Adapter ID 与 project schema 精确匹配 |
| `ERR_MODULE_NOT_FOUND` | 使用 ESM、在本地 import 中写 `.js` 后缀、安装同版本 Worldform 包 |
| CLI 验证退出 10 | 阅读 JSON 的 `source/sourceId/code/path`，分别处理 Core 与 Adapter 问题 |
| capability 产生修改但场景未变 | 先取得 Draft ID，再执行 `change.preview` 和 `change.apply` |
| stdio MCP 无响应 | 不要向 stdout 打日志；检查 scene/adapter 路径以 MCP 进程工作目录解析 |
| Editor 预览与数据不一致 | 以 Workspace `SceneDocument` 为权威，重新投影；不要直接改 Three/Pascal 状态 |
| 外部 Editor 项目加载失败 | 同时提供完整 URL；把 Adapter 打成 browser ESM；让项目服务允许 CORS |
| 真实项目调用超时 | 让项目调用响应 AbortSignal，并在 Adapter 层归一化错误，不在 Core 重试 |

## 10. 完成清单

- Adapter ID、API、项目 schema、实现版本明确；
- Node/Component/Property descriptor 完整；
- Validator、Capability、Exporter 按项目需要声明；
- 项目真实算法仍由项目仓库拥有；
- 契约测试、CLI check 与场景验证通过；
- MCP 配置不暴露额外执行能力；
- 所有持久化修改经过 Workspace Draft/Patch/History；
- 无 Worldform 源码路径依赖；
- 无 Pascal/Three 持久化依赖。

如果合理需求仍必须修改 Worldform，先记录可复现的平台缺口，并证明它是通用能力；不要把项目专属规则放进公共层。
