import { McpServer, type CallToolResult, type JSONObject } from '@modelcontextprotocol/server'
import type { SceneNode, SceneNodeOptionalKey } from '@worldform/core'
import * as z from 'zod/v4'
import type { WorldformMcpSession } from './session.js'

const vector3Schema = z.tuple([z.number(), z.number(), z.number()])
const quaternionSchema = z.tuple([z.number(), z.number(), z.number(), z.number()])
const transformSchema = z
  .object({
    position: vector3Schema,
    rotation: quaternionSchema,
    scale: vector3Schema,
  })
  .strict()

const jsonRecordSchema = z.record(z.string(), z.json())
const sceneNodeSchema = z
  .object({
    id: z.string().min(1),
    type: z.string().min(1),
    name: z.string().optional(),
    parentId: z.string().min(1).optional(),
    transform: transformSchema,
    components: jsonRecordSchema.optional(),
    references: jsonRecordSchema.optional(),
    tags: z.array(z.string()).optional(),
    metadata: jsonRecordSchema.optional(),
  })
  .strict()

const updateChangesSchema = sceneNodeSchema.omit({ id: true }).partial()
const unsetSchema = z.array(
  z.enum(['name', 'parentId', 'components', 'references', 'tags', 'metadata']),
)
const revisionSchema = z.number().int().nonnegative()

function toSceneNode(value: z.infer<typeof sceneNodeSchema>): SceneNode {
  return value as unknown as SceneNode
}

function toNodeChanges(value: z.infer<typeof updateChangesSchema>): Partial<Omit<SceneNode, 'id'>> {
  return value as unknown as Partial<Omit<SceneNode, 'id'>>
}

