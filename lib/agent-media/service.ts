import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { z } from 'zod'
import { getOpenAIImageSize } from '../openai-image-client'
import { type Asset, type MediaConfig, type Operation, type Provider, type Quote, configSchema, hash, imageRequest, requireMedia, safeId, sha256 } from './contracts'
import { MediaStore } from './store'
import { describePng, loadReference, saveGenerated } from './images'

export const generationArgs = z.object({ quoteId: sha256, inputHash: sha256, idempotencyKey: safeId }).strict()
export const referenceArgs = z.object({ brand: safeId, pngBase64: z.string().min(1).max(10_666_668), sha256,
  source: z.string().min(1).max(500), rights: z.enum(['owned', 'licensed']), }).strict()
export class MediaService {
  readonly store: MediaStore
  private active = new Set<string>()
  constructor(readonly loadConfig: () => MediaConfig, readonly provider: Provider, readonly clock = () => new Date()) {
    const config = configSchema.parse(loadConfig())
    this.store = new MediaStore(config.dataRoot, config.owner)
  }
  config(brand: string, fresh = false) {
    const config = configSchema.parse(this.loadConfig())
    requireMedia(config.owner === this.store.owner && resolve(config.dataRoot) === this.store.root, 'Operator/store configuration changed; restart with the correct store')
    requireMedia(config.brands.includes(brand), 'Brand is not authorized')
    if (fresh) {
      const now = this.clock().getTime()
      requireMedia(Date.parse(config.policyExpiresAt) > now, 'Operator policy expired')
      requireMedia(Date.parse(config.pricing.checkedAt) <= now && Date.parse(config.pricing.expiresAt) > now, 'Pricing review expired or future dated')
    }
    return config
  }
  async quote(raw: unknown): Promise<Quote> {
    const request = imageRequest.parse(raw), config = this.config(request.brand, true)
    await loadReference(this.store, request)
    const reserveMicros = config.pricing.reserves[request.quality] + (request.reference ? config.pricing.referenceExtraMicros : 0)
    requireMedia(reserveMicros <= config.dailyLimitMicros && reserveMicros <= config.totalLimitMicros, 'Quote exceeds the configured budget')
    const size = getOpenAIImageSize(request.aspectRatio, '1K')
    const expiresAt = new Date(Math.min(this.clock().getTime() + 30 * 60_000, Date.parse(config.pricing.expiresAt), Date.parse(config.policyExpiresAt))).toISOString()
    const body = { version: 1 as const, owner: config.owner, request, inputHash: hash(request), size, reserveMicros,
      currency: 'USD' as const, expiresAt, policyHash: hash(config.pricing), pricingSource: config.pricing.source,
      costMeaning: 'Operator-reviewed USD reservation; not a provider-guaranteed maximum or actual invoice. Unknown outcomes retain the entire reservation.' }
    const quote = { ...body, id: hash(body) }
    const path = `quote-${quote.id}.json`
    await this.store.lock(async () => { if (!this.store.exists(path)) this.store.write(path, quote) })
    return quote
  }
  readQuote(id: string) {
    sha256.parse(id)
    const quote = this.store.read<Quote>(`quote-${id}.json`)
    const { id: storedId, ...body } = quote
    requireMedia(storedId === id && hash(body) === id && quote.inputHash === hash(quote.request), 'Quote integrity check failed')
    return quote
  }
  async approve(quoteId: string, expectedHash: string, reviewer: string) {
    requireMedia(reviewer.trim().length > 0 && reviewer.length <= 100, 'Reviewer required')
    return this.store.lock(async () => {
      const quote = this.readQuote(quoteId); this.config(quote.request.brand, true)
      requireMedia(expectedHash === hash(quote), 'Approval must match the reviewed quote digest')
      requireMedia(Date.parse(quote.expiresAt) > this.clock().getTime(), 'Quote expired')
      const approval = { quoteId, quoteHash: expectedHash, owner: this.store.owner, reviewer, approvedAt: this.clock().toISOString(), expiresAt: quote.expiresAt }
      this.store.write(`approval-${quoteId}.json`, approval)
      return approval
    })
  }
  operations() {
    return this.store.list().map(id => {
      const op = this.store.read<Operation>(id, 'reserved.json')
      requireMedia(op.id === id && op.quote.owner === this.store.owner, 'Operation ledger integrity failure')
      return op
    })
  }
  budget() {
    let dailyMicros = 0, totalMicros = 0
    const day = this.clock().toISOString().slice(0, 10)
    for (const op of this.operations()) {
      const settled = this.store.exists(op.id, 'cost.json') ? this.store.read<{ actualMicros: number }>(op.id, 'cost.json').actualMicros : 0
      requireMedia(Number.isSafeInteger(settled) && settled >= 0, 'Invalid reconciled cost')
      const counted = Math.max(op.quote.reserveMicros, settled)
      totalMicros += counted
      if (op.createdAt.slice(0, 10) === day) dailyMicros += counted
    }
    return { dailyMicros, totalMicros, day, currency: 'USD' }
  }
  async generate(raw: unknown) {
    const args = generationArgs.parse(raw), id = this.store.operationId(args.idempotencyKey)
    return this.store.lock(async () => {
      const quote = this.readQuote(args.quoteId), config = this.config(quote.request.brand)
      requireMedia(quote.owner === config.owner && args.inputHash === quote.inputHash, 'Input hash does not match quote')
      if (this.store.exists(id, 'reserved.json')) {
        const previous = this.store.read<Operation>(id, 'reserved.json')
        requireMedia(previous.quote.id === quote.id, 'Idempotency key belongs to another quote')
        return this.operation(id)
      }
      this.config(quote.request.brand, true)
      requireMedia(config.allowPaid, 'Paid generation is disabled by the operator')
      requireMedia(!this.store.exists(`revoked-${quote.id}.json`), 'Quote approval revoked')
      requireMedia(Date.parse(quote.expiresAt) > this.clock().getTime() && quote.policyHash === hash(config.pricing), 'Quote expired or pricing changed; quote again')
      requireMedia(this.store.exists(`approval-${quote.id}.json`), 'Human quote approval required in Conjure')
      const approval = this.store.read<{ quoteHash: string; owner: string; approvedAt: string }>(`approval-${quote.id}.json`)
      requireMedia(approval.quoteHash === hash(quote) && approval.owner === config.owner && Date.parse(approval.approvedAt) <= this.clock().getTime(), 'Approval does not match quote')
      requireMedia(!this.operations().some(op => op.quote.id === quote.id), 'Quote approval has already been consumed')
      const reference = await loadReference(this.store, quote.request), budget = this.budget()
      requireMedia(budget.dailyMicros + quote.reserveMicros <= config.dailyLimitMicros && budget.totalMicros + quote.reserveMicros <= config.totalLimitMicros, 'Operator budget exhausted')
      requireMedia(Date.parse(quote.expiresAt) > this.clock().getTime(), 'Quote expired while validating inputs')
      const operation: Operation = { id, quote, approvalId: quote.id, createdAt: this.clock().toISOString() }
      this.store.write('reserved.json', operation, id)
      this.active.add(id)
      try {
        // A durable marker precedes even the first provider byte. A crash here is
        // intentionally ambiguous; this operation can never purchase again.
        this.store.write('submitted.json', { at: this.clock().toISOString() }, id)
        const bytes = await this.provider.generate(quote.request, quote.size, reference)
        await saveGenerated(this.store, id, quote.request.brand, quote.size, bytes)
      } catch {
        if (!this.store.exists(id, 'failure.json')) this.store.write('failure.json', { reason: 'Provider outcome or asset persistence needs reconciliation; do not regenerate.', at: this.clock().toISOString() }, id)
      } finally { this.active.delete(id) }
      return this.operation(id)
    })
  }
  async operation(id: string) {
    sha256.parse(id)
    const op = this.store.read<Operation>(id, 'reserved.json'); this.config(op.quote.request.brand)
    requireMedia(op.id === id && op.quote.owner === this.store.owner, 'Operation is not accessible')
    // Recover bytes already saved before a crash, without invoking the provider.
    if (!this.store.exists(id, 'asset.json') && this.store.exists(id, 'image.png')) {
      await saveGenerated(this.store, id, op.quote.request.brand, op.quote.size, readFileSync(this.store.path(id, 'image.png')))
    }
    const asset = this.store.exists(id, 'asset.json') ? await this.asset(id) : null
    const cost = this.store.exists(id, 'cost.json') ? this.store.read<{ actualMicros: number }>(id, 'cost.json') : null
    return { operationId: id, inputHash: op.quote.inputHash, brand: op.quote.request.brand,
      state: asset ? 'completed' : this.active.has(id) ? 'running' : 'needs_reconciliation',
      assets: asset ? [asset] : [], reservedMicros: op.quote.reserveMicros, actualCostMicros: cost?.actualMicros ?? null,
      costState: cost ? 'operator-recorded' : 'unreconciled', message: asset ? 'Original PNG retained in Conjure agent storage.' : 'Do not regenerate; inspect provider and durable operation records.' }
  }
  async asset(id: string): Promise<Asset> {
    sha256.parse(id)
    const asset = this.store.read<Asset>(id, 'asset.json'); this.config(asset.brand)
    requireMedia(asset.owner === this.store.owner && asset.id === id && asset.operationId === id, 'Asset is not accessible')
    const bytes = readFileSync(this.store.path(id, 'image.png'))
    requireMedia(hash(bytes) === asset.sha256, 'Asset integrity failure; restore original PNG')
    await describePng(bytes)
    return asset
  }
  async assetBytes(id: string) {
    const asset = await this.asset(id)
    return { asset, bytes: readFileSync(this.store.path(id, 'image.png')) }
  }
  async registerReference(raw: unknown) {
    const input = referenceArgs.parse(raw); this.config(input.brand)
    requireMedia(/^[A-Za-z0-9+/]+={0,2}$/.test(input.pngBase64), 'Invalid PNG encoding')
    const bytes = Buffer.from(input.pngBase64, 'base64'), dimensions = await describePng(bytes)
    requireMedia(hash(bytes) === input.sha256, 'Reference digest mismatch')
    const id = hash([this.store.owner, input.brand, input.sha256, input.source, input.rights])
    const asset: Asset = { id, owner: this.store.owner, brand: input.brand, sha256: input.sha256, mimeType: 'image/png', ...dimensions }
    await this.store.lock(async () => {
      if (!this.store.exists(`${id}.png`)) this.store.bytes([`${id}.png`], bytes)
      if (!this.store.exists(`${id}.json`)) this.store.write(`${id}.json`, { ...asset, source: input.source, rights: input.rights })
    })
    return asset
  }
}
