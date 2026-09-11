/**
 * Provider rate card and the pure pricing function (issue #50).
 *
 * Every rate is data: one entry per provider + model/endpoint with the date it
 * took effect and the official page it was verified against. `priceUsage()`
 * picks the entry whose `effectiveFrom` is the latest on or before the call's
 * `occurredAt`, so a rate change only affects calls after it. The initial
 * entries are dated 2025-01-01 so the history backfill (rows back to
 * 2025-11) prices against today's verified rates rather than reading as
 * unpriced; they are the earliest rates this app has verified, not a claim
 * about what providers charged in 2025. The recorder
 * freezes the prices it applied on each row, so history never shifts.
 *
 * Units are USD per SINGLE unit (per token, per second, per call), never per
 * million — the entries below spell out the conversion in comments so they
 * can be checked against the source page at a glance.
 *
 * This module is pure (no I/O, no other project imports) so the contract
 * check can execute it with ts.transpileModule, like scripts/check-prompt-merge.cjs.
 */

export type Provider = 'openai' | 'gemini' | 'fal' | 'photoroom' | 'replicate'

export type Operation =
  | 'image-generate'
  | 'image-edit'
  | 'text'
  | 'video'
  | 'video-extend'
  | 'lipsync'
  | 'video-upscale'
  | 'tts'
  | 'music'
  | 'transcribe'
  | 'compose'
  | 'bg-removal'
  | 'upscale'

export type UsageConfidence = 'exact' | 'rate' | 'estimated' | 'unknown' | 'unpriced'

export type RateUnit =
  | 'text_token_in'
  | 'cached_token_in'
  | 'text_token_out'
  | 'image_token_in'
  | 'cached_image_token_in'
  | 'image_token_out'
  | 'image_out'
  | 'second'
  | 'video_token'
  | 'five_second_block'
  | 'megapixel'
  | 'character'
  | 'audio_second'
  | 'compute_second'
  | 'call'

/**
 * Raw usage for one call. Providers that report usage fill the token fields;
 * the others carry what the rate needs (seconds + resolution, megapixels,
 * characters, calls). Everything is optional so a row can hold whatever the
 * provider gave.
 */
export interface ProviderUsageUnits {
  text_tokens_in?: number
  cached_tokens_in?: number
  text_tokens_out?: number
  image_tokens_in?: number
  cached_image_tokens_in?: number
  image_tokens_out?: number
  /** Whole generated images, priced per image by `image_size` where the card has per-image prices. */
  images_out?: number
  image_size?: string
  /** Generated media seconds (video/audio). */
  seconds?: number
  /** Seconds of input media, for endpoints billed on the input (lipsync). */
  input_seconds?: number
  resolution?: string
  audio?: boolean
  /** Output frame size when known; otherwise derived from `resolution` assuming 16:9. */
  width?: number
  height?: number
  fps?: number
  video_tokens?: number
  megapixels?: number
  characters?: number
  audio_seconds?: number
  compute_seconds?: number
  calls?: number
  /** Provider-reported billable seconds (Replicate predict_time). */
  predict_seconds?: number
  /** Requested quality, used only for timeout estimates and backfill. */
  quality?: string
}

export interface RateCardEntry {
  provider: Provider
  model: string
  /** YYYY-MM-DD; the entry applies to calls on or after this date. */
  effectiveFrom: string
  sourceUrl: string
  /** USD per single unit. */
  prices: Partial<Record<RateUnit, number>>
  /**
   * Prices that depend on resolution and/or audio, keyed `${resolution}|${audio}`
   * where resolution is an exact value ('720p', '1080p', '4k'), a class ('sd'
   * for anything below 4k) or 'any', and audio is 'audio', 'silent' or 'any'.
   */
  variants?: Record<string, Partial<Record<RateUnit, number>>>
  /** Per-image prices by image size, for models that publish them. */
  perImage?: Record<string, number>
  note?: string
}

// Divide rather than multiply by a reciprocal: 30 / 1e6 is exactly 0.00003 in
// IEEE-754, 30 * (1 / 1e6) is 0.0000299…, and stored unit prices should read
// like the source page.
const perMillion = (usd: number) => usd / 1_000_000
const perThousand = (usd: number) => usd / 1_000

