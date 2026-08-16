import type { ValidationIssue } from '@worldform/core'

/** 稳定进程退出码；CI 和 Agent 不需要解析自然语言来判断结果。 */
export const WorldformCliExitCode = {
  success: 0,
  usage: 2,
  input: 3,
  validation: 10,
  adapter: 11,
  execution: 12,
} as const

export type WorldformCliExitCode = (typeof WorldformCliExitCode)[keyof typeof WorldformCliExitCode]

export interface WorldformCliErrorPayload {
  code: string
  message: string
  source: 'cli' | 'core' | 'adapter' | 'workspace'
  path?: string
}

export interface WorldformCliResult {
  command: string
  ok: boolean
  exitCode: WorldformCliExitCode
  data?: unknown
  issues?: readonly ValidationIssue[]
  error?: WorldformCliErrorPayload
}

export interface WorldformCliIo {
  cwd: string
  stdout(text: string): void
  stderr(text: string): void
}

export class WorldformCliError extends Error {
  public override readonly name = 'WorldformCliError'

  public constructor(
    public readonly code: string,
    message: string,
    public readonly exitCode: WorldformCliExitCode,
    public readonly source: WorldformCliErrorPayload['source'] = 'cli',
    public readonly path?: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
  }
}
