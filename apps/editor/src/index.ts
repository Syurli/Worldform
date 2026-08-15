export const WORLDFORM_EDITOR_PHASE = 'foundation' as const

/**
 * 第一阶段不提前锁定 React/Next/Pascal 具体版本。
 * Pascal PoC 通过后，再在 editor host 与 pascal-adapter 中加入真实 UI 依赖。
 */
export const EDITOR_HOST_PRINCIPLES = [
  'Worldform SceneDocument is authoritative',
  'Pascal is an authoring projection',
  'Project preview is separate from authoring preview',
  'Project rules are called through adapters',
] as const
