#!/usr/bin/env node
import { serveStdio } from '@modelcontextprotocol/server/stdio'
import type { WorldformProjectAdapter } from '@worldform/adapter-api'
import { deserializeSceneDocument } from '@worldform/core'
import { AdapterHost, WorldformWorkspace } from '@worldform/workspace'
import { readFile } from 'node:fs/promises'
import { isAbsolute, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createWorldformMcpServer } from './server.js'
import { WorldformMcpSession } from './session.js'

interface StdioArguments {
  scene: string
  adapter?: string
}

function parseArguments(args: readonly string[]): StdioArguments {
  if (args.includes('--help') || args.includes('-h')) {
    throw new Error('usage')
  }
  let scene: string | undefined
  let adapter: string | undefined
  for (let index = 0; index < args.length; index += 1) {
    const name = args[index]
    const value = args[index + 1]
    if (name === '--scene' && value) {
      scene = value
      index += 1
    } else if (name === '--adapter' && value) {
      adapter = value
      index += 1
    } else {
      throw new Error(`未知参数：${name ?? ''}`)
    }
  }
  if (!scene) throw new Error('缺少 --scene <file>。')
  return { scene, ...(adapter ? { adapter } : {}) }
}

function isAdapter(value: unknown): value is WorldformProjectAdapter {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<WorldformProjectAdapter>
  return (
    typeof candidate.manifest === 'object' &&
    typeof candidate.listNodeTypes === 'function' &&
    typeof candidate.validateDocument === 'function' &&
    typeof candidate.callCapability === 'function'
  )
}

async function loadAdapter(specifier: string): Promise<WorldformProjectAdapter> {
  const importSpecifier =
    specifier.startsWith('.') || isAbsolute(specifier)
      ? pathToFileURL(resolve(process.cwd(), specifier)).href
      : specifier
  const module = (await import(importSpecifier)) as Record<string, unknown>
  for (const candidate of [
    module.default,
    module.adapter,
    module.worldformAdapter,
    ...Object.values(module),
  ]) {
    if (isAdapter(candidate)) return candidate
  }
  throw new Error(`Adapter 模块没有导出 WorldformProjectAdapter：${specifier}`)
}

export async function runWorldformMcpStdio(args: readonly string[]): Promise<void> {
  const parsed = parseArguments(args)
  const document = deserializeSceneDocument(await readFile(resolve(parsed.scene), 'utf8'))
  const host = parsed.adapter ? new AdapterHost(await loadAdapter(parsed.adapter)) : undefined
  if (host) await host.initialize()
  const workspace = new WorldformWorkspace(document, {
    ...(host ? { adapterSession: host } : {}),
  })
  const session = new WorldformMcpSession(workspace)
  const handle = serveStdio(() => createWorldformMcpServer(session), {
    onerror: (error) => console.error('[worldform-mcp]', error.message),
  })

  const shutdown = async () => {
    await handle.close()
    await host?.dispose()
  }
  process.once('SIGINT', () => void shutdown())
  process.once('SIGTERM', () => void shutdown())
  console.error(`Worldform MCP stdio 已启动：${document.id}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runWorldformMcpStdio(process.argv.slice(2)).catch((error: unknown) => {
    if (error instanceof Error && error.message === 'usage') {
      console.error('用法：worldform-mcp --scene <file> [--adapter <module>]')
      process.exitCode = 0
      return
    }
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
