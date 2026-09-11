import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { type MediaConfig, type MediaRequest, hash } from './contracts'
import { MediaService } from './service'
import { conjureImageProvider } from './provider'

const NOW = new Date('2026-09-11T08:00:00.000Z')
const request: MediaRequest = { brand: 'sample', prompt: 'Synthetic sample card', model: 'gpt-image-2', aspectRatio: '1:1', quality: 'medium' }
async function fixture(t: test.TestContext) {
  const root = mkdtempSync(join(tmpdir(), 'conjure-media-'))
  t.after(() => rmSync(root, { recursive: true, force: true, maxRetries: 3 }))
  const config: MediaConfig = { owner: 'synthetic', brands: ['sample'], dataRoot: root, allowPaid: true,
    dailyLimitMicros: 300000, totalLimitMicros: 300000, policyExpiresAt: '2026-09-12T00:00:00.000Z',
    pricing: { currency: 'USD', source: 'https://example.com/synthetic-prices', reviewedBy: 'Fixture', checkedAt: '2026-09-10T00:00:00.000Z',
      expiresAt: '2026-09-12T00:00:00.000Z', reserves: { low: 50000, medium: 100000, high: 200000 }, referenceExtraMicros: 50000 } }
  let calls = 0, now = NOW
  const provider = { generate: async (_request: MediaRequest, size: string) => {
    calls++; const [width, height] = size.split('x').map(Number)
    return sharp({ create: { width, height, channels: 4, background: '#ff4400' } }).png().toBuffer()
  } }
  const service = new MediaService(() => config, provider, () => now)
  async function quoted(input = request) {
    const quote = await service.quote(input)
    await service.approve(quote.id, hash(quote), 'Fixture only')
    return { quoteId: quote.id, inputHash: quote.inputHash, idempotencyKey: 'sample-one' }
  }
  return { root, config, provider, service, quoted, get calls() { return calls }, advance: (date: Date) => { now = date } }
}

