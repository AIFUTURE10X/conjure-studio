import test from 'node:test'
import assert from 'node:assert/strict'
import { conjureImageProvider } from './provider'

test('MCP provider reuses Conjure image service for text and reference inputs with no network', async () => {
  const originalFetch = globalThis.fetch, originalKey = process.env.OPENAI_API_KEY
  const calls: { url: string; init?: RequestInit }[] = []
  process.env.OPENAI_API_KEY = 'synthetic-unit-test-key'
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init })
    return new Response(JSON.stringify({ data: [{ b64_json: Buffer.from('synthetic-provider-result').toString('base64') }] }), { status: 200 })
  }
  try {
    const request = { brand: 'sample', model: 'gpt-image-2' as const, prompt: 'Exact approved copy', aspectRatio: '1:1' as const, quality: 'medium' as const }
    assert.equal((await conjureImageProvider.generate(request, '1024x1024')).toString(), 'synthetic-provider-result')
    assert.equal(calls[0].url, 'https://api.openai.com/v1/images/generations')
    assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { model: 'gpt-image-2', prompt: request.prompt, n: 1, size: '1024x1024', quality: 'medium', output_format: 'png' })
    await conjureImageProvider.generate(request, '1024x1024', Buffer.from('synthetic-reference'))
    assert.equal(calls[1].url, 'https://api.openai.com/v1/images/edits')
    const form = calls[1].init?.body as FormData
    assert.equal(form.get('prompt'), request.prompt); assert.equal(form.get('size'), '1024x1024')
    assert.equal(Buffer.from(await (form.get('image[]') as File).arrayBuffer()).toString(), 'synthetic-reference')
    assert.equal(calls.length, 2)
  } finally {
    globalThis.fetch = originalFetch
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY
    else process.env.OPENAI_API_KEY = originalKey
  }
})

test('slow text and reference jobs finish after 150 seconds without premature timeout', async t => {
  const key = process.env.OPENAI_API_KEY
  process.env.OPENAI_API_KEY = 'synthetic-unit-test-key'
  t.after(() => { if (key === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = key })
  t.mock.method(AbortSignal, 'timeout', (ms: number) => {
    const controller = new AbortController()
    if (ms <= 150_000) controller.abort(new DOMException('Synthetic 150-second job', 'TimeoutError'))
    return controller.signal
  })
  t.mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
    init.signal?.throwIfAborted()
    return new Response(JSON.stringify({ data: [{ b64_json: Buffer.from('slow-complete').toString('base64') }] }))
  })
  const request = { brand: 'sample', model: 'gpt-image-2' as const, prompt: 'Slow fixture', aspectRatio: '1:1' as const, quality: 'high' as const }
  for (const reference of [undefined, Buffer.from('synthetic-reference')]) {
    assert.equal((await conjureImageProvider.generate(request, '1024x1024', reference)).toString(), 'slow-complete')
  }
})
