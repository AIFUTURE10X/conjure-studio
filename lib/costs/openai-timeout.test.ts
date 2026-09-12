import assert from 'node:assert/strict'
import { test } from 'node:test'
import { generateOpenAIImage, OpenAITimeoutError } from '../openai-image-client'
import { setProviderUsageSink, type ProviderUsageRow } from './record'

/**
 * Issue #50, Test expectations: "a timeout error from fetchOpenAI → row status
 * timeout, confidence unknown, cost_usd equal to the list estimate for the
 * requested size/quality". Exercises the real client with `fetch` stubbed to
 * abort the way AbortSignal.timeout does.
 */
test('our own timeout after sending records a priced estimate with confidence unknown', async () => {
  const rows: ProviderUsageRow[] = []
  setProviderUsageSink({ insert: async (row) => { rows.push(row) } })
  const originalFetch = globalThis.fetch
  const originalKey = process.env.OPENAI_API_KEY
  process.env.OPENAI_API_KEY = 'test-key'
  globalThis.fetch = (async () => {
    const error = new Error('The operation was aborted due to timeout')
    error.name = 'TimeoutError'
    throw error
  }) as typeof fetch
  try {
    await assert.rejects(
      () => generateOpenAIImage({ prompt: 'a leaf', aspectRatio: '1:1', imageSize: '1K', imageQuality: 'medium' }),
      (error: unknown) => error instanceof OpenAITimeoutError,
    )
    assert.equal(rows.length, 1)
    assert.equal(rows[0].status, 'timeout')
    assert.equal(rows[0].confidence, 'unknown')
    // 1024×1024 medium on 2.5 Flare = 439 image output tokens at $30/1M.
    assert.equal(rows[0].cost_usd, Math.round(439 * 30 / 1_000_000 * 1e6) / 1e6)
    assert.equal(rows[0].units.image_tokens_out, 439)
  } finally {
    globalThis.fetch = originalFetch
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY
    else process.env.OPENAI_API_KEY = originalKey
    setProviderUsageSink(null)
  }
})
