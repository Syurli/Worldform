import { describe, expect, it } from 'vitest'
import { loadEditorProject } from '../src/project-loader.js'

const adapterModule = `data:text/javascript,${encodeURIComponent(`
  const empty = () => []
  export default {
    manifest: {
      id: 'external.adapter',
      displayName: 'External Adapter',
      adapterApiVersion: '1.0.0',
      sceneSchemaVersion: '1.0.0',
      version: '1.0.0'
    },
    listNodeTypes: () => [{ type: 'external.item', displayName: '外部项目节点', components: [] }],
    listComponentTypes: empty,
    listValidators: empty,
    listCapabilities: empty,
    validateDocument: () => ({ valid: true, issues: [] }),
    callCapability: async () => ({}),
    listExportTargets: empty,
    exportDocument: async () => ({ fileName: 'external.json', mediaType: 'application/json', content: '{}' })
  }
`)}`
const sceneUrl = `data:application/json,${encodeURIComponent(
  JSON.stringify({
    id: 'external-scene',
    formatVersion: '1.0.0',
    projectAdapterId: 'external.adapter',
    projectSchemaVersion: '1.0.0',
    nodes: {},
    rootNodeIds: [],
    resources: {},
  }),
)}`

describe('Editor 外部项目启动配置', () => {
  it('在没有参数时保留 Example 开发入口', async () => {
    await expect(loadEditorProject('', 'http://127.0.0.1:4173/')).resolves.toBeUndefined()
  })

  it('从运行时 URL 加载 Adapter descriptor 与 SceneDocument', async () => {
    const search = `?adapter=${encodeURIComponent(adapterModule)}&scene=${encodeURIComponent(sceneUrl)}`
    const project = await loadEditorProject(search, 'http://127.0.0.1:4173/')
    expect(project?.adapter.manifest.id).toBe('external.adapter')
    expect(project?.adapter.listNodeTypes()[0]?.displayName).toBe('外部项目节点')
    expect(project?.document.id).toBe('external-scene')
  })

  it('拒绝只有一半的外部项目配置', async () => {
    await expect(
      loadEditorProject('?scene=scene.json', 'http://127.0.0.1:4173/'),
    ).rejects.toThrow('同时提供 adapter 与 scene')
  })
})
