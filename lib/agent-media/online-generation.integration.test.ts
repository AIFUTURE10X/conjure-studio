import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { hash } from './contracts'
import { onlinePool, onlineService } from './online-runtime'
import { processOnlineGeneration } from './online-generation'

const connectionString = process.env.POPCORN_DATABASE_URL

test('online workflow uses one provider call and delivers one verified file id', {
  skip: connectionString ? false : 'POPCORN_DATABASE_URL is required for the Neon integration',
}, async t => {
  const ownerId = randomUUID(), campaignId = `campaign-${randomUUID()}`
  const service = onlineService(), originalFetch = globalThis.fetch
  const image = await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#f4b942' } }).png().toBuffer()
  let providerCalls = 0, deliveredBytes = 0, completed = 0
  t.after(async () => {
    globalThis.fetch = originalFetch
    await onlinePool.query('DELETE FROM conjure_media.assets WHERE owner_id = $1', [ownerId])
    await onlinePool.query('DELETE FROM conjure_media.costs WHERE operation_id IN (SELECT id FROM conjure_media.operations WHERE owner_id = $1)', [ownerId])
    await onlinePool.query('DELETE FROM conjure_media.outbox WHERE operation_id IN (SELECT id FROM conjure_media.operations WHERE owner_id = $1)', [ownerId])
    await onlinePool.query('DELETE FROM conjure_media.operations WHERE owner_id = $1', [ownerId])
    await onlinePool.query('DELETE FROM conjure_media.approvals WHERE owner_id = $1', [ownerId])
    await onlinePool.query('DELETE FROM conjure_media.quotes WHERE owner_id = $1', [ownerId])
    await onlinePool.end()
  })
  globalThis.fetch = async (input, init) => {
    const url = String(input)
    if (url === 'https://api.openai.com/v1/images/generations') {
      providerCalls += 1
      return new Response(JSON.stringify({ data: [{ b64_json: image.toString('base64') }],
        usage: { input_tokens_details: { text_tokens: 50 }, output_tokens_details: { image_tokens: 439 } } }))
    }
    if (url.endsWith('/api/internal/generated-files/reserve')) {
      const body = JSON.parse(String(init?.body))
      assert.equal(body.ownerId, ownerId);assert.equal(body.campaignId, campaignId)
      return Response.json({ file: { id: '11111111-1111-4111-8111-111111111111' }, uploadUrl: 'http://127.0.0.1:9999/upload' })
    }
    if (url.endsWith('/upload')) {
      deliveredBytes = Buffer.from(init?.body as Uint8Array).length
      return Response.json({ url: 'https://synthetic.private.blob.vercel-storage.com/file.png' })
    }
    if (url.endsWith('/api/internal/generated-files/complete')) {
      completed += 1
      return Response.json({ file: { id: '11111111-1111-4111-8111-111111111111' } })
    }
    throw new Error(`Unexpected fetch ${url}`)
  }
  const quote = await service.createQuote({ operatorId: process.env.POPCORN_OPERATOR_ID, ownerId, campaignId,
    request: { brand: 'sample', prompt: 'Synthetic online generation', model: 'gpt-image-2.5-flare',
      aspectRatio: '1:1', quality: 'medium' },
    composition: { mode: 'concept', headline: 'Headline', body: 'Body', cta: 'Learn more' } })
  await service.approve({ quoteId: quote.id, quoteDigest: hash(quote), reviewer: 'Fixture' })
  const operation = await service.createOperation({ quoteId: quote.id, idempotencyKey: 'workflow-once' })
  assert.equal((await processOnlineGeneration(operation.id)).state, 'ready')
  assert.equal((await processOnlineGeneration(operation.id)).state, 'terminal')
  assert.equal(providerCalls, 1)
  assert.equal(deliveredBytes, image.length)
  assert.equal(completed, 1)
  const stored = await service.readOperation(operation.id)
  assert.equal(stored.state, 'ready')
  assert.ok(stored.asset_id)
  assert.ok(stored.actual_micros > 0)
})
