import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const workspaceRoot = fileURLToPath(new URL('..', import.meta.url))
const outputDirectory = resolve(workspaceRoot, 'artifacts/packages')
const publicPackages = [
  'packages/core',
  'packages/adapter-api',
  'packages/adapter-sdk',
  'packages/workspace',
  'packages/cli',
  'packages/mcp',
  'packages/pascal-adapter',
  'examples/example-adapter',
]

await mkdir(outputDirectory, { recursive: true })
const pnpmEntry = process.env.npm_execpath
if (!pnpmEntry) throw new Error('请通过 pnpm pack:packages 运行打包脚本。')

for (const packageDirectory of publicPackages) {
  // 每个 tarball 都由其正式 package.json/files/exports 生成，禁止从源码路径偷渡消费。
  const result = spawnSync(
    process.execPath,
    [pnpmEntry, 'pack', '--pack-destination', outputDirectory],
    {
      cwd: resolve(workspaceRoot, packageDirectory),
      encoding: 'utf8',
      stdio: 'pipe',
    },
  )
  if (result.status !== 0) {
    throw new Error(
      `打包失败 ${packageDirectory}: ${result.error?.message || result.stderr || result.stdout || `exit ${result.status}`}`,
    )
  }
  process.stdout.write(result.stdout)
}

console.log(`Worldform packages 已输出到 ${outputDirectory}`)
