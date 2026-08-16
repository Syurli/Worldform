import { useRegistry } from '@pascal-app/core'
import { NodeRenderer, useNodeEvents } from '@pascal-app/viewer'
import { useRef } from 'react'
import type { Group } from 'three'
import { WORLDFORM_PASCAL_NODE_KIND } from './constants.js'
import type { PascalWorldformSchemaNode } from './plugin.js'

function PreviewGeometry({ node }: { node: PascalWorldformSchemaNode }) {
  const [width, height, depth] = node.dimensions
  const material = (
    <meshStandardMaterial
      color={node.previewColor}
      opacity={node.previewKind === 'zone' ? 0.22 : 0.72}
      transparent
      wireframe={node.previewKind === 'zone'}
    />
  )

  if (node.previewKind === 'sphere' || node.previewKind === 'light') {
    return (
      <>
        <mesh castShadow position-y={Math.max(height / 2, 0.35)} receiveShadow>
          <sphereGeometry args={[Math.max(width, height, depth) / 2, 24, 16]} />
          {material}
        </mesh>
        {node.previewKind === 'light' ? (
          <pointLight color={node.previewColor} intensity={8} position-y={height + 0.5} />
        ) : null}
      </>
    )
  }

  if (node.previewKind === 'marker') {
    return (
      <mesh castShadow position-y={height / 2} receiveShadow>
        <coneGeometry args={[Math.max(width, depth) / 2, Math.max(height, 0.5), 20]} />
        {material}
      </mesh>
    )
  }

  return (
    <mesh castShadow position-y={height / 2} receiveShadow>
      <boxGeometry args={[width, height, depth]} />
      {material}
    </mesh>
  )
}

/**
 * Pascal registry 节点渲染器。层级递归仍走 Pascal NodeRenderer，选择事件与对象注册
 * 也使用 Pascal 公共 hook；这里不直接接触 Worldform Workspace。
 */
export default function WorldformPascalNodeRenderer({ node }: { node: PascalWorldformSchemaNode }) {
  const ref = useRef<Group>(null)
  // Pascal 0.9.2 的公开 hook 类型仍由内置 AnyNode 联合生成；registry 运行时已支持插件种类。
  useRegistry(node.id, WORLDFORM_PASCAL_NODE_KIND, ref as never)
  const handlers = useNodeEvents(node as never, WORLDFORM_PASCAL_NODE_KIND as never)

  return (
    <group
      name={`worldform:${node.id}`}
      position={node.position}
      ref={ref}
      rotation={node.rotation}
      scale={node.scale}
      visible={node.visible}
    >
      <group {...handlers} userData={{ worldformNodeId: node.id }}>
        <PreviewGeometry node={node} />
      </group>
      {node.children.map((childId) => (
        <NodeRenderer key={childId} nodeId={childId as never} />
      ))}
    </group>
  )
}
