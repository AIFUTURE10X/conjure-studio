import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { imageRequest, MediaError, sha256 } from './contracts'
import { MediaService, generationArgs, referenceArgs } from './service'

export function createMediaServer(service: MediaService) {
  const server = new McpServer({ name: 'conjure-studio-media', version: '0.1.0' })
  const run = async (work: () => Promise<object>) => {
    try {
      const output = await work()
      return { content: [{ type: 'text' as const, text: JSON.stringify(output) }], structuredContent: { ...output } }
    } catch (error) {
      const message = error instanceof MediaError ? error.message : 'Conjure could not complete this operation. Check configuration or restore consistent state; no automatic paid retry.'
      return { isError: true, content: [{ type: 'text' as const, text: message }] }
    }
  }
  server.registerTool('quote_media', {
    description: 'Quote one Conjure image from a brand-approved brief. Writes an expiring quote; never calls a paid provider. Inspect the reservation and get separate human approval.',
    inputSchema: imageRequest,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, args => run(() => service.quote(args)))
  server.registerTool('generate_images', {
    description: 'Generate exactly one previously quoted and operator-approved image. Can incur the approved charge. The same idempotency key never resubmits. Unknown outcomes require reconciliation.',
    inputSchema: generationArgs,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, args => run(() => service.generate(args)))
  server.registerTool('get_operation', {
    description: 'Inspect a known operation and recover already stored assets. Never generates or resubmits images.',
    inputSchema: z.object({ operationId: sha256 }).strict(),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, args => run(() => service.operation(args.operationId)))
  server.registerTool('get_assets', {
    description: 'Read metadata for one known, operator-owned generated asset. Retrieve its original PNG through the returned MCP resource URI. No library enumeration.',
    inputSchema: z.object({ assetId: sha256 }).strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, args => run(async () => ({ ...(await service.asset(args.assetId)), uri: `conjure://assets/${args.assetId}` })))
  server.registerTool('register_reference', {
    description: 'Store a rights-cleared local PNG in Conjure agent storage for a later quote. No external URL fetching and no paid generation. Keep binary content out of textual run logs.',
    inputSchema: referenceArgs,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, args => run(() => service.registerReference(args)))
  server.registerResource('generated-png', new ResourceTemplate('conjure://assets/{id}', { list: undefined }), { mimeType: 'image/png' }, async (uri, variables) => {
    try {
      const { bytes } = await service.assetBytes(sha256.parse(variables.id))
      return { contents: [{ uri: uri.href, mimeType: 'image/png', blob: bytes.toString('base64') }] }
    } catch { throw new Error('Asset is unavailable or not authorized') }
  })
  return server
}
