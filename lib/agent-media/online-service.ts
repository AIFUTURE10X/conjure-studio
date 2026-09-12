import type { Pool, PoolClient } from 'pg'
import { z } from 'zod'
import { getOpenAIImageSize } from '../openai-image-client'
import { hash, imageRequest, instant, safeId, sha256 } from './contracts'

export const onlinePolicySchema = z.object({
  operatorId: z.string().min(1).max(120),
  brands: z.array(safeId).min(1),
  allowPaid: z.boolean(),
  dailyLimitMicros: z.number().int().positive(),
  totalLimitMicros: z.number().int().positive(),
  expiresAt: instant,
  pricing: z.object({
    checkedAt: instant,
    expiresAt: instant,
    source: z.string().url(),
    reserves: z.object({
      low: z.number().int().positive(),
      medium: z.number().int().positive(),
      high: z.number().int().positive(),
    }).strict(),
    referenceExtraMicros: z.number().int().min(0),
  }).strict(),
}).strict()

export type OnlinePolicy = z.infer<typeof onlinePolicySchema>

const quoteInput = z.object({
  operatorId: z.string().min(1).max(120),
  ownerId: z.string().min(1).max(120),
  campaignId: z.string().min(1).max(128),
  request: imageRequest,
  referenceFileId: z.string().uuid().optional(),
  referenceSha256: sha256.optional(),
  composition: z.object({
    mode: z.enum(['concept', 'product-proof']),
    headline: z.string().max(500),
    body: z.string().max(4000),
    cta: z.string().max(120),
  }).strict(),
}).strict().refine(value => Boolean(value.referenceFileId) === Boolean(value.referenceSha256), {
  message: 'Reference file id and digest must be supplied together',
}).refine(value => value.composition.mode !== 'product-proof' || Boolean(value.referenceFileId), {
  message: 'Product-proof mode requires an authenticated screenshot',
})

const approvalInput = z.object({
  quoteId: sha256,
  quoteDigest: sha256,
  reviewer: z.string().trim().min(1).max(100),
}).strict()

const operationInput = z.object({
  quoteId: sha256,
  idempotencyKey: safeId,
}).strict()

interface QuoteRow {
  id: string
  operator_id: string
  owner_id: string
  campaign_id: string
  brand: string
  request_digest: string
  request: z.infer<typeof imageRequest>
  reference_file_id: string | null
  reference_sha256: string | null
  composition: { mode: 'concept' | 'product-proof'; headline: string; body: string; cta: string }
  size: string
  reserved_micros: number
  currency: 'USD'
  policy_digest: string
  expires_at: Date
  created_at: Date
}

const publicQuote = (row: QuoteRow) => ({
  id: row.id,
  operatorId: row.operator_id,
  ownerId: row.owner_id,
  campaignId: row.campaign_id,
  brand: row.brand,
  requestDigest: row.request_digest,
  request: row.request,
  referenceFileId: row.reference_file_id,
  referenceSha256: row.reference_sha256,
  composition: row.composition,
  size: row.size,
  reservedMicros: row.reserved_micros,
  currency: row.currency,
  policyDigest: row.policy_digest,
  expiresAt: row.expires_at.toISOString(),
  createdAt: row.created_at.toISOString(),
})

export class OnlineMediaService {
  readonly policy: OnlinePolicy

  constructor(readonly pool: Pool, policy: OnlinePolicy, readonly clock = () => new Date()) {
    this.policy = onlinePolicySchema.parse(policy)
  }

