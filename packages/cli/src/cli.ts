import { ProjectAdapterError, type WorldformProjectAdapter } from '@worldform/adapter-api'
import { checkAdapterContract } from '@worldform/adapter-sdk'
import { deserializeSceneDocument, type SceneDocument, type ValidationIssue } from '@worldform/core'
import { AdapterHost, WorldformWorkspace } from '@worldform/workspace'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { loadWorldformAdapter } from './adapter-loader.js'
import {
  WorldformCliError,
  WorldformCliExitCode,
  type WorldformCliIo,
  type WorldformCliResult,
} from './types.js'

interface ParsedArguments {
  command: string
  positionals: readonly string[]
  options: Readonly<Record<string, string | true>>
  json: boolean
}

const HELP = `Worldform CLI

用法：
  worldform validate <scene> [--adapter <module>] [--json]
  worldform inspect <scene> [--adapter <module>] [--json]
  worldform export <scene> --adapter <module> --target <target> [--output <file>] [--json]
  worldform adapter:check <adapter> [--json]
  worldform adapter check <adapter> [--json]

退出码：0 成功；2 参数错误；3 输入错误；10 验证失败；11 Adapter 错误；12 执行错误。`

const VALUE_OPTIONS = new Set(['adapter', 'target', 'output'])

function defaultIo(): WorldformCliIo {
  return {
    cwd: process.cwd(),
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  }
}

function parseArguments(args: readonly string[]): ParsedArguments {
  const normalized =
    args[0] === 'adapter' && args[1] === 'check' ? ['adapter:check', ...args.slice(2)] : [...args]
  const command = normalized.shift() ?? 'help'
  const positionals: string[] = []
  const options: Record<string, string | true> = {}

  while (normalized.length > 0) {
    const token = normalized.shift()
    if (!token) continue
    if (!token.startsWith('--')) {
      positionals.push(token)
      continue
    }
    const name = token.slice(2)
    if (name === 'json') {
      options.json = true
      continue
    }
    if (!VALUE_OPTIONS.has(name)) {
      throw new WorldformCliError(
        'cli.unknown_option',
        `未知参数：--${name}`,
        WorldformCliExitCode.usage,
      )
    }
    const value = normalized.shift()
    if (!(value && !value.startsWith('--'))) {
      throw new WorldformCliError(
        'cli.missing_option_value',
        `参数 --${name} 需要一个值。`,
        WorldformCliExitCode.usage,
      )
    }
    options[name] = value
  }
  return { command, positionals, options, json: options.json === true }
}

function requirePositional(parsed: ParsedArguments, index: number, label: string): string {
  const value = parsed.positionals[index]
  if (value) return value
  throw new WorldformCliError('cli.missing_argument', `缺少 ${label}。`, WorldformCliExitCode.usage)
}

function requireOption(parsed: ParsedArguments, name: string): string {
  const value = parsed.options[name]
  if (typeof value === 'string') return value
  throw new WorldformCliError(
    'cli.missing_option',
    `缺少必需参数 --${name}。`,
    WorldformCliExitCode.usage,
  )
}

async function readScene(path: string, cwd: string): Promise<SceneDocument> {
  const absolutePath = resolve(cwd, path)
  let content: string
  try {
    content = await readFile(absolutePath, 'utf8')
  } catch (error) {
    throw new WorldformCliError(
      'cli.scene_read_failed',
      `无法读取场景：${absolutePath}`,
      WorldformCliExitCode.input,
      'cli',
      absolutePath,
      { cause: error },
    )
  }
  try {
    return deserializeSceneDocument(content)
  } catch (error) {
    throw new WorldformCliError(
      'cli.scene_parse_failed',
      error instanceof Error ? error.message : String(error),
      WorldformCliExitCode.input,
      'core',
      absolutePath,
      { cause: error },
    )
  }
}

async function withHost<TResult>(
  adapter: WorldformProjectAdapter,
  operation: (host: AdapterHost) => Promise<TResult>,
): Promise<TResult> {
  const host = new AdapterHost(adapter)
  try {
    await host.initialize()
    return await operation(host)
  } finally {
    await host.dispose()
  }
}

