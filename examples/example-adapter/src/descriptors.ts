import type { ProjectComponentDescriptor, ProjectNodeTypeDescriptor } from '@worldform/adapter-api'
import { defineComponent, defineNodeType } from '@worldform/adapter-sdk'

export const EXAMPLE_COMPONENTS: readonly ProjectComponentDescriptor[] = [
  defineComponent({
    id: 'example.dimensions',
    displayName: '尺寸',
    description: '作者视图中的通用包围盒尺寸。',
    properties: [
      { id: 'width', label: '宽度', type: 'number', required: true, minimum: 0.01, step: 0.1 },
      { id: 'height', label: '高度', type: 'number', required: true, minimum: 0.01, step: 0.1 },
      { id: 'depth', label: '深度', type: 'number', required: true, minimum: 0.01, step: 0.1 },
    ],
  }),
  defineComponent({
    id: 'example.presentation',
    displayName: '显示属性',
    properties: [
      { id: 'label', label: '标签', type: 'string', required: true },
      { id: 'visible', label: '可见', type: 'boolean', required: true, defaultValue: true },
      {
        id: 'tone',
        label: '色调',
        type: 'enum',
        enumOptions: [
          { value: 'neutral', label: '中性' },
          { value: 'warm', label: '暖色' },
          { value: 'cool', label: '冷色' },
        ],
      },
    ],
  }),
  defineComponent({
    id: 'example.target',
    displayName: '节点目标',
    properties: [{ id: 'node', label: '目标节点', type: 'node-reference', required: true }],
  }),
  defineComponent({
    id: 'example.asset',
    displayName: '资源',
    properties: [{ id: 'resource', label: '资源引用', type: 'resource-reference', required: true }],
  }),
]

export const EXAMPLE_NODE_TYPES: readonly ProjectNodeTypeDescriptor[] = [
  defineNodeType({
    type: 'example.box',
    displayName: 'Box',
    components: ['example.dimensions', 'example.presentation'],
    preview: { kind: 'box', color: '#6f8cff' },
  }),
  defineNodeType({
    type: 'example.prop',
    displayName: 'Prop',
    components: ['example.presentation', 'example.asset'],
    preview: { kind: 'sphere', color: '#df9a57' },
  }),
  defineNodeType({
    type: 'example.light',
    displayName: 'Light',
    components: ['example.presentation'],
    preview: { kind: 'light', color: '#ffe37a' },
  }),
  defineNodeType({
    type: 'example.zone',
    displayName: 'Zone',
    components: ['example.dimensions', 'example.presentation'],
    preview: { kind: 'zone', color: '#54c98c' },
  }),
  defineNodeType({
    type: 'example.marker',
    displayName: 'Marker',
    components: ['example.presentation', 'example.target'],
    preview: { kind: 'marker', color: '#ff5c8a' },
  }),
]
