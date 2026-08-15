# ADR-001：Worldform 的职责边界

- 状态：Accepted
- 日期：2026-08-15

## 决策

Worldform 定位为“通用场景与空间内容编辑框架”，而不是游戏引擎或通用玩法框架。

Worldform Core 拥有：

- SceneDocument；
- Transform / hierarchy；
- Operations / Patch；
- Validation Result；
- History / Diff 的通用基础；
- Project Adapter 契约；
- 后续基础 Director 数据契约。

具体项目拥有：

- WFC / 程序生成；
- 导航算法；
- 任务系统；
- 敌人刷新逻辑；
- 归位规则；
- 物理玩法；
- 体素破坏；
- 项目 Runtime。

## 原因

若 Worldform 重写项目规则，会产生两套权威实现并长期漂移，最终让编辑器预览与游戏真实行为不一致。

## 判定规则

一项能力只有在至少两个真实项目都需要时，才优先考虑进入 Core；否则默认进入 Project Adapter。

## 后果

- Core 保持轻量、可测试、渲染器无关；
- 项目 Adapter 可能较多，但每个 Adapter 边界更清楚；
- 编辑器必须能够调用项目真实能力，而不是仅靠本地近似实现。
