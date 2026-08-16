import { build } from 'esbuild'

// CLI 将平台静态依赖打入单一 Node ESM 入口；第三方 Adapter 的动态 import 保持运行时解析。
await build({
  entryPoints: ['src/bin.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'dist/bin.js',
  sourcemap: true,
})
