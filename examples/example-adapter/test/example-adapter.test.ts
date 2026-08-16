import { assertAdapterContract } from '@worldform/adapter-sdk'
import { AdapterHost, WorldformWorkspace } from '@worldform/workspace'
import { describe, expect, it } from 'vitest'
import { createExampleSceneDocument, exampleAdapter } from '../src/index.js'

describe('Worldform Example Adapter', () => {
  it('通过 SDK contract test', async () => {
    await expect(
      assertAdapterContract(exampleAdapter, {
        document: createExampleSceneDocument(),
        expectedValid: true,
      }),
    ).resolves.toBeUndefined()
  })

  it('提供 query capability、Patch capability 与 export target', async () => {
    const host = new AdapterHost(exampleAdapter)
    const document = createExampleSceneDocument()

    await expect(
      host.callCapability({ capabilityId: 'countObjects', input: {}, document }),
    ).resolves.toMatchObject({ output: { total: 2 } })

    const marker = await host.callCapability({
      capabilityId: 'createMarker',
      input: { id: 'marker', label: 'Review Point', position: [1, 2, 3] },
      document,
    })
    expect(marker.patches?.[0]).toMatchObject({ op: 'create', node: { id: 'marker' } })

    await expect(host.exportDocument('example-json', document)).resolves.toMatchObject({
      fileName: 'example-room.example.json',
      mediaType: 'application/json',
    })
  })

  it('Workspace 可挂载 Host、验证并应用 capability Patch', async () => {
    const host = new AdapterHost(exampleAdapter)
    const workspace = new WorldformWorkspace(createExampleSceneDocument(), {
      adapterSession: host,
    })
    const capability = await host.callCapability({
      capabilityId: 'createMarker',
      input: { id: 'marker', label: 'Review Point', position: [1, 2, 3] },
      document: workspace.getDocument(),
    })

    workspace.createDraft({
      id: 'capability-marker',
      baseRevision: workspace.getRevision(),
      source: { kind: 'adapter', detail: 'createMarker' },
      patches: capability.patches ?? [],
    })
    await workspace.applyDraft('capability-marker')

    expect(workspace.getDocument().nodes.marker?.type).toBe('example.marker')
    expect(workspace.getRevision()).toBe(1)
  })
})
