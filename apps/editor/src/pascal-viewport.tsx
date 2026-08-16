import { emitter, sceneRegistry, useScene } from '@pascal-app/core'
import { useViewer, Viewer } from '@pascal-app/viewer'
import { OrbitControls, TransformControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import type { Object3D } from 'three'
import { WORLDFORM_PASCAL_NODE_KIND } from '@worldform/pascal-adapter'

export type GizmoMode = 'translate' | 'rotate'

function CameraSetup() {
  const camera = useThree((state) => state.camera)
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => {
    camera.position.set(11, 9, 11)
    camera.lookAt(0, 1.5, 0)
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, invalidate])
  return null
}

/** Pascal 默认策略固定建筑层级；通用 Host 复用其事件与 outline，但直接选择插件节点。 */
function WorldformSelectionManager() {
  const selection = useViewer((state) => state.selection)
  const hoveredId = useViewer((state) => state.hoveredId)
  const nodes = useScene((state) => state.nodes)

  useEffect(() => {
    const onClick = (event: { node: { id: string }; stopPropagation: () => void }) => {
      event.stopPropagation()
      useViewer.getState().setSelection({ selectedIds: [event.node.id as never] })
      useViewer.getState().setHoveredId(null)
    }
    const onEnter = (event: { node: { id: string }; stopPropagation: () => void }) => {
      event.stopPropagation()
      useViewer.getState().setHoveredId(event.node.id as never)
    }
    const onLeave = (event: { node: { id: string } }) => {
      if (useViewer.getState().hoveredId === event.node.id) {
        useViewer.getState().setHoveredId(null)
      }
    }
    const clickKey = `${WORLDFORM_PASCAL_NODE_KIND}:click`
    const enterKey = `${WORLDFORM_PASCAL_NODE_KIND}:enter`
    const leaveKey = `${WORLDFORM_PASCAL_NODE_KIND}:leave`
    emitter.on(clickKey as never, onClick as never)
    emitter.on(enterKey as never, onEnter as never)
    emitter.on(leaveKey as never, onLeave as never)
    return () => {
      emitter.off(clickKey as never, onClick as never)
      emitter.off(enterKey as never, onEnter as never)
      emitter.off(leaveKey as never, onLeave as never)
    }
  }, [])

  useEffect(() => {
    // registry 在 React 场景提交后才含 Object3D；nodes 变化用于重新同步 outline。
    if (Object.keys(nodes).length === 0) return
    const outliner = useViewer.getState().outliner
    outliner.selectedObjects.length = 0
    for (const id of selection.selectedIds) {
      const object = sceneRegistry.nodes.get(id)
      if (object) outliner.selectedObjects.push(object)
    }
    outliner.hoveredObjects.length = 0
    if (hoveredId) {
      const object = sceneRegistry.nodes.get(hoveredId)
      if (object) outliner.hoveredObjects.push(object)
    }
  }, [hoveredId, nodes, selection])

  return null
}

function SelectionGizmo({
  mode,
  revision,
  onCommit,
}: {
  mode: GizmoMode
  revision: number
  onCommit: () => void
}) {
  const selectedId = useViewer((state) => state.selection.selectedIds.at(-1))
  void revision
  const object = selectedId ? sceneRegistry.nodes.get(selectedId) : undefined

  const writeProjectionTransform = () => {
    if (!(selectedId && object)) return
    useScene.getState().updateNode(
      selectedId as never,
      {
        position: object.position.toArray(),
        rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
        scale: object.scale.toArray(),
      } as never,
    )
  }

  if (!object) return null
  return (
    <TransformControls
      mode={mode}
      object={object as Object3D}
      onMouseUp={() => onCommit()}
      onObjectChange={writeProjectionTransform}
      rotationSnap={Math.PI / 12}
      translationSnap={0.1}
    />
  )
}

export function PascalViewport({
  mode,
  revision,
  onCommit,
}: {
  mode: GizmoMode
  revision: number
  onCommit: () => void
}) {
  return (
    <Viewer
      defaultRender={{ shading: 'solid', textures: false }}
      disablePostFx
      renderContext="editor"
      sceneReadyKey={revision}
      selectionManager="custom"
    >
      <CameraSetup />
      <WorldformSelectionManager />
      <OrbitControls makeDefault maxDistance={80} minDistance={2} target={[0, 1.5, 0]} />
      <gridHelper args={[40, 40, '#556276', '#303a49']} />
      <SelectionGizmo mode={mode} onCommit={onCommit} revision={revision} />
    </Viewer>
  )
}
