# Worldform 第三方接入流程

## 1. 目标

本文件定义 Worldform 达到 Third-party Ready 后，独立项目应采用的正式接入方式。

核心标准：

> 消费者项目可以不修改 Worldform 源码完成接入。

## 2. 推荐流程

```text
安装 / 引用 Worldform SDK
        ↓
阅读 Adapter Development Skill
        ↓
梳理项目数据与真实能力
        ↓
建立 Adapter
        ↓
声明 node/component/property descriptor
        ↓
声明 capability / validator / export
        ↓
运行 contract test + adapter check
        ↓
在 Worldform Editor 加载
        ↓
通过 MCP/人工编辑场景
        ↓
项目 Runtime / Bridge 验证
```

## 3. 接入前先分类

开始编码前必须列出三类内容：

### Worldform 通用语义

例如 Transform、层级、通用资源、Marker、Zone 等。

### 项目专属语义

例如某游戏的 WFC Connector、Placement Rule、Enemy Anchor 等，由 Adapter descriptor/schema 声明。

### 项目真实算法

例如 Generator、Physics、Navigation、Mission、Completion。只能通过 capability 调用，不复制到 Worldform。

## 4. 推荐目录

```text
YourProject/
└─ tools/worldform/
   ├─ adapter/
   ├─ schemas/
   ├─ capabilities/
   ├─ tests/
   └─ README.md
```

具体目录可以调整，但 Adapter 与项目真实逻辑的所有权必须清晰。

## 5. 开发验证

正式工具完成后应至少执行：

```text
worldform adapter check
worldform validate
```

并运行 Adapter 契约测试。

如果 Adapter 使用项目本地服务或引擎 Bridge，还应验证 timeout、cancel、进程退出和错误归一化。

## 6. 场景编辑

运行中编辑统一经过 Workspace：

```text
Editor / MCP / CLI
      ↓
Workspace
      ↓
DraftChange
      ↓
Core + Adapter Validation
      ↓
Preview
      ↓
Apply / Discard
      ↓
History
```

第三方工具不得直接修改 Pascal/Three 内部状态来绕过正式文档。

## 7. 平台缺口处理

如果一个合理的项目需求无法在不修改 Worldform 的情况下实现：

1. 先确认是否确实是通用平台能力；
2. 在项目侧记录最小复现；
3. 为 Worldform 提交平台能力需求或补丁；
4. 通过至少两个项目需求或明确的通用性论证后，再考虑进入公共层。

不要为了赶进度把项目专属规则加入 Core。

## 8. Clean-room 标准

P1-009 将以独立测试仓库验证本流程。只有 Clean-room 通过后，《战术巫师》和《物有所归》才进入正式外部接入阶段。
