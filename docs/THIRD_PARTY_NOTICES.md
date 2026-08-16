# 第三方依赖说明

本文件记录 Worldform 直接集成且需要在分发时重点保留归属的上游项目。完整间接依赖清单以 lockfile 和最终发布产物为准。

## Pascal Editor

- 项目：Pascal Editor
- 上游：`https://github.com/pascalorg/editor`
- 使用包：`@pascal-app/core@0.9.2`、`@pascal-app/viewer@0.9.2`
- 对应 npm `gitHead`：`cdf026bb92426cb7bd2807ce447e029dadbdaa86`
- 许可：MIT License

Worldform 通过公开 npm package 和 Plugin API 集成 Pascal，没有复制或修改其源码。对外分发 Editor 或 Pascal 隔离层时，应随产物保留 Pascal 的 MIT 许可文本和版权声明。