const OPENAI_PRICING = 'https://developers.openai.com/api/docs/pricing'
const GEMINI_PRICING = 'https://ai.google.dev/gemini-api/docs/pricing'
const FAL = (endpoint: string) => `https://fal.ai/models/${endpoint}`
const REPLICATE = (slug: string) => `https://replicate.com/${slug}`

function openaiImageEntry(model: string, sourceUrl: string): RateCardEntry {
  // Verified 2026-09-11: text in $5.00/1M (cached $1.25), image in $8.00/1M
  // (cached $2.00), image out $30.00/1M — identical for 2.5 Flare, 2.5 Sunburst and 2.
  return {
    provider: 'openai',
    model,
    effectiveFrom: '2025-01-01',
    sourceUrl,
    prices: {
      text_token_in: perMillion(5.0),
      cached_token_in: perMillion(1.25),
      image_token_in: perMillion(8.0),
      cached_image_token_in: perMillion(2.0),
      image_token_out: perMillion(30.0),
    },
  }
}

function openaiTextEntry(model: string, input: number, cached: number, output: number, effectiveFrom = '2025-01-01', note?: string): RateCardEntry {
  return {
    provider: 'openai',
    model,
    effectiveFrom,
    sourceUrl: OPENAI_PRICING,
    prices: {
      text_token_in: perMillion(input),
      cached_token_in: perMillion(cached),
      text_token_out: perMillion(output),
    },
    note,
  }
}

function falPerSecond(endpoint: string, variants: Record<string, number>, note?: string): RateCardEntry {
  return {
    provider: 'fal',
    model: endpoint,
    effectiveFrom: '2025-01-01',
    sourceUrl: FAL(endpoint),
    prices: {},
    variants: Object.fromEntries(Object.entries(variants).map(([key, usd]) => [key, { second: usd }])),
    note,
  }
}

function falFlat(endpoint: string, prices: Partial<Record<RateUnit, number>>, note?: string): RateCardEntry {
  return { provider: 'fal', model: endpoint, effectiveFrom: '2025-01-01', sourceUrl: FAL(endpoint), prices, note }
}

const VEO_STANDARD = { 'sd|silent': 0.2, 'sd|audio': 0.4, '4k|silent': 0.4, '4k|audio': 0.6 }
const KLING_V3_PRO = { 'any|silent': 0.112, 'any|audio': 0.168 }

/**
 * The rate card. Keep entries grouped by provider; add a new entry with a later
 * `effectiveFrom` when a price changes — never edit an old one.
 */
