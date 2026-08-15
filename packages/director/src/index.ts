import type { SceneNodeId, TransformData } from '@worldform/core'

export type DirectorTrackKind = 'camera' | 'actor' | 'object' | 'event' | 'marker'

export interface DirectorCue {
  id: string
  time: number
  kind: DirectorTrackKind
  targetNodeId?: SceneNodeId
  action: string
  parameters?: Readonly<Record<string, unknown>>
}

export interface DirectorTimeline {
  id: string
  schemaVersion: string
  duration: number
  cues: readonly DirectorCue[]
}

export interface DirectorCameraPose {
  transform: TransformData
  focalLengthMm?: number
  targetNodeId?: SceneNodeId
}

/** 第一阶段只锁定轻量数据边界，不实现完整 Sequencer。 */
export const WORLDFORM_DIRECTOR_PHASE = 'schema-placeholder' as const
