# 战术巫师适配样例（规划占位）

此目录用于验证 Worldform 的“大空间 + 程序生成”适配能力。

## Worldform 负责编辑

- WFC Module
- Connector
- Walk Surface
- Obstacle
- Enemy Anchor
- Loot Anchor
- Extraction
- Key Node
- Fixed Level 基础空间结构

## 战术巫师项目继续拥有

- TC-WFC
- Mission Topology
- Portal Graph
- Navigation
- Seed / Retry / Fallback
- Runtime Scene Builder

## 第一轮 capability

```text
validateModule
generateLevel
validateLevel
exportDefinition
```

## 第一轮 PoC 验收

1. 在 Worldform/Pascal 作者视图编辑一个真实 WFC 样板；
2. 转换为项目能读取的定义；
3. 调用项目真实 Validator；
4. 调用真实 Generator 生成至少一个结果；
5. 将生成结果回显为只读或可继续编辑的 Worldform 投影；
6. 不在本仓库复制 WFC 算法。

> 此目录当前只定义契约与验收目标。正式 Adapter 应在确定与 TWR_Dev 的代码共享方式后再实现。
