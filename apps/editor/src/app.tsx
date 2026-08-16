import { useViewer } from '@pascal-app/viewer'
import type { ProjectComponentDescriptor, ProjectPropertyDescriptor } from '@worldform/adapter-api'
import type { SceneDocument, SceneNode, ScenePatch, TransformData } from '@worldform/core'
import { useEffect, useMemo, useState } from 'react'
import type { EditorSessionSnapshot, WorldformEditorSession } from './editor-session.js'
import { PascalViewport, type GizmoMode } from './pascal-viewport.js'

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function SceneTree({
  document,
  selectedId,
  onSelect,
}: {
  document: SceneDocument
  selectedId: string | undefined
  onSelect: (id: string) => void
}) {
  const childrenByParent = useMemo(() => {
    const result = new Map<string, SceneNode[]>()
    for (const node of Object.values(document.nodes)) {
      if (!node.parentId) continue
      const children = result.get(node.parentId) ?? []
      children.push(node)
      result.set(node.parentId, children)
    }
    return result
  }, [document])

  const renderNode = (node: SceneNode, depth: number) => {
    const children = childrenByParent.get(node.id) ?? []
    return (
      <li key={node.id}>
        <button
          className={selectedId === node.id ? 'tree-node selected' : 'tree-node'}
          onClick={() => onSelect(node.id)}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          type="button"
        >
          <span className="tree-marker">◇</span>
          <span>{node.name ?? node.id}</span>
          <small>{node.type}</small>
        </button>
        {children.length > 0 ? (
          <ul>{children.map((child) => renderNode(child, depth + 1))}</ul>
        ) : null}
      </li>
    )
  }

  return (
    <ul className="scene-tree">
      {document.rootNodeIds
        .map((id) => document.nodes[id])
        .filter(Boolean)
        .map((node) => renderNode(node as SceneNode, 0))}
    </ul>
  )
}

