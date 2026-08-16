import type { WorldformProjectAdapter } from '@worldform/adapter-api'
import { isAbsolute, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { WorldformCliError, WorldformCliExitCode } from './types.js'

function isAdapter(value: unknown): value is WorldformProjectAdapter {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<WorldformProjectAdapter>
  return (
    typeof candidate.manifest === 'object' &&
    candidate.manifest !== null &&
    typeof candidate.listNodeTypes === 'function' &&
    typeof candidate.listComponentTypes === 'function' &&
    typeof candidate.validateDocument === 'function' &&
    typeof candidate.callCapability === 'function' &&
    typeof candidate.exportDocument === 'function'
  )
}

function toImportSpecifier(specifier: string, cwd: string): string {
  if (specifier.startsWith('.') || isAbsolute(specifier)) {
    return pathToFileURL(resolve(cwd, specifier)).href
  }
  return specifier
}

/** 从 npm package 或本地 ESM 文件中发现唯一的 Adapter 导出。 */
export async function loadWorldformAdapter(
  specifier: string,
  cwd = process.cwd(),
): Promise<WorldformProjectAdapter> {
  let module: Record<string, unknown>
  try {
    module = (await import(toImportSpecifier(specifier, cwd))) as Record<string, unknown>
  } catch (error) {
    throw new WorldformCliError(
      'cli.adapter_load_failed',
      `无法加载 Adapter "${specifier}"：${error instanceof Error ? error.message : String(error)}`,
      WorldformCliExitCode.adapter,
      'adapter',
      specifier,
      { cause: error },
    )
  }

  const preferred = [module.default, module.adapter, module.worldformAdapter]
  for (const candidate of preferred) {
    if (isAdapter(candidate)) return candidate
  }

  const discovered = [...new Set(Object.values(module).filter(isAdapter))]
  if (discovered.length === 1) return discovered[0] as WorldformProjectAdapter
  throw new WorldformCliError(
    'cli.adapter_export_not_found',
    discovered.length > 1
      ? `Adapter 模块 "${specifier}" 导出了多个 Adapter，请提供单一 default/adapter/worldformAdapter 导出。`
      : `Adapter 模块 "${specifier}" 没有导出 WorldformProjectAdapter。`,
    WorldformCliExitCode.adapter,
    'adapter',
    specifier,
  )
}