test('exact approved generation survives service restart with identical operation and PNG', async t => {
  const f = await fixture(t), args = await f.quoted()
  const first = await f.service.generate(args); assert.equal(first.state, 'completed'); assert.equal(f.calls, 1)
  const secondService = new MediaService(() => f.config, f.provider, () => NOW)
  const repeated = await secondService.generate(args)
  assert.deepEqual(repeated, first); assert.equal(f.calls, 1)
  const { bytes, asset } = await secondService.assetBytes(first.operationId)
  assert.equal(hash(bytes), asset.sha256)
  assert.equal(f.service.budget().totalMicros, 100000)
  const logs = readFileSync(join(f.root, first.operationId, 'reserved.json'), 'utf8')
  assert.ok(!logs.includes('base64')); assert.ok(!logs.includes('OPENAI_API_KEY'))
})
test('approval, exact input, enabled policy, expiry and price review guard paid entry', async t => {
  const f = await fixture(t), quote = await f.service.quote(request)
  const args = { quoteId: quote.id, inputHash: quote.inputHash, idempotencyKey: 'gates' }
  await assert.rejects(f.service.generate(args), /Human quote approval/)
  await assert.rejects(f.service.approve(quote.id, 'a'.repeat(64), 'Fixture'), /reviewed quote digest/)
  await f.service.approve(quote.id, hash(quote), 'Fixture')
  await assert.rejects(f.service.generate({ ...args, inputHash: 'b'.repeat(64) }), /Input hash/)
  f.config.allowPaid = false; await assert.rejects(f.service.generate(args), /disabled/); f.config.allowPaid = true
  f.config.pricing.reserves.medium++; await assert.rejects(f.service.generate(args), /pricing changed/); f.config.pricing.reserves.medium--
  f.advance(new Date('2026-09-11T09:00:00.000Z')); await assert.rejects(f.service.generate(args), /Quote expired/)
  assert.equal(f.calls, 0); assert.equal(f.service.budget().totalMicros, 0)
})
test('quote consumption, changed idempotent requests and total budget cannot purchase twice', async t => {
  const f = await fixture(t), first = await f.quoted(); await f.service.generate(first)
  await assert.rejects(f.service.generate({ ...first, idempotencyKey: 'another-key' }), /already been consumed/)
  const second = await f.quoted({ ...request, prompt: 'Second image' })
  await assert.rejects(f.service.generate(second), /another quote/)
  f.config.totalLimitMicros = 150000
  await assert.rejects(f.service.generate({ ...second, idempotencyKey: 'second-key' }), /budget exhausted/)
  assert.equal(f.calls, 1)
})
test('ambiguous provider result is retained and is never resubmitted after a restart', async t => {
  const f = await fixture(t); let calls = 0
  f.provider.generate = async () => { calls++; throw new Error('SECRET_PROVIDER_BODY') }
  const args = await f.quoted(), first = await f.service.generate(args)
  assert.equal(first.state, 'needs_reconciliation')
  const restarted = new MediaService(() => f.config, f.provider, () => NOW)
  assert.equal((await restarted.generate(args)).state, 'needs_reconciliation'); assert.equal(calls, 1)
  assert.ok(!readFileSync(join(f.root, first.operationId, 'failure.json'), 'utf8').includes('SECRET'))
  assert.equal(restarted.budget().totalMicros, 100000)
})
test('crash after reservation never resubmits; saved bytes recover a missing asset record', async t => {
  const f = await fixture(t), args = await f.quoted(), quote = f.service.readQuote(args.quoteId)
  const id = f.service.store.operationId(args.idempotencyKey)
  f.service.store.write('reserved.json', { id, quote, approvalId: quote.id, createdAt: NOW.toISOString() }, id)
  assert.equal((await f.service.generate(args)).state, 'needs_reconciliation'); assert.equal(f.calls, 0)
  const bytes = await f.provider.generate(request, quote.size)
  f.service.store.bytes([id, 'image.png'], bytes)
  assert.equal((await f.service.operation(id)).state, 'completed'); assert.equal(f.calls, 1)
})
test('concurrent submissions serialize before any provider call and then safely resume', async t => {
  const f = await fixture(t), args = await f.quoted(), original = f.provider.generate
  let release: () => void = () => {}; let started: () => void = () => {}
  const gate = new Promise<void>(r => { release = r }), entered = new Promise<void>(r => { started = r })
  f.provider.generate = async (...params) => { started(); await gate; return original(...params) }
  const pending = f.service.generate(args); await entered
  await assert.rejects(f.service.generate(args), /locked/)
  release(); await pending; await f.service.generate(args); assert.equal(f.calls, 1)
})
test('operator/brand access, revocation and asset corruption fail closed', async t => {
  const f = await fixture(t)
  assert.throws(() => new MediaService(() => ({ ...f.config, owner: 'other' }), f.provider), /another operator/)
  await assert.rejects(f.service.quote({ ...request, brand: 'other' }), /not authorized/)
  await assert.rejects(f.service.quote({ ...request, owner: 'other' }))
  const args = await f.quoted(); f.service.store.write(`revoked-${args.quoteId}.json`, {})
  await assert.rejects(f.service.generate(args), /revoked/); assert.equal(f.calls, 0)
  unlinkSync(join(f.root, `revoked-${args.quoteId}.json`))
  const op = await f.service.generate(args)
  f.config.brands = ['other']; await assert.rejects(f.service.operation(op.operationId), /not authorized/); f.config.brands = ['sample']
  writeFileSync(join(f.root, op.operationId, 'image.png'), 'corrupt')
  await assert.rejects(f.service.assetBytes(op.operationId), /integrity/); assert.equal(f.calls, 1)
})
test('registered references are bounded, hash-bound, brand-owned and never fetched by URL', async t => {
  const f = await fixture(t), bytes = await f.provider.generate(request, '1024x1024')
  const input = { brand: 'sample', pngBase64: bytes.toString('base64'), sha256: hash(bytes), source: 'Synthetic fixture', rights: 'owned' }
  const asset = await f.service.registerReference(input)
  assert.deepEqual(await f.service.registerReference(input), asset)
  const args = await f.quoted({ ...request, reference: { id: asset.id, sha256: asset.sha256 } })
  writeFileSync(join(f.root, `${asset.id}.png`), 'changed')
  await assert.rejects(f.service.generate(args), /Reference bytes changed/)
  await assert.rejects(f.service.registerReference({ ...input, pngBase64: 'https://127.0.0.1/secret' }))
  assert.equal(f.calls, 1)
})

test('actual cost above reservation consumes budget and keeps invoice amounts distinct', async t => {
  const f = await fixture(t), args = await f.quoted(), op = await f.service.generate(args)
  f.service.store.write('cost.json', { actualMicros: 250000, evidenceDigest: hash(Buffer.from('synthetic invoice')), reviewer: 'Fixture' }, op.operationId)
  assert.equal(f.service.budget().totalMicros, 250000)
  assert.equal((await f.service.operation(op.operationId)).actualCostMicros, 250000)
  const next = await f.quoted({ ...request, prompt: 'Another image' })
  await assert.rejects(f.service.generate({ ...next, idempotencyKey: 'new-operation' }), /budget exhausted/)
  assert.equal(f.calls, 1)
})

