/**
 * Provider usage recorder (issue #50).
 *
 * Every shared provider client calls recordProviderUsage() after the provider
 * responds. Route identity (feature + user) reaches it through an
 * AsyncLocalStorage context set by withUsageContext() at route entry, so client
 * signatures stay unchanged. Recording is fire-and-forget: an insert failure is
 * logged with the `[provider-usage]` prefix and swallowed, and without a
 * database URL the recorder is a no-op. It must never break a generation.
 */

import { AsyncLocalStorage } from 'node:async_hooks'
import { after } from 'next/server'
import { neon } from '@neondatabase/serverless'
import {
  priceUsage,
  type Operation,
  type Provider,
  type ProviderUsageUnits,
  type UsageConfidence,
} from './provider-rates'

export interface UsageContext {
  feature: string
  userId?: string
}

const usageContext = new AsyncLocalStorage<UsageContext>()

/** Run `fn` with a usage context so every provider call inside it is attributed. */
export function withUsageContext<T>(feature: string, userId: string | undefined, fn: () => Promise<T>): Promise<T> {
  return usageContext.run({ feature, userId: userId || undefined }, fn)
}

export function getUsageContext(): UsageContext | undefined {
  return usageContext.getStore()
}

/**
 * Routes that resolve a better user id than the cookie (e.g. from a form
 * field) call this once so the rows written afterwards carry it.
 */
export function setUsageContextUser(userId: string | undefined): void {
  const store = usageContext.getStore()
  if (store && userId) store.userId = userId
}

export type UsageStatus = 'succeeded' | 'failed' | 'timeout' | 'pending'

export interface RecordUsageInput {
  provider: Provider
  model: string
  operation: Operation
  status: UsageStatus
  /** Raw usage from the provider, or the requested shape for timeouts/pending. */
  units: ProviderUsageUnits
  /** True when `units` came from the provider's own usage report. */
  exact?: boolean
  requestId?: string
  error?: string
  latencyMs?: number
  occurredAt?: Date
  /** Override the context values (used by the video finalizer and tests). */
  feature?: string
  userId?: string
}

export interface ProviderUsageRow {
  occurred_at: string
  provider: Provider
  model: string
  operation: Operation
  feature: string
  user_id: string | null
  status: UsageStatus
  units: ProviderUsageUnits
  unit_prices: Record<string, number>
  cost_usd: number | null
  confidence: UsageConfidence
  rate_effective_from: string | null
  request_id: string | null
  error: string | null
  latency_ms: number | null
}

type InsertSink = (row: ProviderUsageRow) => Promise<void>
type FinalizeSink = (requestId: string, patch: FinalizePatch) => Promise<void>

let insertOverride: InsertSink | null = null
let finalizeOverride: FinalizeSink | null = null

/** Test seam: replace the database writes. Pass null to restore. */
export function setProviderUsageSink(sink: { insert?: InsertSink; finalize?: FinalizeSink } | null): void {
  insertOverride = sink?.insert ?? null
  finalizeOverride = sink?.finalize ?? null
}

function getSql() {
  const url = process.env.NEON_DATABASE_URL
  return url ? neon(url) : null
}

/**
 * Build the row that would be written for `input`, applying the rate card.
 * Exported so tests and the backfill can assert on rows without a database.
 */
export function buildProviderUsageRow(input: RecordUsageInput): ProviderUsageRow {
  const context = usageContext.getStore()
  const occurredAt = input.occurredAt ?? new Date()
  const base = {
    occurred_at: occurredAt.toISOString(),
    provider: input.provider,
    model: input.model,
    operation: input.operation,
    feature: input.feature ?? context?.feature ?? 'unknown',
    user_id: input.userId ?? context?.userId ?? null,
    status: input.status,
    units: input.units,
    request_id: input.requestId ?? null,
    error: input.error ? input.error.slice(0, 500) : null,
    latency_ms: input.latencyMs ?? null,
  }

  // AC-5: a provider error costs nothing. Pending rows are priced on finalize.
  if (input.status === 'failed' || input.status === 'pending') {
    return { ...base, unit_prices: {}, cost_usd: 0, confidence: 'exact', rate_effective_from: null }
  }

  const priced = priceUsage(
    { provider: input.provider, model: input.model, operation: input.operation, units: input.units },
    occurredAt,
  )
  // AC-5: a timeout after the request was sent may still have been billed, so
  // the list-rate estimate is kept but its confidence is 'unknown'.
  const confidence: UsageConfidence =
    priced.confidence === 'unpriced' ? 'unpriced'
      : priced.confidence === 'unknown' || input.status === 'timeout' ? 'unknown'
        : input.exact ? 'exact'
          : 'rate'
  return {
    ...base,
    unit_prices: priced.unitPrices,
    cost_usd: priced.costUsd,
    confidence,
    rate_effective_from: priced.rateEffectiveFrom,
  }
}

