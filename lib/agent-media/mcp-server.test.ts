import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { MediaService } from './service'
import { configSchema, hash } from './contracts'

const data = (result: unknown) => (result as { structuredContent: Record<string, unknown> }).structuredContent

test('real stdio handshake, tools, operator approval, restart and resource retrieval', async () => {
  const root = mkdtempSync(join(tmpdir(), 'conjure-stdio-'))
  const config = configSchema.parse({ owner: 'protocol-fixture', brands: ['sample'], dataRoot: join(root, 'store'), allowPaid: true,
    dailyLimitMicros: 1000000, totalLimitMicros: 1000000, policyExpiresAt: new Date(Date.now() + 86400000).toISOString(),
    pricing: { currency: 'USD', source: 'https://example.com/fixture', reviewedBy: 'Fixture', checkedAt: new Date(Date.now() - 60000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(), reserves: { low: 100000, medium: 100000, high: 100000 }, referenceExtraMicros: 100000 } })
  const configPath = join(root, 'config.json'); writeFileSync(configPath, JSON.stringify(config))
  const operator = new MediaService(() => config, { generate: async () => { throw new Error('Operator cannot generate') } })
  const start = async () => {
    const transport = new StdioClientTransport({ command: process.execPath, args: ['--import', 'tsx', 'scripts/fixtures/media-mcp-server.ts', configPath], cwd: resolve('.'), stderr: 'pipe' })
    const client = new Client({ name: 'protocol-test', version: '1.0.0' }); await client.connect(transport); return client
  }
  let client = await start()
  try {
    const tools = (await client.listTools()).tools.map(t => t.name)
    assert.deepEqual(tools.sort(), ['generate_images', 'get_assets', 'get_operation', 'quote_media', 'register_reference'])
    assert.ok(!tools.some(name => name.includes('approve')))
    const quoted = await client.callTool({ name: 'quote_media', arguments: { brand: 'sample', prompt: 'Synthetic protocol card', model: 'gpt-image-2.5-flare', aspectRatio: '1:1', quality: 'medium' } })
    assert.ok(!quoted.isError)
    const quoteId = String(data(quoted).id), quote = operator.readQuote(quoteId)
    const args = { quoteId, inputHash: quote.inputHash, idempotencyKey: 'protocol-operation' }
    assert.equal((await client.callTool({ name: 'generate_images', arguments: args })).isError, true)
    await operator.approve(quoteId, hash(quote), 'Fixture operator')
    const generated = await client.callTool({ name: 'generate_images', arguments: args })
    assert.ok(!generated.isError); assert.equal(data(generated).state, 'completed')
    const operationId = String(data(generated).operationId)
    await client.close(); client = await start()
    const repeated = await client.callTool({ name: 'generate_images', arguments: args })
    assert.equal(data(repeated).operationId, operationId)
    const status = await client.callTool({ name: 'get_operation', arguments: { operationId } }); assert.equal(data(status).state, 'completed')
    const asset = await client.callTool({ name: 'get_assets', arguments: { assetId: operationId } })
    const uri = String(data(asset).uri), resource = await client.readResource({ uri })
    const first = resource.contents[0]; assert.ok('blob' in first)
    assert.equal(hash(Buffer.from(String(first.blob), 'base64')), data(asset).sha256)
    assert.equal(readFileSync(join(config.dataRoot, 'synthetic-calls.txt'), 'utf8'), 'fixture\n')
    const denied = await client.callTool({ name: 'quote_media', arguments: { ...quote.request, brand: 'foreign' } }); assert.equal(denied.isError, true)
    await assert.rejects(client.readResource({ uri: 'conjure://assets/' + 'a'.repeat(64) }))
  } finally { await client.close(); rmSync(root, { recursive: true, force: true, maxRetries: 3 }) }
})
