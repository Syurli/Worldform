import type { ScenePatch } from '@worldform/core'

export const WORLDFORM_MCP_PHASE = 'contract-first' as const

export type WorldformMcpMutationPreview = {
  changeId: string
  patches: readonly ScenePatch[]
}

export const PLANNED_MCP_TOOL_GROUPS = [
  'scene',
  'project',
  'preview',
  'change',
  'history',
  'director',
] as const
