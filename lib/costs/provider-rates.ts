/**
 * Pure pricing over the provider rate card (issue #50).
 *
 * `priceUsage()` picks the rate-card entry whose `effectiveFrom` is the latest
 * on or before the call's `occurredAt`, so a rate change only affects calls
 * after it; the recorder freezes the prices it applied on each row, so history
 * never shifts. Unknown models are `unpriced` with a null cost — never 0.
 *
 * No I/O and only sibling imports, so scripts/check-provider-costs.cjs and
 * scripts/backfill-provider-usage.cjs can transpile and execute it.
 */

import { IMAGE_OUTPUT_TOKENS, RATE_CARD } from './rate-card'
import type { Operation, Provider, ProviderUsageUnits, RateCardEntry, RateUnit } from './usage-types'

export type { Operation, Provider, ProviderUsageUnits, RateCardEntry, RateUnit, UsageConfidence } from './usage-types'
export { IMAGE_OUTPUT_TOKENS, RATE_CARD } from './rate-card'

/** Estimated image output tokens for a requested model/quality/size ("WxH"). */
export function defaultImageOutputTokens(model: string, quality: string | undefined, size: string | undefined): number {
  const table = IMAGE_OUTPUT_TOKENS[model] ?? IMAGE_OUTPUT_TOKENS['gpt-image-2.5-flare']
  const base = table[(quality ?? 'auto').toLowerCase()] ?? table.auto ?? table.medium
  const match = /^(\d+)x(\d+)$/.exec(size ?? '')
  if (!match) return base
  const pixels = Number(match[1]) * Number(match[2])
  return Math.round(base * (pixels / (1024 * 1024)))
}

const RESOLUTION_DIMENSIONS: Record<string, [number, number]> = {
  '480p': [854, 480],
  '720p': [1280, 720],
  '1080p': [1920, 1080],
  // SeedVR upscale targets.
  '1440p': [2560, 1440],
  '2160p': [3840, 2160],
  '4k': [3840, 2160],
}

/** Frame dimensions for a video resolution label (16:9 unless the units carry width/height). */
export function resolutionDimensions(resolution: string | undefined, units?: ProviderUsageUnits): [number, number] {
  if (units?.width && units?.height) return [units.width, units.height]
  return RESOLUTION_DIMENSIONS[(resolution ?? '1080p').toLowerCase()] ?? RESOLUTION_DIMENSIONS['1080p']
}

/** Seedance video tokens: height × width × fps × seconds / 1024. */
export function estimateVideoTokens(units: ProviderUsageUnits): number {
  if (units.video_tokens) return units.video_tokens
  const [width, height] = resolutionDimensions(units.resolution, units)
  const fps = units.fps ?? 24
  const seconds = (units.seconds ?? 0) + (units.input_seconds ?? 0)
  return (height * width * fps * seconds) / 1024
}

/** Output megapixels of a video: width × height × frames / 1e6. */
export function estimateVideoMegapixels(units: ProviderUsageUnits): number {
  if (units.megapixels) return units.megapixels
  const [width, height] = resolutionDimensions(units.resolution, units)
  const fps = units.fps ?? 24
  return (width * height * fps * (units.seconds ?? 0)) / 1_000_000
}

function resolutionClass(resolution: string | undefined): string {
  return (resolution ?? '').toLowerCase() === '4k' ? '4k' : 'sd'
}

function selectPrices(entry: RateCardEntry, units: ProviderUsageUnits): Partial<Record<RateUnit, number>> {
  if (!entry.variants) return entry.prices
  const resolution = (units.resolution ?? 'any').toLowerCase()
  const audio = units.audio === undefined ? 'any' : units.audio ? 'audio' : 'silent'
  const candidates = [
    `${resolution}|${audio}`,
    `${resolution}|any`,
    `${resolutionClass(resolution)}|${audio}`,
    `${resolutionClass(resolution)}|any`,
    `any|${audio}`,
    'any|any',
  ]
  for (const key of candidates) {
    const prices = entry.variants[key]
    if (prices) return { ...entry.prices, ...prices }
  }
  return entry.prices
}

/** The rate-card entry in force for a model on a date, or null. */
export function findRate(provider: Provider, model: string, occurredAt: Date | string): RateCardEntry | null {
  const at = typeof occurredAt === 'string' ? new Date(occurredAt) : occurredAt
  const day = at.toISOString().slice(0, 10)
  let best: RateCardEntry | null = null
  for (const entry of RATE_CARD) {
    if (entry.provider !== provider || entry.model !== model) continue
    if (entry.effectiveFrom > day) continue
    if (!best || entry.effectiveFrom > best.effectiveFrom) best = entry
  }
  return best
}

export interface PriceInput {
  provider: Provider
  model: string
  operation: Operation
  units: ProviderUsageUnits
}