export const RATE_CARD: RateCardEntry[] = [
  // ---- OpenAI images (verified 2026-09-11 against the model pages + pricing page)
  openaiImageEntry('gpt-image-2.5-flare', 'https://developers.openai.com/api/docs/models/gpt-image-2.5-flare'),
  openaiImageEntry('gpt-image-2.5-sunburst', 'https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst'),
  openaiImageEntry('gpt-image-2', OPENAI_PRICING),

  // ---- OpenAI text (Responses API; verified 2026-09-11). Short-context rates;
  // requests past 272K input tokens bill higher and are not modelled (NG).
  openaiTextEntry('gpt-5.4-mini', 0.75, 0.075, 4.5),
  openaiTextEntry('gpt-5.4', 2.5, 0.25, 15.0),
  openaiTextEntry('gpt-5.5', 5.0, 0.5, 30.0),
  // Sol is on promotional pricing "at least through November 21, 2026"; the
  // list price ($5 / $0.50 / $30) takes over the day after.
  openaiTextEntry('gpt-5.6-sol', 4.0, 0.4, 20.0, '2026-01-01', 'promotional pricing through 2026-11-21'),
  openaiTextEntry('gpt-5.6-sol', 5.0, 0.5, 30.0, '2026-11-22', 'list price after the promotion'),

  // ---- Gemini image models (verified 2026-09-11)
  {
    provider: 'gemini',
    model: 'gemini-3.1-flash-image-preview',
    effectiveFrom: '2025-01-01',
    sourceUrl: GEMINI_PRICING,
    // Input $0.50/1M, text output $3/1M, image output $60/1M.
    prices: { text_token_in: perMillion(0.5), image_token_in: perMillion(0.5), text_token_out: perMillion(3.0), image_token_out: perMillion(60.0) },
    perImage: { '0.5K': 0.045, '1K': 0.067, '2K': 0.101, '4K': 0.151 },
  },
  {
    provider: 'gemini',
    model: 'gemini-3-pro-image-preview',
    effectiveFrom: '2025-01-01',
    sourceUrl: GEMINI_PRICING,
    // Input $2/1M, text output $12/1M, image output $120/1M; $0.134 per 1K/2K image, $0.24 per 4K.
    prices: { text_token_in: perMillion(2.0), image_token_in: perMillion(2.0), text_token_out: perMillion(12.0), image_token_out: perMillion(120.0) },
    perImage: { '1K': 0.134, '2K': 0.134, '4K': 0.24 },
  },
  {
    provider: 'gemini',
    model: 'gemini-2.5-flash-image',
    effectiveFrom: '2025-01-01',
    sourceUrl: GEMINI_PRICING,
    // Input $0.30/1M, text output $2.50/1M, $0.039 per image (1290 tokens at $30/1M).
    prices: { text_token_in: perMillion(0.3), image_token_in: perMillion(0.3), text_token_out: perMillion(2.5), image_token_out: perMillion(30.0) },
    perImage: { '1K': 0.039 },
  },

  // ---- fal video (verified 2026-09-11 on each model page)
  falPerSecond('fal-ai/kling-video/v3/pro/image-to-video', KLING_V3_PRO, '$0.112/s, $0.168/s with audio'),
  falPerSecond('fal-ai/kling-video/v3/pro/text-to-video', KLING_V3_PRO, '$0.112/s, $0.168/s with audio'),
  falPerSecond('fal-ai/veo3.1', VEO_STANDARD),
  falPerSecond('fal-ai/veo3.1/image-to-video', VEO_STANDARD),
  falPerSecond('fal-ai/veo3.1/first-last-frame-to-video', VEO_STANDARD),
  falPerSecond('fal-ai/veo3.1/extend-video', { 'any|silent': 0.2, 'any|audio': 0.4 }),
  // Seedance is token-billed: tokens = height × width × fps(24) × seconds / 1024.
  falFlat('fal-ai/bytedance/seedance/v1/pro/fast/image-to-video', { video_token: perMillion(1.0) }, '$1.0 per 1M video tokens; 1080p 5 s ≈ $0.243'),
  falFlat('fal-ai/bytedance/seedance/v1/pro/fast/text-to-video', { video_token: perMillion(1.0) }, '$1.0 per 1M video tokens'),
  {
    provider: 'fal', model: 'bytedance/seedance-2.0/image-to-video', effectiveFrom: '2025-01-01', sourceUrl: FAL('bytedance/seedance-2.0/image-to-video'),
    prices: {}, variants: { 'sd|any': { video_token: perThousand(0.014) }, '4k|any': { video_token: perThousand(0.008) } },
    note: '$0.014 per 1K tokens up to 1080p, $0.008 per 1K tokens at 4k; audio included',
  },
  {
    provider: 'fal', model: 'bytedance/seedance-2.0/text-to-video', effectiveFrom: '2025-01-01', sourceUrl: FAL('bytedance/seedance-2.0/text-to-video'),
    prices: {}, variants: { 'sd|any': { video_token: perThousand(0.014) }, '4k|any': { video_token: perThousand(0.008) } },
  },
  {
    provider: 'fal', model: 'bytedance/seedance-2.5/image-to-video', effectiveFrom: '2025-01-01', sourceUrl: FAL('bytedance/seedance-2.5/image-to-video'),
    prices: {}, variants: { 'sd|any': { video_token: perThousand(0.0214) }, '1080p|any': { video_token: perThousand(0.0234) } },
    note: '$0.0214 per 1K tokens at 480p/720p, $0.0234 at 1080p; tokens include input clip seconds when extending',
  },
  {
    provider: 'fal', model: 'bytedance/seedance-2.5/text-to-video', effectiveFrom: '2025-01-01', sourceUrl: FAL('bytedance/seedance-2.5/text-to-video'),
    prices: {}, variants: { 'sd|any': { video_token: perThousand(0.0214) }, '1080p|any': { video_token: perThousand(0.0234) } },
  },

  // ---- fal video tools
  falFlat('fal-ai/kling-video/lipsync/audio-to-video', { five_second_block: 0.014 }, '$0.014 per 5 s of input video, rounded up'),
  falFlat('fal-ai/kling-video/lipsync/text-to-video', { five_second_block: 0.014 }, '$0.014 per 5 s of input video, rounded up'),
  falFlat('fal-ai/seedvr/upscale/video', { megapixel: 0.001 }, '$0.001 per megapixel of output video (w × h × frames)'),
  falFlat('fal-ai/elevenlabs/tts/eleven-v3', { character: perThousand(0.1) }, '$0.10 per 1,000 characters'),
  falFlat('fal-ai/kling-video/v1/tts', { call: 0.007 }, '$0.007 per generation'),
  falFlat('fal-ai/lyria2', { call: 0.1 }, '$0.10 per 30-second generation'),
  falFlat('fal-ai/speech-to-text', { audio_second: 0.0008 }, '$0.0008 per second'),
  falFlat('fal-ai/ffmpeg-api/compose', { compute_second: 0.0002 }, '$0.0002 per compute second'),
  // These three pages display "$0 per compute second" (checked with a rendered
  // scrape on 2026-09-11). Recorded at $0 so the calls are still counted; if a
  // fal invoice shows otherwise, add a dated entry above this one.
  falFlat('fal-ai/ffmpeg-api/merge-videos', { compute_second: 0 }, 'page shows $0 per compute second'),
  falFlat('fal-ai/whisper', { compute_second: 0 }, 'page shows $0 per compute second'),
  falFlat('fal-ai/birefnet/v2', { compute_second: 0 }, 'page shows $0 per compute second'),

  // ---- fal image tools
  falFlat('fal-ai/ben/v2/image', { megapixel: 0.025 }, '$0.025 per megapixel of input'),

  // ---- PhotoRoom (verified 2026-09-11: Basic price per image)
  { provider: 'photoroom', model: 'sdk.photoroom.com/v1/segment', effectiveFrom: '2025-01-01', sourceUrl: 'https://www.photoroom.com/api/pricing', prices: { call: 0.02 } },

  // ---- Replicate (verified 2026-09-11 on each model's API page; all four are per output image)
  { provider: 'replicate', model: '851-labs/background-remover', effectiveFrom: '2025-01-01', sourceUrl: REPLICATE('851-labs/background-remover'), prices: { call: 0.00044 }, note: '2272 runs per $1' },
  { provider: 'replicate', model: 'recraft-ai/recraft-remove-background', effectiveFrom: '2025-01-01', sourceUrl: REPLICATE('recraft-ai/recraft-remove-background'), prices: { call: 0.01 }, note: '$0.01 per output image' },
  { provider: 'replicate', model: 'bria/remove-background', effectiveFrom: '2025-01-01', sourceUrl: REPLICATE('bria/remove-background'), prices: { call: 0.018 }, note: '$0.018 per output image' },
  { provider: 'replicate', model: 'nightmareai/real-esrgan', effectiveFrom: '2025-01-01', sourceUrl: REPLICATE('nightmareai/real-esrgan'), prices: { call: 0.002 }, note: '$2 per thousand output images' },
]

/**
 * Image output tokens OpenAI bills per generated 1024×1024 image by quality.
 * medium/low for 2.5 Flare and medium for gpt-image-2 were measured live
 * against the API on 2026-09-11 (usage.output_tokens_details.image_tokens);
 * the rest are OpenAI's published tiers. Other sizes scale by pixel area.
 * Used only for timeout estimates and the history backfill — live rows use
 * the provider's own usage report.
 */
export const IMAGE_OUTPUT_TOKENS: Record<string, Record<string, number>> = {
  'gpt-image-2.5-flare': { low: 196, medium: 439, high: 1756, xhigh: 3122, max: 7024, auto: 439 },
  'gpt-image-2.5-sunburst': { low: 196, medium: 439, high: 1756, xhigh: 3122, max: 7024, auto: 439 },
  'gpt-image-2': { low: 196, medium: 1756, high: 7024, auto: 1756 },
}

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
  /** USD, rounded to 6 places; null when the model has no rate. */
  costUsd: number | null
  confidence: 'rate' | 'unpriced'
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
