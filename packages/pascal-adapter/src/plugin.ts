import {
  BaseNode,
  type AnyNodeDefinition,
  type NodeDefinition,
  type Plugin,
  loadPlugin,
  nodeType,
} from '@pascal-app/core'
import { z } from 'zod'
import { WORLDFORM_PASCAL_NODE_KIND, WORLDFORM_PASCAL_PLUGIN_ID } from './constants.js'

const Vec3Schema = z.tuple([z.number(), z.number(), z.number()])

/** Pascal 只校验作者视图工作副本；项目组件的正式校验仍由 Adapter 执行。 */
export const PascalWorldformNodeSchema = BaseNode.extend({
  type: nodeType(WORLDFORM_PASCAL_NODE_KIND),
  children: z.array(z.string()).default([]),
  position: Vec3Schema.default([0, 0, 0]),
  rotation: Vec3Schema.default([0, 0, 0]),
  scale: Vec3Schema.default([1, 1, 1]),
  worldformType: z.string(),
  worldformName: z.string(),
  worldformComponents: z.record(z.string(), z.unknown()).default({}),
  previewKind: z.enum(['box', 'sphere', 'zone', 'marker', 'light', 'custom']),
  previewColor: z.string(),
  dimensions: Vec3Schema.default([1, 1, 1]),
})

export type PascalWorldformSchemaNode = z.infer<typeof PascalWorldformNodeSchema>

const definition: NodeDefinition<typeof PascalWorldformNodeSchema> & Record<string, unknown> = {
  kind: WORLDFORM_PASCAL_NODE_KIND,
  schemaVersion: 1,
  schema: PascalWorldformNodeSchema,
  category: 'furnish',
  defaults: () => ({
    object: 'node',
    parentId: null,
    visible: true,
    metadata: {},
    children: [],
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    worldformType: 'worldform.unknown',
    worldformName: 'Worldform Node',
    worldformComponents: {},
    previewKind: 'custom',
    previewColor: '#6f8cff',
    dimensions: [1, 1, 1],
  }),
  capabilities: {
    movable: { axes: ['x', 'y', 'z'], gridSnap: true },
    rotatable: { axes: ['x', 'y', 'z'] },
    scalable: { axes: ['x', 'y', 'z'], min: 0.01 },
    selectable: { hitVolume: 'bbox' },
    duplicable: true,
    deletable: true,
    groupable: true,
    snappable: {},
  },
  dirtyTracking: false,
  renderer: { kind: 'parametric', module: () => import('./renderer.js') },
  presentation: {
    label: 'Worldform Node',
    description: '由 Worldform SceneDocument 投影的通用作者节点。',
    icon: { kind: 'iconify', name: 'lucide:box' },
    paletteSection: 'furnish',
    hidden: true,
  },
}

export const worldformPascalPlugin: Plugin = {
  id: WORLDFORM_PASCAL_PLUGIN_ID,
  apiVersion: 1,
  nodes: [definition as unknown as AnyNodeDefinition],
}

let pluginLoadPromise: Promise<void> | undefined

/** 同一页面只注册一次，兼容 React StrictMode 的重复 mount。 */
export function ensureWorldformPascalPlugin(): Promise<void> {
  pluginLoadPromise ??= loadPlugin(worldformPascalPlugin)
  return pluginLoadPromise
}