export interface PriceResult {
  /** USD, rounded to 6 places; null when the model has no rate or no billable units. */
  costUsd: number | null
  /** `unknown`: the model has a rate but the call carried none of the units it bills on. */
  confidence: 'rate' | 'unpriced' | 'unknown'
  /** The per-unit prices applied, keyed by unit — frozen on the row. */
  unitPrices: Record<string, number>
  rateEffectiveFrom: string | null
  sourceUrl: string | null
}

const round6 = (value: number) => Math.round(value * 1_000_000) / 1_000_000

/**
 * Price one call from its units. Pure: same input, same output. Unknown
 * models return `unpriced` with a null cost — never 0 (AC-4).
 */
export function priceUsage(input: PriceInput, occurredAt: Date | string): PriceResult {
  const entry = findRate(input.provider, input.model, occurredAt)
  if (!entry) return { costUsd: null, confidence: 'unpriced', unitPrices: {}, rateEffectiveFrom: null, sourceUrl: null }

  const prices = selectPrices(entry, input.units)
  const applied: Record<string, number> = {}
  let cost = 0
  const charge = (unit: RateUnit, quantity: number | undefined) => {
    const price = prices[unit]
    if (price === undefined || !quantity) return
    applied[unit] = price
    cost += price * quantity
  }
  const u = input.units

  // Token-billed models (OpenAI, Gemini). Cached input tokens are a subset of
  // input tokens and bill at the cached rate instead of the full one.
  const cachedText = Math.min(u.cached_tokens_in ?? 0, u.text_tokens_in ?? 0)
  charge('text_token_in', (u.text_tokens_in ?? 0) - cachedText)
  charge('cached_token_in', cachedText)
  charge('text_token_out', u.text_tokens_out)
  const cachedImage = Math.min(u.cached_image_tokens_in ?? 0, u.image_tokens_in ?? 0)
  charge('image_token_in', (u.image_tokens_in ?? 0) - cachedImage)
  charge('cached_image_token_in', cachedImage)

  // Image output: token-billed when the provider reported tokens, else the
  // published per-image price for the requested size.
  if (u.image_tokens_out) {
    charge('image_token_out', u.image_tokens_out)
  } else if (u.images_out && entry.perImage) {
    const perImage = entry.perImage[u.image_size ?? '1K'] ?? entry.perImage['1K']
    if (perImage !== undefined) {
      applied.image_out = perImage
      cost += perImage * u.images_out
    }
  }

  // Media billed by output/input duration or derived units.
  charge('second', u.seconds)
  if (prices.video_token !== undefined) charge('video_token', estimateVideoTokens(u))
  if (prices.five_second_block !== undefined) charge('five_second_block', Math.ceil((u.input_seconds ?? u.seconds ?? 0) / 5))
  if (prices.megapixel !== undefined) {
    const megapixels = u.megapixels ?? (u.seconds ? estimateVideoMegapixels(u) : undefined)
    charge('megapixel', megapixels)
  }
  charge('character', u.characters)
  charge('audio_second', u.audio_seconds ?? (prices.audio_second !== undefined ? u.seconds : undefined))
  if (prices.compute_second !== undefined) {
    // $0 pages still count the call: record the unit so the row is priced.
    const seconds = u.compute_seconds ?? u.seconds ?? 0
    applied.compute_second = prices.compute_second
    cost += prices.compute_second * seconds
  }
  charge('call', u.calls ?? (prices.call !== undefined && Object.keys(applied).length === 0 ? 1 : undefined))
  if (u.predict_seconds !== undefined) charge('compute_second', u.predict_seconds)

  // A priced model with none of its billable units (e.g. a lipsync job whose
  // input duration was never captured) must not read as a free call.
  if (Object.keys(applied).length === 0) {
    return { costUsd: null, confidence: 'unknown', unitPrices: {}, rateEffectiveFrom: entry.effectiveFrom, sourceUrl: entry.sourceUrl }
  }

  return {
    costUsd: round6(cost),
    confidence: 'rate',
    unitPrices: applied,
    rateEffectiveFrom: entry.effectiveFrom,
    sourceUrl: entry.sourceUrl,
  }
}

/** Map a fal endpoint to the operation it performs, for rows recorded from the fal client. */
export function operationForFalEndpoint(endpoint: string): Operation {
  if (endpoint.includes('/lipsync/')) return 'lipsync'
  if (endpoint.includes('seedvr/upscale')) return 'video-upscale'
  if (endpoint.includes('/tts')) return 'tts'
  if (endpoint.includes('lyria')) return 'music'
  if (endpoint.includes('whisper') || endpoint.includes('speech-to-text')) return 'transcribe'
  if (endpoint.includes('ffmpeg-api')) return 'compose'
  if (endpoint.includes('extend-video')) return 'video-extend'
  if (endpoint.includes('birefnet') || endpoint.includes('/ben/')) return 'bg-removal'
  return 'video'
}