function summarizeIssues(issues: readonly ValidationIssue[]): string[] {
  return issues.map((issue) => {
    const location = [issue.source, issue.sourceId, issue.path].filter(Boolean).join(':')
    return `${issue.severity.toUpperCase()} ${issue.code}${location ? ` (${location})` : ''} ${issue.message}`
  })
}

function renderHuman(result: WorldformCliResult): string {
  if (result.command === 'help') return `${HELP}\n`
  if (result.error) return `失败 [${result.error.code}] ${result.error.message}\n`
  const lines = [`${result.ok ? '成功' : '失败'}：${result.command}`]
  if (result.issues) lines.push(...summarizeIssues(result.issues))
  if (result.data !== undefined) lines.push(JSON.stringify(result.data, null, 2))
  return `${lines.join('\n')}\n`
}

function emitResult(result: WorldformCliResult, json: boolean, io: WorldformCliIo): void {
  const output = json ? `${JSON.stringify(result, null, 2)}\n` : renderHuman(result)
  if (result.ok) io.stdout(output)
  else io.stderr(output)
}

async function validateCommand(
  parsed: ParsedArguments,
  io: WorldformCliIo,
): Promise<WorldformCliResult> {
  const document = await readScene(requirePositional(parsed, 0, '场景文件'), io.cwd)
  const adapterSpecifier = parsed.options.adapter
  if (typeof adapterSpecifier !== 'string') {
    const validation = await new WorldformWorkspace(document).validateDocument()
    return {
      command: 'validate',
      ok: validation.valid,
      exitCode: validation.valid ? WorldformCliExitCode.success : WorldformCliExitCode.validation,
      data: { documentId: document.id, adapter: null },
      issues: validation.issues,
    }
  }
  const adapter = await loadWorldformAdapter(adapterSpecifier, io.cwd)
  return withHost(adapter, async (host) => {
    const validation = await new WorldformWorkspace(document, {
      adapterSession: host,
    }).validateDocument()
    return {
      command: 'validate',
      ok: validation.valid,
      exitCode: validation.valid ? WorldformCliExitCode.success : WorldformCliExitCode.validation,
      data: { documentId: document.id, adapter: adapter.manifest.id },
      issues: validation.issues,
    }
  })
}

async function inspectCommand(
  parsed: ParsedArguments,
  io: WorldformCliIo,
): Promise<WorldformCliResult> {
  const document = await readScene(requirePositional(parsed, 0, '场景文件'), io.cwd)
  const workspace = new WorldformWorkspace(document)
  const nodeTypes: Record<string, number> = {}
  for (const node of Object.values(workspace.getDocument().nodes)) {
    nodeTypes[node.type] = (nodeTypes[node.type] ?? 0) + 1
  }
  const adapterSpecifier = parsed.options.adapter
  const adapter =
    typeof adapterSpecifier === 'string'
      ? await loadWorldformAdapter(adapterSpecifier, io.cwd)
      : undefined
  return {
    command: 'inspect',
    ok: true,
    exitCode: WorldformCliExitCode.success,
    data: {
      id: document.id,
      formatVersion: document.formatVersion,
      projectAdapterId: document.projectAdapterId ?? null,
      projectSchemaVersion: document.projectSchemaVersion ?? null,
      revision: workspace.getRevision(),
      nodeCount: Object.keys(document.nodes).length,
      rootCount: document.rootNodeIds.length,
      resourceCount: Object.keys(document.resources).length,
      nodeTypes,
      adapter: adapter?.manifest ?? null,
    },
  }
}

async function adapterCheckCommand(
  parsed: ParsedArguments,
  io: WorldformCliIo,
): Promise<WorldformCliResult> {
  const specifier = requirePositional(parsed, 0, 'Adapter 模块')
  const adapter = await loadWorldformAdapter(specifier, io.cwd)
  return withHost(adapter, async () => {
    const report = await checkAdapterContract(adapter)
    return {
      command: 'adapter:check',
      ok: report.valid,
      exitCode: report.valid ? WorldformCliExitCode.success : WorldformCliExitCode.adapter,
      data: { manifest: adapter.manifest, report },
    }
  })
}