  async createQuote(raw: unknown) {
    const input = quoteInput.parse(raw), now = this.clock()
    this.assertPolicy(input.operatorId, input.request.brand, now)
    if (input.request.reference) throw new Error('Online references must use an authenticated Popcorn file')
    const reserve = this.policy.pricing.reserves[input.request.quality]
      + (input.referenceFileId ? this.policy.pricing.referenceExtraMicros : 0)
    if (reserve > this.policy.dailyLimitMicros || reserve > this.policy.totalLimitMicros) {
      throw new Error('Quote exceeds the configured budget')
    }
    const requestDigest = hash({ request: input.request, referenceFileId: input.referenceFileId ?? null,
      referenceSha256: input.referenceSha256 ?? null, composition: input.composition })
    const expiresAt = new Date(Math.min(now.getTime() + 30 * 60_000,
      Date.parse(this.policy.expiresAt), Date.parse(this.policy.pricing.expiresAt)))
    const body = {
      operatorId: input.operatorId, ownerId: input.ownerId, campaignId: input.campaignId, brand: input.request.brand,
      requestDigest, request: input.request, referenceFileId: input.referenceFileId ?? null,
      referenceSha256: input.referenceSha256 ?? null,
      composition: input.composition,
      size: getOpenAIImageSize(input.request.aspectRatio, '1K'), reservedMicros: reserve,
      currency: 'USD' as const, policyDigest: hash(this.policy), expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
    }
    const id = hash(body)
    await this.pool.query(`
      INSERT INTO conjure_media.quotes
        (id, operator_id, owner_id, campaign_id, brand, request_digest, request, reference_file_id,
         reference_sha256, composition, size, reserved_micros, currency, policy_digest, expires_at, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'USD',$13,$14,$15)
      ON CONFLICT (id) DO NOTHING
    `, [id, body.operatorId, body.ownerId, body.campaignId, body.brand, body.requestDigest, body.request,
      body.referenceFileId, body.referenceSha256, body.composition, body.size, body.reservedMicros,
      body.policyDigest, body.expiresAt, body.createdAt])
    return this.readQuote(id)
  }

  async approve(raw: unknown) {
    const input = approvalInput.parse(raw), quote = await this.readQuote(input.quoteId), now = this.clock()
    this.assertPolicy(quote.operatorId, quote.brand, now)
    if (quote.expiresAt <= now.toISOString()) throw new Error('Quote expired')
    if (input.quoteDigest !== hash(quote)) throw new Error('Approval does not match the reviewed quote')
    const id = hash([quote.ownerId, quote.id, input.quoteDigest])
    await this.pool.query(`
      INSERT INTO conjure_media.approvals (id, quote_id, owner_id, quote_digest, reviewer, approved_at)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (quote_id) DO NOTHING
    `, [id, quote.id, quote.ownerId, input.quoteDigest, input.reviewer, now])
    return { id, quoteId: quote.id, ownerId: quote.ownerId, quoteDigest: input.quoteDigest,
      reviewer: input.reviewer, approvedAt: now.toISOString() }
  }