function successResult(value: unknown): CallToolResult {
  const normalized = JSON.parse(JSON.stringify(value)) as unknown
  const structuredContent = (
    typeof normalized === 'object' && normalized !== null && !Array.isArray(normalized)
      ? normalized
      : { value: normalized }
  ) as JSONObject
  return {
    content: [{ type: 'text', text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
  }
}

function errorResult(error: unknown): CallToolResult {
  const payload = {
    code:
      typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : error instanceof Error
          ? error.name
          : 'worldform.mcp_error',
    message: error instanceof Error ? error.message : String(error),
  }
  return {
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
    isError: true,
  }
}

async function safely(operation: () => unknown | Promise<unknown>): Promise<CallToolResult> {
  try {
    return successResult(await operation())
  } catch (error) {
    return errorResult(error)
  }
}

/** 使用官方 MCP v2 SDK 注册 Worldform 的受限 Workspace 工具面。 */
export function createWorldformMcpServer(session: WorldformMcpSession): McpServer {
  const server = new McpServer(
    { name: 'worldform', version: '1.0.0' },
    {
      instructions:
        '先调用 scene.get 读取 revision。所有 scene mutation 只创建 Draft；随后调用 change.preview，再由调用方明确 change.apply 或 change.discard。',
    },
  )

  server.registerTool(
    'scene.get',
    {
      title: '读取 Worldform 场景',
      description: '返回当前权威 SceneDocument、revision 与 DraftChange 列表。',
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => safely(() => session.getScene()),
  )

  server.registerTool(
    'scene.query',
    {
      title: '查询场景节点',
      description: '按 id、type、parentId 或名称子串查询当前正式场景，不读取文件系统。',
      inputSchema: z.object({
        id: z.string().optional(),
        type: z.string().optional(),
        parentId: z.string().optional(),
        nameIncludes: z.string().optional(),
      }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (input) =>
      safely(() => ({
        nodes: session.queryScene({
          ...(input.id === undefined ? {} : { id: input.id }),
          ...(input.type === undefined ? {} : { type: input.type }),
          ...(input.parentId === undefined ? {} : { parentId: input.parentId }),
          ...(input.nameIncludes === undefined ? {} : { nameIncludes: input.nameIncludes }),
        }),
      })),
  )

  server.registerTool(
    'scene.create',
    {
      title: '提议创建节点',
      description: '基于明确 revision 创建包含 create Patch 的 Draft，不立即修改正式场景。',
      inputSchema: z.object({
        changeId: z.string().min(1),
        baseRevision: revisionSchema,
        node: sceneNodeSchema,
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ changeId, baseRevision, node }) =>
      safely(() => session.createSceneNode(changeId, baseRevision, toSceneNode(node))),
  )

  server.registerTool(
    'scene.update',
    {
      title: '提议更新节点',
      description: '基于明确 revision 创建 update Patch Draft；unset 用于显式删除可选字段。',
      inputSchema: z.object({
        changeId: z.string().min(1),
        baseRevision: revisionSchema,
        id: z.string().min(1),
        changes: updateChangesSchema,
        unset: unsetSchema.optional(),
        rootIndex: z.number().int().nonnegative().optional(),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ changeId, baseRevision, id, changes, unset, rootIndex }) =>
      safely(() =>
        session.updateSceneNode({
          changeId,
          baseRevision,
          id,
          changes: toNodeChanges(changes),
          ...(unset ? { unset: unset as readonly SceneNodeOptionalKey[] } : {}),
          ...(rootIndex === undefined ? {} : { rootIndex }),
        }),
      ),
  )

  server.registerTool(
    'scene.delete',
    {
      title: '提议删除节点',
      description: '创建可审计的 delete Patch Draft；级联删除必须显式设置 cascade。',
      inputSchema: z.object({
        changeId: z.string().min(1),
        baseRevision: revisionSchema,
        id: z.string().min(1),
        cascade: z.boolean().default(false),
      }),
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    },
    async ({ changeId, baseRevision, id, cascade }) =>
      safely(() => session.deleteSceneNode(changeId, baseRevision, id, cascade)),
  )

  server.registerTool(
    'project.listCapabilities',
    {
      title: '列出项目能力',
      description: '通过 Workspace 列出已挂载 Project Adapter 的 capability。',
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => safely(() => ({ capabilities: session.listProjectCapabilities() })),
  )

  server.registerTool(
    'project.callCapability',
    {
      title: '调用项目能力',
      description: '调用项目真实 capability；返回的 Patch 只会创建 Draft，必须提供 changeId。',
      inputSchema: z.object({
        capabilityId: z.string().min(1),
        input: z.json(),
        baseRevision: revisionSchema,
        changeId: z.string().min(1).optional(),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async (input) =>
      safely(() =>
        session.callProjectCapability({
          capabilityId: input.capabilityId,
          input: input.input,
          baseRevision: input.baseRevision,
          ...(input.changeId === undefined ? {} : { changeId: input.changeId }),
        }),
      ),
  )

  server.registerTool(
    'project.validate',
    {
      title: '验证正式场景',
      description: '通过 Workspace 执行 Core + Adapter 统一验证。',
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => safely(() => session.validateProject()),
  )

  server.registerTool(
    'change.preview',
    {
      title: '验证并预览 Draft',
      description: '验证 Draft 并返回新增、修改、删除的结构化 Ghost diff 与候选文档。',
      inputSchema: z.object({ draftId: z.string().min(1) }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ draftId }) => safely(() => session.previewChange(draftId)),
  )

  server.registerTool(
    'change.apply',
    {
      title: '应用 Draft',
      description: '重新验证 Draft，通过后提交到 Workspace History 并增加 revision。',
      inputSchema: z.object({ draftId: z.string().min(1) }),
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    },
    async ({ draftId }) => safely(() => session.applyChange(draftId)),
  )

  server.registerTool(
    'change.discard',
    {
      title: '丢弃 Draft',
      description: '明确丢弃未应用 Draft，不修改正式 SceneDocument。',
      inputSchema: z.object({ draftId: z.string().min(1) }),
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    },
    async ({ draftId }) => safely(() => session.discardChange(draftId)),
  )

  server.registerTool(
    'history.undo',
    {
      title: '撤销场景变更',
      description: '调用 Workspace History undo，并增加 revision。',
      inputSchema: z.object({}),
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    },
    async () => safely(() => ({ result: session.undo() ?? null })),
  )

  server.registerTool(
    'history.redo',
    {
      title: '重做场景变更',
      description: '调用 Workspace History redo，并增加 revision。',
      inputSchema: z.object({}),
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    },
    async () => safely(() => ({ result: session.redo() ?? null })),
  )

  server.registerTool(
    'preview.play',
    {
      title: '显示 Ghost Preview',
      description: '激活对某个 Draft 的预览引用；状态仍来自同一 Workspace Draft。',
      inputSchema: z.object({ draftId: z.string().min(1) }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ draftId }) => safely(() => session.playPreview(draftId)),
  )

  server.registerTool(
    'preview.stop',
    {
      title: '停止 Ghost Preview',
      description: '清除活动预览引用，不改变 Draft 或正式文档。',
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => safely(() => session.stopPreview()),
  )

  return server
}
