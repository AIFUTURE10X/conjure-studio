import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildProviderUsageRow,
  recordProviderUsage,
  setProviderUsageSink,
  withUsageContext,
  type ProviderUsageRow,
} from './record'
import { defaultImageOutputTokens } from './provider-rates'

const IMAGE = { provider: 'openai' as const, model: 'gpt-image-2.5-flare', operation: 'image-generate' as const }

test('a failing insert never throws and logs with the [provider-usage] prefix', async () => {
  const logged: string[] = []
  const original = console.error
  console.error = (...args: unknown[]) => { logged.push(args.map(String).join(' ')) }
  setProviderUsageSink({ insert: async () => { throw new Error('connection refused') } })
  try {
    const row = await recordProviderUsage({ ...IMAGE, status: 'succeeded', units: { image_tokens_out: 439 }, exact: true })
    assert.ok(row, 'the row is still built and returned')
    assert.ok(logged.some((line) => line.startsWith('[provider-usage]')), `expected a [provider-usage] log line, got: ${logged.join(' | ')}`)
  } finally {
    console.error = original
    setProviderUsageSink(null)
  }
})

test('withUsageContext attributes rows to the feature and user; no context → unknown', async () => {
  const rows: ProviderUsageRow[] = []
  setProviderUsageSink({ insert: async (row) => { rows.push(row) } })
  try {
    await withUsageContext('generate-image', 'user-x', async () => {
      await recordProviderUsage({ ...IMAGE, status: 'succeeded', units: { image_tokens_out: 439 }, exact: true })
    })
    await recordProviderUsage({ ...IMAGE, status: 'succeeded', units: { image_tokens_out: 439 }, exact: true })
    assert.equal(rows[0].feature, 'generate-image')
    assert.equal(rows[0].user_id, 'user-x')
    assert.equal(rows[1].feature, 'unknown')
    assert.equal(rows[1].user_id, null)
  } finally {
    setProviderUsageSink(null)
  }
})

test('provider-reported usage is exact; a computed estimate is rate', () => {
  const exact = buildProviderUsageRow({ ...IMAGE, status: 'succeeded', units: { text_tokens_in: 10, image_tokens_out: 439 }, exact: true })
  assert.equal(exact.confidence, 'exact')
  assert.equal(exact.cost_usd, Math.round((10 * 5 + 439 * 30) / 1_000_000 * 1e6) / 1e6)
  assert.equal(exact.unit_prices.image_token_out, 30 / 1_000_000)
  const rate = buildProviderUsageRow({ ...IMAGE, status: 'succeeded', units: { image_tokens_out: 439 } })
  assert.equal(rate.confidence, 'rate')
})

test('a timeout after sending records the list-rate estimate with confidence unknown', () => {
  const requested = { image_tokens_out: defaultImageOutputTokens('gpt-image-2.5-flare', 'medium', '1024x1024'), quality: 'medium' }
  const row = buildProviderUsageRow({ ...IMAGE, status: 'timeout', units: requested, error: 'OpenAI request timed out' })
  assert.equal(row.status, 'timeout')
  assert.equal(row.confidence, 'unknown')
  assert.equal(row.cost_usd, Math.round(439 * 30 / 1_000_000 * 1e6) / 1e6)
})

test('a provider error costs nothing; an unknown model is unpriced, never 0', () => {
  const failed = buildProviderUsageRow({ ...IMAGE, status: 'failed', units: { image_tokens_out: 439 }, error: 'HTTP 500' })
  assert.equal(failed.cost_usd, 0)
  assert.equal(failed.error, 'HTTP 500')
  const unpriced = buildProviderUsageRow({ provider: 'fal', model: 'fal-ai/not-a-model', operation: 'video', status: 'succeeded', units: { seconds: 5 } })
  assert.equal(unpriced.cost_usd, null)
  assert.equal(unpriced.confidence, 'unpriced')
})

test('a priced model with no billable units records unknown with a null cost, not $0', () => {
  const row = buildProviderUsageRow({ provider: 'fal', model: 'fal-ai/kling-video/lipsync/audio-to-video', operation: 'lipsync', status: 'succeeded', units: {} })
  assert.equal(row.cost_usd, null)
  assert.equal(row.confidence, 'unknown')
  assert.equal(row.rate_effective_from, '2025-01-01', 'the rate was found; only the units were missing')
})

test('without a database URL the recorder is a no-op that still returns the row', async () => {
  const saved = process.env.NEON_DATABASE_URL
  delete process.env.NEON_DATABASE_URL
  try {
    const row = await recordProviderUsage({ ...IMAGE, status: 'succeeded', units: { image_tokens_out: 439 }, exact: true })
    assert.ok(row)
  } finally {
    if (saved !== undefined) process.env.NEON_DATABASE_URL = saved
  }
})
