import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import { hash } from './contracts'
import { OnlineMediaService, type OnlinePolicy } from './online-service'

const connectionString = process.env.POPCORN_TEST_DATABASE_URL
const NOW = new Date('2026-09-12T10:00:00.000Z')

test('online quote approval and operation reservation are exact, capped and idempotent in Postgres', {
  skip: connectionString ? false : 'POPCORN_TEST_DATABASE_URL is required for the Neon integration',
}, async t => {
  const pool = new Pool({ connectionString, max: 8 }), ownerId = randomUUID(), operatorId = `github:${randomUUID()}`
  const policy: OnlinePolicy = {
    operatorId, brands: ['sample'], allowPaid: false, dailyLimitMicros: 250000, totalLimitMicros: 250000,
    expiresAt: '2026-09-13T00:00:00.000Z',
    pricing: { checkedAt: '2026-09-12T00:00:00.000Z', expiresAt: '2026-09-13T00:00:00.000Z',
      source: 'https://example.com/synthetic-pricing', reserves: { low: 50000, medium: 100000, high: 200000 },
      referenceExtraMicros: 50000 },
  }
  const service = new OnlineMediaService(pool, policy, () => NOW)
  t.after(async () => {
    await pool.query('DELETE FROM conjure_media.costs WHERE operation_id IN (SELECT id FROM conjure_media.operations WHERE owner_id = $1)', [ownerId])
    await pool.query('DELETE FROM conjure_media.outbox WHERE operation_id IN (SELECT id FROM conjure_media.operations WHERE owner_id = $1)', [ownerId])
    await pool.query('DELETE FROM conjure_media.operations WHERE owner_id = $1', [ownerId])
    await pool.query('DELETE FROM conjure_media.approvals WHERE owner_id = $1', [ownerId])
    await pool.query('DELETE FROM conjure_media.quotes WHERE owner_id = $1', [ownerId])
    await pool.end()
  })
  const request = { operatorId, ownerId, campaignId: 'campaign-one', request: {
    brand: 'sample', prompt: 'Synthetic still ad', model: 'gpt-image-2.5-flare' as const,
    aspectRatio: '4:5' as const, quality: 'medium' as const,
  }, composition: { mode: 'concept' as const, headline: 'Headline', body: 'Body', cta: 'Learn more' } }
  const quote = await service.createQuote(request)
  assert.equal(quote.size, '1232x1536')
  assert.equal(quote.reservedMicros, 100000)
  await assert.rejects(service.approve({ quoteId: quote.id, quoteDigest: 'a'.repeat(64), reviewer: 'Phil' }), /reviewed quote/)
  const approval = await service.approve({ quoteId: quote.id, quoteDigest: hash(quote), reviewer: 'Phil' })
  assert.equal(approval.quoteId, quote.id)
  await assert.rejects(service.createOperation({ quoteId: quote.id, idempotencyKey: 'operation-one' }), /disabled/)

  policy.allowPaid = true
  const enabled = new OnlineMediaService(pool, policy, () => NOW)
  await assert.rejects(enabled.createOperation({ quoteId: quote.id, idempotencyKey: 'operation-one' }), /pricing changed/)
  const enabledQuote = await enabled.createQuote(request)
  await enabled.approve({ quoteId: enabledQuote.id, quoteDigest: hash(enabledQuote), reviewer: 'Phil' })
  const operation = await enabled.createOperation({ quoteId: enabledQuote.id, idempotencyKey: 'operation-one' })
  const repeated = await enabled.createOperation({ quoteId: enabledQuote.id, idempotencyKey: 'operation-one' })
  assert.equal(repeated.id, operation.id)
  const rows = await pool.query(`
    SELECT
      (SELECT count(*)::int FROM conjure_media.operations WHERE owner_id = $1) AS operations,
      (SELECT count(*)::int FROM conjure_media.outbox AS outbox JOIN conjure_media.operations AS operation
        ON operation.id = outbox.operation_id WHERE operation.owner_id = $1) AS outbox,
      (SELECT count(*)::int FROM conjure_media.costs AS cost JOIN conjure_media.operations AS operation
        ON operation.id = cost.operation_id WHERE operation.owner_id = $1) AS costs
  `, [ownerId])
  assert.deepEqual(rows.rows[0], { operations: 1, outbox: 1, costs: 1 })

  const secondQuote = await enabled.createQuote({ ...request, request: { ...request.request, prompt: 'Second ad' } })
  await enabled.approve({ quoteId: secondQuote.id, quoteDigest: hash(secondQuote), reviewer: 'Phil' })
  await assert.rejects(Promise.all([
    enabled.createOperation({ quoteId: secondQuote.id, idempotencyKey: 'operation-two' }),
    enabled.createOperation({ quoteId: secondQuote.id, idempotencyKey: 'operation-three' }),
  ]), /approval|budget|idempotency|duplicate/i)
  const finalCount = await pool.query('SELECT count(*)::int AS count FROM conjure_media.operations WHERE owner_id = $1', [ownerId])
  assert.equal(finalCount.rows[0].count, 2)
})