function PropertyControl({
  descriptor,
  value,
  document,
  onCommit,
}: {
  descriptor: ProjectPropertyDescriptor
  value: unknown
  document: SceneDocument
  onCommit: (value: unknown) => void
}) {
  if (descriptor.type === 'number') {
    return (
      <input
        defaultValue={typeof value === 'number' ? value : ''}
        key={String(value)}
        max={descriptor.maximum}
        min={descriptor.minimum}
        onBlur={(event) => {
          const next = Number(event.currentTarget.value)
          if (Number.isFinite(next)) onCommit(next)
        }}
        step={descriptor.step ?? 'any'}
        type="number"
      />
    )
  }
  if (descriptor.type === 'boolean') {
    return (
      <input
        checked={value === true}
        onChange={(event) => onCommit(event.currentTarget.checked)}
        type="checkbox"
      />
    )
  }
  if (descriptor.type === 'enum') {
    return (
      <select onChange={(event) => onCommit(event.currentTarget.value)} value={String(value ?? '')}>
        {(descriptor.enumOptions ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }
  if (descriptor.type === 'node-reference') {
    const current = isRecord(value) && typeof value.nodeId === 'string' ? value.nodeId : ''
    return (
      <select
        onChange={(event) => onCommit({ kind: 'node', nodeId: event.currentTarget.value })}
        value={current}
      >
        {Object.values(document.nodes).map((node) => (
          <option key={node.id} value={node.id}>
            {node.name ?? node.id}
          </option>
        ))}
      </select>
    )
  }
  if (descriptor.type === 'resource-reference') {
    const current = isRecord(value) && typeof value.resourceId === 'string' ? value.resourceId : ''
    return (
      <select
        disabled={Object.keys(document.resources).length === 0}
        onChange={(event) => onCommit({ kind: 'resource', resourceId: event.currentTarget.value })}
        value={current}
      >
        {Object.keys(document.resources).length === 0 ? <option value="">无资源</option> : null}
        {Object.values(document.resources).map((resource) => (
          <option key={resource.id} value={resource.id}>
            {resource.id}
          </option>
        ))}
      </select>
    )
  }
  return (
    <input
      defaultValue={typeof value === 'string' ? value : ''}
      key={String(value)}
      onBlur={(event) => onCommit(event.currentTarget.value)}
      type="text"
    />
  )
}

function TransformEditor({
  node,
  onCommit,
}: {
  node: SceneNode
  onCommit: (transform: TransformData) => void
}) {
  const rows: ReadonlyArray<{
    label: string
    key: 'position' | 'scale'
    values: readonly number[]
  }> = [
    { label: '位置', key: 'position', values: node.transform.position },
    { label: '缩放', key: 'scale', values: node.transform.scale },
  ]
  return (
    <section className="inspector-section">
      <h3>变换</h3>
      {rows.map((row) => (
        <div className="vector-row" key={row.key}>
          <span>{row.label}</span>
          {(['x', 'y', 'z'] as const).map((axis, index) => (
            <input
              aria-label={`${row.label} ${axis}`}
              defaultValue={row.values[index]}
              key={`${row.key}-${axis}`}
              onBlur={(event) => {
                const nextValue = Number(event.currentTarget.value)
                if (!Number.isFinite(nextValue)) return
                const next = [...row.values] as [number, number, number]
                next[index] = nextValue
                onCommit({ ...node.transform, [row.key]: next })
              }}
              step="0.1"
              type="number"
            />
          ))}
        </div>
      ))}
      <div className="quaternion-readout">
        旋转四元数：{node.transform.rotation.map((value) => value.toFixed(3)).join(', ')}
      </div>
    </section>
  )
}

function Inspector({
  node,
  document,
  components,
  onPatch,
}: {
  node: SceneNode | undefined
  document: SceneDocument
  components: readonly ProjectComponentDescriptor[]
  onPatch: (patch: ScenePatch, detail: string) => void
}) {
  if (!node) return <div className="empty-state">在场景层级或视口中选择节点</div>
  const descriptors = new Map(components.map((component) => [component.id, component]))
  return (
    <div className="inspector-content">
      <section className="inspector-section">
        <div className="eyebrow">{node.type}</div>
        <label>
          名称
          <input
            defaultValue={node.name ?? ''}
            key={node.name}
            onBlur={(event) =>
              onPatch(
                { op: 'update', id: node.id, changes: { name: event.currentTarget.value } },
                '修改节点名称',
              )
            }
            type="text"
          />
        </label>
      </section>
      <TransformEditor
        node={node}
        onCommit={(transform) =>
          onPatch({ op: 'update', id: node.id, changes: { transform } }, '修改变换')
        }
      />
      {Object.entries(node.components ?? {}).map(([componentId, componentValue]) => {
        const descriptor = descriptors.get(componentId)
        if (!(descriptor && isRecord(componentValue))) return null
        return (
          <section className="inspector-section" key={componentId}>
            <h3>{descriptor.displayName}</h3>
            {descriptor.properties.map((property) => (
              <div className="property-row" key={property.id} title={property.description}>
                <span>{property.label}</span>
                <PropertyControl
                  descriptor={property}
                  document={document}
                  onCommit={(value) =>
                    onPatch(
                      {
                        op: 'component.setProperty',
                        id: node.id,
                        component: componentId,
                        path: [property.id],
                        value,
                      },
                      `修改 ${descriptor.displayName}.${property.label}`,
                    )
                  }
                  value={componentValue[property.id]}
                />
              </div>
            ))}
          </section>
        )
      })}
    </div>
  )
}

function draftStatusLabel(status: EditorSessionSnapshot['drafts'][number]['status']): string {
  switch (status) {
    case 'preview':
      return '待应用'
    case 'applied':
      return '已应用'
    case 'discarded':
      return '已丢弃'
  }
}

/** Worldform Authoring Alpha：Pascal 视口 + Workspace 驱动的通用编辑器壳。 */
export function App({ session }: { session: WorldformEditorSession }) {
  const [snapshot, setSnapshot] = useState<EditorSessionSnapshot>(session.getSnapshot())
  const [gizmoMode, setGizmoMode] = useState<GizmoMode>('translate')
  const [createType, setCreateType] = useState(session.nodeTypes[0]?.type ?? '')
  const [status, setStatus] = useState('已就绪')
  const [busy, setBusy] = useState(false)
  const selectedIds = useViewer((state) => state.selection.selectedIds)
  const selectedId = selectedIds.at(-1)
  const selectedNode = selectedId ? snapshot.document.nodes[selectedId] : undefined

  useEffect(() => session.subscribe(setSnapshot), [session])

  const run = async (label: string, operation: () => Promise<void>) => {
    setBusy(true)
    setStatus(`${label}…`)
    try {
      await operation()
      setStatus(`${label}完成`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }

  const selectNode = (id: string) =>
    useViewer.getState().setSelection({ selectedIds: [id as never] })
  const applyPatch = (patch: ScenePatch, detail: string) => {
    void run(detail, () => session.applyPatches([patch], detail))
  }
  const exportDocument = () => {
    const blob = new Blob([session.serializeDocument()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${snapshot.document.id}.worldform.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus('场景文档已导出')
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">万</span>
          <div>
            <strong>万类 Worldform</strong>
            <small>{session.host.adapter.manifest.displayName} · Pascal 创作预览 Alpha</small>
          </div>
        </div>
        <div className="toolbar-group">
          <button
            disabled={busy}
            onClick={() => void run('撤销', () => session.undo())}
            type="button"
          >
            撤销
          </button>
          <button
            disabled={busy}
            onClick={() => void run('重做', () => session.redo())}
            type="button"
          >
            重做
          </button>
          <button
            className={gizmoMode === 'translate' ? 'active' : ''}
            onClick={() => setGizmoMode('translate')}
            type="button"
          >
            移动
          </button>
          <button
            className={gizmoMode === 'rotate' ? 'active' : ''}
            onClick={() => setGizmoMode('rotate')}
            type="button"
          >
            旋转
          </button>
        </div>
        <div className="toolbar-group grow">
          <select onChange={(event) => setCreateType(event.currentTarget.value)} value={createType}>
            {session.nodeTypes.map((type) => (
              <option key={type.type} value={type.type}>
                {type.displayName}
              </option>
            ))}
          </select>
          <button
            disabled={busy || !createType}
            onClick={() =>
              void run('创建节点', async () =>
                selectNode(await session.createNode(createType, selectedId)),
              )
            }
            type="button"
          >
            创建
          </button>
          <button
            className="danger"
            disabled={busy || !selectedId}
            onClick={() =>
              void run('删除节点', async () => {
                if (!selectedId) return
                await session.deleteNode(selectedId)
                useViewer.getState().resetSelection()
              })
            }
            type="button"
          >
            删除
          </button>
        </div>
        <button
          disabled={busy}
          onClick={() =>
            void run('校验', async () => {
              await session.validate()
            })
          }
          type="button"
        >
          校验
        </button>
        <button className="primary" onClick={exportDocument} type="button">
          导出场景文档
        </button>
      </header>

      <div className="workspace-grid">
        <aside className="panel scene-panel">
          <div className="panel-title">
            <span>场景层级</span>
            <small>{Object.keys(snapshot.document.nodes).length} 个节点</small>
          </div>
          <SceneTree document={snapshot.document} onSelect={selectNode} selectedId={selectedId} />
        </aside>

        <section className="viewport-panel">
          <div className="viewport-badge">Pascal 0.9.2 · 场景版本 {snapshot.revision}</div>
          <PascalViewport
            mode={gizmoMode}
            onCommit={() => void run('提交 Gizmo', () => session.commitPascalChanges())}
            revision={snapshot.revision}
          />
        </section>

        <aside className="panel inspector-panel">
          <div className="panel-title">
            <span>属性</span>
            <small>适配器动态描述</small>
          </div>
          <Inspector
            components={session.componentTypes}
            document={snapshot.document}
            node={selectedNode}
            onPatch={applyPatch}
          />
        </aside>

        <section className="panel draft-panel">
          <div className="panel-title">
            <span>工作区 / 修改草稿</span>
            <small>{status}</small>
          </div>
          <div className="draft-summary">
            <span className={snapshot.validation?.valid === false ? 'invalid' : 'valid'}>
              {snapshot.validation
                ? snapshot.validation.valid
                  ? '校验通过'
                  : '校验失败'
                : '尚未校验'}
            </span>
            <span>{snapshot.drafts.length} 项修改</span>
          </div>
          <ol className="draft-list">
            {[...snapshot.drafts]
              .reverse()
              .slice(0, 5)
              .map((draft) => {
                const ghost = snapshot.ghostPreviews.find(
                  (preview) => preview.draft.id === draft.id,
                )
                return (
                  <li key={draft.id}>
                    <code>{draft.id}</code>
                    <span>{draft.source.detail ?? draft.source.kind}</span>
                    {ghost ? (
                      <small className="ghost-diff">
                        +{ghost.nodes.created.length} ~{ghost.nodes.updated.length} -
                        {ghost.nodes.deleted.length}
                      </small>
                    ) : (
                      <small />
                    )}
                    <em>{draftStatusLabel(draft.status)}</em>
                  </li>
                )
              })}
          </ol>
          {(snapshot.validation?.issues ?? []).slice(0, 4).map((issue) => (
            <div className={`issue ${issue.severity}`} key={`${issue.code}-${issue.path}`}>
              {issue.message}
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
