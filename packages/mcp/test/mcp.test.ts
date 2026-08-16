import { Client } from '@modelcontextprotocol/client'
import { InMemoryTransport } from '@modelcontextprotocol/server'
import { createExampleSceneDocument, exampleAdapter } from '@worldform/example-adapter'
import { IDENTITY_TRANSFORM, RevisionConflictError, type SceneNode } from '@worldform/core'
import { AdapterHost, WorldformWorkspace } from '@worldform/workspace'
import { describe, expect, it } from 'vitest'
import { createWorldformMcpServer, WorldformMcpSession } from '../src/index.js'

function createMarker(id: string): SceneNode {
  return {
    id,
    type: 'example.marker',
    name: id,
    transform: IDENTITY_TRANSFORM,
    components: {
      'example.presentation': { label: id, visible: true, tone: 'warm' },
    },
  }
}

async function createSession() {
  const host = new AdapterHost(exampleAdapter)
  await host.initialize()
  const workspace = new WorldformWorkspace(createExampleSceneDocument(), {
    adapterSession: host,
  })
  return { host, workspace, session: new WorldformMcpSession(workspace) }
}

describe('WorldformMcpSession', () => {
  it('完成读取 → Draft → Validate/Ghost Preview → Apply → Undo', async () => {
    const { host, workspace, session } = await createSession()
    try {
      const draft = session.createSceneNode('agent-create', 0, createMarker('agent-marker'))
      expect(draft.status).toBe('preview')
      expect(workspace.getDocument().nodes['agent-marker']).toBeUndefined()

      const ghost = await session.previewChange('agent-create')
      expect(ghost.draft.validation?.valid).toBe(true)
      expect(ghost.nodes.created.map((node) => node.id)).toEqual(['agent-marker'])
      expect(workspace.getRevision()).toBe(0)

      const applied = await session.applyChange('agent-create')
      expect(applied.revision).toBe(1)
      expect(workspace.getDocument().nodes['agent-marker']).toBeDefined()

      expect(session.undo()?.revision).toBe(2)
      expect(workspace.getDocument().nodes['agent-marker']).toBeUndefined()
      expect(session.redo()?.revision).toBe(3)
      expect(workspace.getDocument().nodes['agent-marker']).toBeDefined()
    } finally {
      await host.dispose()
    }
  })

  it('立即拒绝过期 baseRevision，且 discard 不污染正式场景', async () => {
    const { host, workspace, session } = await createSession()
    try {
      session.createSceneNode('current', 0, createMarker('current'))
      await session.applyChange('current')

      expect(() => session.createSceneNode('stale', 0, createMarker('stale'))).toThrow(
        RevisionConflictError,
      )

      session.deleteSceneNode('delete-zone', 1, 'zone')
      expect(session.discardChange('delete-zone').status).toBe('discarded')
      expect(workspace.getDocument().nodes.zone).toBeDefined()
    } finally {
      await host.dispose()
    }
  })

  it('Capability 返回的 Patch 仍只进入 Draft，并可驱动活动 Ghost 状态', async () => {
    const { host, workspace, session } = await createSession()
    const states: boolean[] = []
    session.subscribePreview((state) => states.push(state.active))
    try {
      const result = await session.callProjectCapability({
        capabilityId: 'createMarker',
        input: { id: 'capability-marker', label: 'Capability', position: [1, 2, 3] },
        baseRevision: 0,
        changeId: 'capability-draft',
      })

      expect(result.draft?.status).toBe('preview')
      expect(workspace.getDocument().nodes['capability-marker']).toBeUndefined()
      const state = await session.playPreview('capability-draft')
      expect(state.preview?.nodes.created[0]?.id).toBe('capability-marker')
      session.stopPreview()
      expect(states).toEqual([true, false])
    } finally {
      await host.dispose()
    }
  })
})

describe('官方 MCP 协议接线', () => {
  it('通过 InMemoryTransport 发现并调用结构化工具', async () => {
    const { host, workspace, session } = await createSession()
    const server = createWorldformMcpServer(session)
    const client = new Client({ name: 'worldform-test', version: '1.0.0' })
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    await server.connect(serverTransport)
    await client.connect(clientTransport)

    try {
      const tools = await client.listTools()
      expect(tools.tools.map((tool) => tool.name)).toEqual(
        expect.arrayContaining([
          'scene.get',
          'scene.create',
          'project.callCapability',
          'change.preview',
          'change.apply',
          'history.undo',
        ]),
      )
      expect(tools.tools).toHaveLength(15)

      const created = await client.callTool({
        name: 'scene.create',
        arguments: { changeId: 'protocol-create', baseRevision: 0, node: createMarker('protocol') },
      })
      expect(created.isError).not.toBe(true)
      expect(workspace.getDocument().nodes.protocol).toBeUndefined()

      const previewed = await client.callTool({
        name: 'change.preview',
        arguments: { draftId: 'protocol-create' },
      })
      expect(previewed.isError).not.toBe(true)
      expect(JSON.stringify(previewed.structuredContent)).toContain('protocol')

      const applied = await client.callTool({
        name: 'change.apply',
        arguments: { draftId: 'protocol-create' },
      })
      expect(applied.isError).not.toBe(true)
      expect(workspace.getRevision()).toBe(1)

      const stale = await client.callTool({
        name: 'scene.create',
        arguments: { changeId: 'stale', baseRevision: 0, node: createMarker('stale') },
      })
      expect(stale.isError).toBe(true)
      expect(workspace.getDocument().nodes.stale).toBeUndefined()
    } finally {
      await client.close()
      await server.close()
      await host.dispose()
    }
  })
})
