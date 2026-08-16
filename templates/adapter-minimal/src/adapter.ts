import {
  WORLDFORM_ADAPTER_API_VERSION,
  type ProjectCapabilityRequest,
  type ProjectCapabilityResult,
  type WorldformProjectAdapter,
} from '@worldform/adapter-api'
import {
  defineComponent,
  defineNodeType,
  defineProjectAdapter,
  validateDocumentDescriptors,
} from '@worldform/adapter-sdk'
import { serializeSceneDocument } from '@worldform/core'

const components = [
  defineComponent({
    id: 'hello.label',
    displayName: '问候内容',
    properties: [
      {
        id: 'message',
        label: '文本',
        type: 'string',
        required: true,
        defaultValue: 'Hello Worldform',
      },
    ],
  }),
] as const

const nodeTypes = [
  defineNodeType({
    type: 'hello.object',
    displayName: 'Hello Object',
    components: ['hello.label'],
    preview: { kind: 'marker', color: '#7b8cff' },
  }),
] as const

async function callCapability(
  request: ProjectCapabilityRequest,
): Promise<ProjectCapabilityResult> {
  if (request.capabilityId !== 'countHelloObjects') {
    throw new Error(`未知 capability：${request.capabilityId}`)
  }
  return {
    output: {
      count: Object.values(request.document.nodes).filter((node) => node.type === 'hello.object')
        .length,
    },
  }
}

/** 最小第三方 Adapter；项目真实算法应在这里调用项目代码，而不是复制进 Worldform。 */
export const helloAdapter: WorldformProjectAdapter = defineProjectAdapter({
  manifest: {
    id: 'hello.adapter',
    displayName: 'Hello Worldform Adapter',
    adapterApiVersion: WORLDFORM_ADAPTER_API_VERSION,
    sceneSchemaVersion: '1.0.0',
    version: '0.1.0',
  },
  listNodeTypes: () => nodeTypes,
  listComponentTypes: () => components,
  listValidators: () => [{ id: 'descriptor', displayName: 'Descriptor Validator' }],
  listCapabilities: () => [
    { id: 'countHelloObjects', title: 'Count Hello Objects', mutatesScene: false },
  ],
  validateDocument: (document) =>
    validateDocumentDescriptors({
      adapterId: 'hello.adapter',
      document,
      nodeTypes,
      components,
    }),
  callCapability,
  listExportTargets: () => [{ id: 'hello-json', displayName: 'Hello JSON' }],
  async exportDocument(targetId, document) {
    if (targetId !== 'hello-json') throw new Error(`未知 export target：${targetId}`)
    return {
      fileName: `${document.id}.hello.json`,
      mediaType: 'application/json',
      content: serializeSceneDocument(document),
    }
  },
})

export default helloAdapter
