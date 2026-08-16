import { createExampleSceneDocument } from '@worldform/example-adapter'
import { serializeSceneDocument } from '@worldform/core'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { runWorldformCli, WorldformCliExitCode } from '../src/index.js'

describe('Worldform CLI', () => {
  let directory = ''
  let stdout = ''
  let stderr = ''

  beforeEach(async () => {
    directory = join(tmpdir(), `worldform-cli-${crypto.randomUUID()}`)
    await mkdir(directory, { recursive: true })
    stdout = ''
    stderr = ''
  })

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true })
  })

  const run = (args: readonly string[]) =>
    runWorldformCli(args, {
      cwd: directory,
      stdout: (text) => {
        stdout += text
      },
      stderr: (text) => {
        stderr += text
      },
    })

  async function writeScene(name = 'scene.worldform.json'): Promise<string> {
    await writeFile(join(directory, name), serializeSceneDocument(createExampleSceneDocument()))
    return name
  }

  it('以 JSON 输出检查 Example Adapter 契约', async () => {
    const result = await run(['adapter', 'check', '@worldform/example-adapter', '--json'])

    expect(result.exitCode).toBe(WorldformCliExitCode.success)
    expect(result.ok).toBe(true)
    expect(JSON.parse(stdout)).toMatchObject({ command: 'adapter:check', ok: true })
    expect(stderr).toBe('')
  })

  it('通过 Workspace + Adapter Host 验证场景', async () => {
    const scene = await writeScene()
    const result = await run([
      'validate',
      scene,
      '--adapter',
      '@worldform/example-adapter',
      '--json',
    ])

    expect(result).toMatchObject({ ok: true, exitCode: WorldformCliExitCode.success })
    expect(JSON.parse(stdout).data.adapter).toBe('example.adapter')
  })

  it('非法场景返回稳定非零退出码和结构化诊断', async () => {
    const document = createExampleSceneDocument()
    const room = document.nodes.room
    if (!room) throw new Error('测试场景缺少 room')
    const invalidDocument = {
      ...document,
      nodes: {
        ...document.nodes,
        room: {
          ...room,
          transform: { ...room.transform, rotation: [0, 0, 0, 0] as const },
        },
      },
    }
    await writeFile(join(directory, 'invalid.json'), serializeSceneDocument(invalidDocument))

    const result = await run(['validate', 'invalid.json', '--json'])

    expect(result.exitCode).toBe(WorldformCliExitCode.validation)
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: 'core.zero_quaternion', source: 'core' }),
    )
    expect(JSON.parse(stderr).ok).toBe(false)
  })

  it('inspect 汇总场景，export 调用 Adapter exporter', async () => {
    const scene = await writeScene()
    const inspected = await run(['inspect', scene, '--json'])
    expect(inspected.data).toMatchObject({ nodeCount: 2, rootCount: 1 })

    stdout = ''
    const exported = await run([
      'export',
      scene,
      '--adapter',
      '@worldform/example-adapter',
      '--target',
      'example-json',
      '--json',
    ])
    expect(exported).toMatchObject({ ok: true, exitCode: WorldformCliExitCode.success })
    expect(JSON.parse(stdout).data.mediaType).toBe('application/json')
  })

  it('缺少输入和无法加载的 Adapter 返回不同退出码', async () => {
    expect((await run(['validate', '--json'])).exitCode).toBe(WorldformCliExitCode.usage)
    stderr = ''
    expect((await run(['adapter:check', './missing.mjs', '--json'])).exitCode).toBe(
      WorldformCliExitCode.adapter,
    )
    expect(JSON.parse(stderr).error.code).toBe('cli.adapter_load_failed')
  })

  it('契约无效的 Adapter 返回结构化失败报告', async () => {
    await writeFile(
      join(directory, 'invalid-adapter.mjs'),
      `export default {
        manifest: { id: 'invalid.adapter', displayName: 'Invalid', adapterApiVersion: '1.0.0', sceneSchemaVersion: '1.0.0', version: '1.0.0' },
        listNodeTypes: () => [{ type: 'duplicate', displayName: 'A', components: [] }, { type: 'duplicate', displayName: 'B', components: [] }],
        listComponentTypes: () => [], listValidators: () => [], listCapabilities: () => [],
        validateDocument: () => ({ valid: true, issues: [] }),
        callCapability: async () => ({}), listExportTargets: () => [],
        exportDocument: async () => ({ fileName: 'x', mediaType: 'text/plain', content: '' })
      }`,
    )

    const result = await run(['adapter:check', './invalid-adapter.mjs', '--json'])

    expect(result).toMatchObject({ ok: false, exitCode: WorldformCliExitCode.adapter })
    expect(JSON.parse(stderr).data.report.issues).toContainEqual(
      expect.objectContaining({ code: 'contract.duplicate_node_type' }),
    )
  })
})