test('persistence failure after PNG write recovers on restart without repurchase', async t => {
  const f = await fixture(t), args = await f.quoted(), original = f.service.store.write.bind(f.service.store)
  f.service.store.write = (file, ...rest) => { if (file === 'asset.json') throw new Error('Simulated disk failure'); return original(file, ...rest) }
  await assert.rejects(f.service.generate(args), /Simulated disk failure/)
  assert.equal(f.calls, 1); assert.equal(f.service.budget().totalMicros, 100000)
  const restarted = new MediaService(() => f.config, f.provider, () => NOW)
  assert.equal((await restarted.generate(args)).state, 'completed'); assert.equal(f.calls, 1)
})

test('documented forward-slash Windows storage paths resolve consistently', async t => {
  const f = await fixture(t)
  f.config.dataRoot = f.root.replaceAll('\\', '/')
  const quote = await f.service.quote(request)
  assert.equal(quote.request.brand, 'sample'); assert.equal(f.calls, 0)
})

test('pre-reservation crash folders do not strand the budget or the next generation', async t => {
  const f = await fixture(t), args = await f.quoted(), id = f.service.store.operationId(args.idempotencyKey)
  mkdirSync(join(f.root, id))
  writeFileSync(join(f.root, id, 'reserved.json.00000000-0000-4000-8000-000000000000.tmp'), 'Interrupted reservation write')
  assert.equal(f.service.budget().totalMicros, 0)
  assert.equal((await f.service.generate(args)).state, 'completed')
  assert.equal(f.calls, 1)
  // Missing reservation with possible provider evidence must still fail closed.
  f.service.store.write('submitted.json', {}, 'a'.repeat(64))
  assert.throws(() => f.service.budget(), /incomplete|reservation/i)
})

test('unexpected provider dimensions retain paid bytes without accepting an asset or repurchasing', async t => {
  const f = await fixture(t), args = await f.quoted()
  const bytes = await sharp({ create: { width: 8, height: 8, channels: 4, background: '#123456' } }).png().toBuffer()
  let calls = 0
  f.provider.generate = async () => { calls++; return bytes }
  const op = await f.service.generate(args)
  assert.equal(op.state, 'needs_reconciliation'); assert.deepEqual(op.assets, [])
  assert.deepEqual(readFileSync(join(f.root, op.operationId, 'provider-response.bin')), bytes)
  assert.equal(op.retainedResponse, true)
  const restarted = new MediaService(() => f.config, f.provider, () => NOW)
  assert.equal((await restarted.generate(args)).state, 'needs_reconciliation')
  assert.equal(restarted.budget().totalMicros, 100000); assert.equal(calls, 1)
  await assert.rejects(restarted.assetBytes(op.operationId))
})

test('valid retained provider response promotes after image publication failure and restart', async t => {
  const f = await fixture(t), args = await f.quoted(), original = f.service.store.bytes.bind(f.service.store)
  f.service.store.bytes = (parts, bytes) => {
    if (parts.at(-1) === 'image.png') throw new Error('Synthetic image publication failure')
    return original(parts, bytes)
  }
  try { await f.service.generate(args) } catch (error) { assert.match(String(error), /Synthetic image publication failure/) }
  const id = f.service.store.operationId(args.idempotencyKey)
  const retained = readFileSync(join(f.root, id, 'provider-response.bin'))
  const restarted = new MediaService(() => f.config, f.provider, () => NOW)
  assert.equal((await restarted.generate(args)).state, 'completed')
  assert.deepEqual((await restarted.assetBytes(id)).bytes, retained)
  assert.equal(f.calls, 1)
})

test('missing provider credentials fail before consuming a quote or budget and permit configured retry', async t => {
  const f = await fixture(t), args = await f.quoted(), previous = process.env.OPENAI_API_KEY
  delete process.env.OPENAI_API_KEY
  t.after(() => { if (previous === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous })
  const bytes = await f.provider.generate(request, '1024x1024')
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => { calls++; return new Response(JSON.stringify({ data: [{ b64_json: bytes.toString('base64') }] })) })
  const service = new MediaService(() => f.config, conjureImageProvider, () => NOW)
  await assert.rejects(service.generate(args), /OPENAI_API_KEY|credentials/)
  assert.equal(service.budget().totalMicros, 0); assert.equal(calls, 0)
  process.env.OPENAI_API_KEY = 'synthetic-unit-test-key'
  assert.equal((await service.generate(args)).state, 'completed'); assert.equal(calls, 1)
})

test('submission uses freshly read disabled policy instead of the previous allowed snapshot', async t => {
  const f = await fixture(t), args = await f.quoted()
  let reads = 0
  const service = new MediaService(() => ({ ...structuredClone(f.config), allowPaid: ++reads < 3 }), f.provider, () => NOW)
  await assert.rejects(service.generate(args), /disabled/)
  assert.equal(service.budget().totalMicros, 0); assert.equal(f.calls, 0)
})
