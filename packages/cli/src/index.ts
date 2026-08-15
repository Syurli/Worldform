export const WORLDFORM_CLI_PHASE = 'contract-first' as const

export const PLANNED_CLI_COMMANDS = [
  'validate',
  'adapter:check',
  'export',
  'director:validate',
] as const

export type PlannedWorldformCliCommand = (typeof PLANNED_CLI_COMMANDS)[number]