async function insertRow(row: ProviderUsageRow): Promise<void> {
  if (insertOverride) return insertOverride(row)
  const sql = getSql()
  if (!sql) return
  await sql`
    INSERT INTO public.provider_usage (
      occurred_at, provider, model, operation, feature, user_id, status,
      units, unit_prices, cost_usd, confidence, rate_effective_from,
      request_id, source, error, latency_ms
    ) VALUES (
      ${row.occurred_at}, ${row.provider}, ${row.model}, ${row.operation}, ${row.feature}, ${row.user_id}, ${row.status},
      ${JSON.stringify(row.units)}::jsonb, ${JSON.stringify(row.unit_prices)}::jsonb, ${row.cost_usd}, ${row.confidence}, ${row.rate_effective_from},
      ${row.request_id}, 'live', ${row.error}, ${row.latency_ms}
    )
  `
}

/**
 * Keep a serverless invocation alive until `work` settles. Inside a Next.js
 * request scope `after()` does exactly that; outside one (tests, scripts) it
 * throws and the promise simply runs in the current process.
 */
function keepAliveAfterResponse(work: Promise<unknown>): void {
  try {
    after(work)
  } catch {
    // Not in a request scope — nothing to extend.
  }
}

async function writeRow(row: ProviderUsageRow): Promise<void> {
  try {
    await insertRow(row)
  } catch (error) {
    console.error('[provider-usage] failed to record usage:', error instanceof Error ? error.message : error)
  }
}

/**
 * Record one provider call. The insert is started immediately and handed to
 * Next's `after()` so a Vercel instance is not frozen before it lands; callers
 * on a response path do not await it (`void recordProviderUsage(...)`). The
 * returned promise resolves with the row once the write attempt finished.
 * Never throws.
 */
export async function recordProviderUsage(input: RecordUsageInput): Promise<ProviderUsageRow | null> {
  let row: ProviderUsageRow
  try {
    row = buildProviderUsageRow(input)
  } catch (error) {
    console.error('[provider-usage] failed to build usage row:', error instanceof Error ? error.message : error)
    return null
  }
  const write = writeRow(row)
  keepAliveAfterResponse(write)
  await write
  return row
}

export interface FinalizePatch {
  status: 'succeeded' | 'failed'
  units?: ProviderUsageUnits
  error?: string
  occurredAt?: Date
}

async function finalizeRow(requestId: string, patch: FinalizePatch, priced: Pick<ProviderUsageRow, 'unit_prices' | 'cost_usd' | 'confidence' | 'rate_effective_from'>): Promise<void> {
  if (finalizeOverride) return finalizeOverride(requestId, patch)
  const sql = getSql()
  if (!sql) return
  const updated = await sql`
    UPDATE public.provider_usage
    SET status = ${patch.status},
        units = COALESCE(${patch.units ? JSON.stringify(patch.units) : null}::jsonb, units),
        unit_prices = ${JSON.stringify(priced.unit_prices)}::jsonb,
        cost_usd = ${priced.cost_usd},
        confidence = ${priced.confidence},
        rate_effective_from = ${priced.rate_effective_from},
        error = ${patch.error ? patch.error.slice(0, 500) : null}
    WHERE request_id = ${requestId} AND status = 'pending'
    RETURNING id
  `
  if (updated.length === 0) {
    console.warn(`[provider-usage] no pending row to finalize for request ${requestId} (submit-time insert lost?)`)
  }
}

/**
 * Finalize a pending async row (fal queue jobs) once the provider reports the
 * outcome. Needs the provider/model/operation to price the final units.
 * Never throws.
 */
export async function finalizeProviderUsage(
  requestId: string,
  identity: { provider: Provider; model: string; operation: Operation },
  patch: FinalizePatch,
): Promise<void> {
  const work = (async () => {
    try {
      if (patch.status === 'failed') {
        await finalizeRow(requestId, patch, { unit_prices: {}, cost_usd: 0, confidence: 'exact', rate_effective_from: null })
        return
      }
      const priced = priceUsage({ ...identity, units: patch.units ?? {} }, patch.occurredAt ?? new Date())
      await finalizeRow(requestId, patch, {
        unit_prices: priced.unitPrices,
        cost_usd: priced.costUsd,
        confidence: priced.confidence === 'rate' ? 'rate' : priced.confidence,
        rate_effective_from: priced.rateEffectiveFrom,
      })
    } catch (error) {
      console.error('[provider-usage] failed to finalize usage:', error instanceof Error ? error.message : error)
    }
  })()
  keepAliveAfterResponse(work)
  await work
}

/** Milliseconds since `startedAt`, for latency_ms. */
export function elapsedMs(startedAt: number): number {
  return Math.max(0, Math.round(Date.now() - startedAt))
}