async function exportCommand(
  parsed: ParsedArguments,
  io: WorldformCliIo,
): Promise<WorldformCliResult> {
  const document = await readScene(requirePositional(parsed, 0, '场景文件'), io.cwd)
  const adapter = await loadWorldformAdapter(requireOption(parsed, 'adapter'), io.cwd)
  const target = requireOption(parsed, 'target')
  return withHost(adapter, async (host) => {
    const workspace = new WorldformWorkspace(document, { adapterSession: host })
    const validation = await workspace.validateDocument()
    if (!validation.valid) {
      return {
        command: 'export',
        ok: false,
        exitCode: WorldformCliExitCode.validation,
        data: { target },
        issues: validation.issues,
      }
    }
    const exported = await host.exportDocument(target, workspace.getDocument())
    const output = parsed.options.output
    if (typeof output === 'string') {
      const outputPath = resolve(io.cwd, output)
      await writeFile(outputPath, exported.content, 'utf8')
      return {
        command: 'export',
        ok: true,
        exitCode: WorldformCliExitCode.success,
        data: {
          fileName: exported.fileName,
          mediaType: exported.mediaType,
          outputPath,
        },
      }
    }
    return {
      command: 'export',
      ok: true,
      exitCode: WorldformCliExitCode.success,
      data: exported,
    }
  })
}

function normalizeError(command: string, error: unknown): WorldformCliResult {
  if (error instanceof WorldformCliError) {
    return {
      command,
      ok: false,
      exitCode: error.exitCode,
      error: {
        code: error.code,
        message: error.message,
        source: error.source,
        ...(error.path ? { path: error.path } : {}),
      },
    }
  }
  if (error instanceof ProjectAdapterError) {
    return {
      command,
      ok: false,
      exitCode: WorldformCliExitCode.adapter,
      error: {
        code: error.code,
        message: error.message,
        source: 'adapter',
        ...(error.adapterId ? { path: error.adapterId } : {}),
      },
    }
  }
  return {
    command,
    ok: false,
    exitCode: WorldformCliExitCode.execution,
    error: {
      code: 'cli.execution_failed',
      message: error instanceof Error ? error.message : String(error),
      source: 'cli',
    },
  }
}

/** 执行一次无交互 CLI 调用，并同时返回结构化结果供测试或嵌入式调用。 */
export async function runWorldformCli(
  args: readonly string[],
  overrides: Partial<WorldformCliIo> = {},
): Promise<WorldformCliResult> {
  const io = { ...defaultIo(), ...overrides }
  let parsed: ParsedArguments
  try {
    parsed = parseArguments(args)
  } catch (error) {
    const result = normalizeError(args[0] ?? 'help', error)
    emitResult(result, args.includes('--json'), io)
    return result
  }

  try {
    let result: WorldformCliResult
    switch (parsed.command) {
      case 'help':
      case '--help':
      case '-h':
        result = { command: 'help', ok: true, exitCode: WorldformCliExitCode.success }
        break
      case 'validate':
        result = await validateCommand(parsed, io)
        break
      case 'inspect':
        result = await inspectCommand(parsed, io)
        break
      case 'adapter:check':
        result = await adapterCheckCommand(parsed, io)
        break
      case 'export':
        result = await exportCommand(parsed, io)
        break
      default:
        throw new WorldformCliError(
          'cli.unknown_command',
          `未知命令：${parsed.command}`,
          WorldformCliExitCode.usage,
        )
    }
    emitResult(result, parsed.json, io)
    return result
  } catch (error) {
    const result = normalizeError(parsed.command, error)
    emitResult(result, parsed.json, io)
    return result
  }
}

export { HELP as WORLDFORM_CLI_HELP }