  async createOperation(raw: unknown) {
    const input = operationInput.parse(raw), now = this.clock()
    return this.transaction(async client => {
      const quote = await this.readQuote(input.quoteId, client, true)
      this.assertPolicy(quote.operatorId, quote.brand, now, true)
      if (quote.expiresAt <= now.toISOString() || quote.policyDigest !== hash(this.policy)) {
        throw new Error('Quote expired or pricing changed')
      }
      const approval = (await client.query<{ id: string; quote_digest: string }>(`
        SELECT id, quote_digest FROM conjure_media.approvals
        WHERE quote_id = $1 AND owner_id = $2 FOR UPDATE
      `, [quote.id, quote.ownerId])).rows[0]
      if (!approval || approval.quote_digest !== hash(quote)) throw new Error('Human quote approval required')
      const operationId = hash([quote.ownerId, input.idempotencyKey])
      const existing = await client.query<{ id: string; quote_id: string }>(`
        SELECT id, quote_id FROM conjure_media.operations WHERE id = $1 AND owner_id = $2 FOR UPDATE
      `, [operationId, quote.ownerId])
      if (existing.rows[0]) {
        if (existing.rows[0].quote_id !== quote.id) throw new Error('Idempotency key belongs to another quote')
        return this.readOperation(operationId, client)
      }
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [`${quote.operatorId}:${quote.ownerId}`])
      const budgetNow = this.clock()
      this.assertPolicy(quote.operatorId, quote.brand, budgetNow, true)
      if (quote.expiresAt <= budgetNow.toISOString() || quote.policyDigest !== hash(this.policy)) {
        throw new Error('Quote expired or pricing changed while reserving budget')
      }
      const budget = (await client.query<{ daily: string; total: string }>(`
        SELECT
          coalesce(sum(greatest(reserved_micros, coalesce(actual_micros, 0)))
            FILTER (WHERE created_at >= date_trunc('day', $2::timestamptz)), 0)::text AS daily,
          coalesce(sum(greatest(reserved_micros, coalesce(actual_micros, 0))), 0)::text AS total
        FROM conjure_media.operations WHERE owner_id = $1
      `, [quote.ownerId, budgetNow])).rows[0]
      if (Number(budget.daily) + quote.reservedMicros > this.policy.dailyLimitMicros
        || Number(budget.total) + quote.reservedMicros > this.policy.totalLimitMicros) {
        throw new Error('Operator budget exhausted')
      }
      await client.query(`
        INSERT INTO conjure_media.operations
          (id, operator_id, owner_id, request_digest, state, quote_id, approval_id, campaign_id, brand,
           request, reference_file_id, reference_sha256, composition, reserved_micros, created_at, updated_at)
        VALUES ($1,$2,$3,$4,'queued',$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14)
      `, [operationId, quote.operatorId, quote.ownerId, quote.requestDigest, quote.id, approval.id,
        quote.campaignId, quote.brand, quote.request, quote.referenceFileId,
        quote.referenceSha256, quote.composition, quote.reservedMicros, budgetNow])
      await client.query(`
        INSERT INTO conjure_media.costs (operation_id, reserved_micros)
        VALUES ($1,$2)
      `, [operationId, quote.reservedMicros])
      await client.query(`
        INSERT INTO conjure_media.outbox (id, operation_id, state)
        VALUES ($1,$2,'pending')
      `, [`outbox-${operationId}`, operationId])
      return this.readOperation(operationId, client)
    })
  }

  async readQuote(id: string, client: Pool | PoolClient = this.pool, lock = false) {
    sha256.parse(id)
    const result = await client.query<QuoteRow>(`
      SELECT id, operator_id, owner_id, campaign_id, brand, request_digest, request, reference_file_id,
        reference_sha256, composition, size, reserved_micros, currency, policy_digest, expires_at, created_at
      FROM conjure_media.quotes WHERE id = $1 AND operator_id = $2 ${lock ? 'FOR UPDATE' : ''}
    `, [id, this.policy.operatorId])
    if (!result.rows[0]) throw new Error('Quote is not accessible')
    return publicQuote(result.rows[0])
  }

  async readOperation(id: string, client: Pool | PoolClient = this.pool) {
    sha256.parse(id)
    const result = await client.query(`
      SELECT id, owner_id, campaign_id, brand, request_digest, request, reference_file_id,
        reference_sha256, composition, quote_id, approval_id, state, submitted_at, asset_id,
        reserved_micros, actual_micros, failure_code, created_at, updated_at
      FROM conjure_media.operations WHERE id = $1 AND operator_id = $2
    `, [id, this.policy.operatorId])
    if (!result.rows[0]) throw new Error('Operation is not accessible')
    return result.rows[0]
  }

  private assertPolicy(operatorId: string, brand: string, now: Date, requirePaid = false) {
    if (operatorId !== this.policy.operatorId || !this.policy.brands.includes(brand)) throw new Error('Operator or brand is not authorized')
    if (Date.parse(this.policy.expiresAt) <= now.getTime()
      || Date.parse(this.policy.pricing.expiresAt) <= now.getTime()
      || Date.parse(this.policy.pricing.checkedAt) > now.getTime()) throw new Error('Operator policy or pricing expired')
    if (requirePaid && !this.policy.allowPaid) throw new Error('Paid generation is disabled by the operator')
  }

  private async transaction<T>(work: (client: PoolClient) => Promise<T>) {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const result = await work(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally { client.release() }
  }
}
