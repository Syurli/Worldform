import { build } from 'esbuild'

// stdio 入口打包 Worldform 平台静态依赖；第三方 Adapter 保持运行时动态解析。
await build({
  entryPoints: ['src/stdio.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'dist/stdio.js',
  sourcemap: true,
})
