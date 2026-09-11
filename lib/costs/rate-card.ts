/**
 * The provider rate card (issue #50): one entry per provider + model/endpoint
 * with the date it took effect and the official page it was verified against.
 *
 * Units are USD per SINGLE unit (per token, per second, per call), never per
 * million — the entries spell out the conversion so they can be checked
 * against the source page at a glance. Add a new entry with a later
 * `effectiveFrom` when a price changes; never edit an old one. The initial
 * entries are dated 2025-01-01 so the history backfill (rows back to 2025-11)
 * prices against today's verified rates rather than reading as unpriced; they
 * are the earliest rates this app has verified, not a claim about what
 * providers charged in 2025.
 *
 * Pure data (type-only imports) so scripts can transpile and execute it.
 */

import type { RateCardEntry, RateUnit } from './usage-types'

// Divide rather than multiply by a reciprocal: 30 / 1e6 is exactly 0.00003 in
// IEEE-754, 30 * (1 / 1e6) is 0.0000299…, and stored unit prices should read
// like the source page.
const perMillion = (usd: number) => usd / 1_000_000
const perThousand = (usd: number) => usd / 1_000

const OPENAI_PRICING = 'https://developers.openai.com/api/docs/pricing'
const GEMINI_PRICING = 'https://ai.google.dev/gemini-api/docs/pricing'
const FAL = (endpoint: string) => `https://fal.ai/models/${endpoint}`
const REPLICATE = (slug: string) => `https://replicate.com/${slug}`
const INITIAL = '2025-01-01'

function openaiImageEntry(model: string, sourceUrl: string): RateCardEntry {
  // Verified 2026-09-11: text in $5.00/1M (cached $1.25), image in $8.00/1M
  // (cached $2.00), image out $30.00/1M — identical for 2.5 Flare, 2.5 Sunburst and 2.
  return {
    provider: 'openai',
    model,
    effectiveFrom: INITIAL,
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

function openaiTextEntry(model: string, input: number, cached: number, output: number, effectiveFrom = INITIAL, note?: string): RateCardEntry {
  return {
    provider: 'openai',
    model,
    effectiveFrom,
    sourceUrl: OPENAI_PRICING,
    prices: { text_token_in: perMillion(input), cached_token_in: perMillion(cached), text_token_out: perMillion(output) },
    note,
  }
}

function geminiImageEntry(model: string, input: number, textOut: number, imageOut: number, perImage: Record<string, number>): RateCardEntry {
  return {
    provider: 'gemini',
    model,
    effectiveFrom: INITIAL,
    sourceUrl: GEMINI_PRICING,
    prices: { text_token_in: perMillion(input), image_token_in: perMillion(input), text_token_out: perMillion(textOut), image_token_out: perMillion(imageOut) },
    perImage,
  }
}

function falPerSecond(endpoint: string, variants: Record<string, number>, note?: string): RateCardEntry {
  return {
    provider: 'fal',
    model: endpoint,
    effectiveFrom: INITIAL,
    sourceUrl: FAL(endpoint),
    prices: {},
    variants: Object.fromEntries(Object.entries(variants).map(([key, usd]) => [key, { second: usd }])),
    note,
  }
}

function falFlat(endpoint: string, prices: Partial<Record<RateUnit, number>>, note?: string): RateCardEntry {
  return { provider: 'fal', model: endpoint, effectiveFrom: INITIAL, sourceUrl: FAL(endpoint), prices, note }
}

function falTokens(endpoint: string, variants: Record<string, number>, note?: string): RateCardEntry {
  return {
    provider: 'fal',
    model: endpoint,
    effectiveFrom: INITIAL,
    sourceUrl: FAL(endpoint),
    prices: {},
    variants: Object.fromEntries(Object.entries(variants).map(([key, usdPerThousand]) => [key, { video_token: perThousand(usdPerThousand) }])),
    note,
  }
}

function replicatePerImage(slug: string, usd: number, note: string): RateCardEntry {
  return { provider: 'replicate', model: slug, effectiveFrom: INITIAL, sourceUrl: REPLICATE(slug), prices: { call: usd }, note }
}

const VEO_STANDARD = { 'sd|silent': 0.2, 'sd|audio': 0.4, '4k|silent': 0.4, '4k|audio': 0.6 }
const KLING_V3_PRO = { 'any|silent': 0.112, 'any|audio': 0.168 }
const SEEDANCE_2 = { 'sd|any': 0.014, '4k|any': 0.008 }
const SEEDANCE_2_5 = { 'sd|any': 0.0214, '1080p|any': 0.0234 }

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
  openaiTextEntry('gpt-5.6-sol', 4.0, 0.4, 20.0, INITIAL, 'promotional pricing through 2026-11-21'),
  openaiTextEntry('gpt-5.6-sol', 5.0, 0.5, 30.0, '2026-11-22', 'list price after the promotion'),

  // ---- Gemini image models (verified 2026-09-11): input, text out, image out per 1M; per-image by size
  geminiImageEntry('gemini-3.1-flash-image-preview', 0.5, 3.0, 60.0, { '0.5K': 0.045, '1K': 0.067, '2K': 0.101, '4K': 0.151 }),
  geminiImageEntry('gemini-3-pro-image-preview', 2.0, 12.0, 120.0, { '1K': 0.134, '2K': 0.134, '4K': 0.24 }),
  geminiImageEntry('gemini-2.5-flash-image', 0.3, 2.5, 30.0, { '1K': 0.039 }),

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
  falTokens('bytedance/seedance-2.0/image-to-video', SEEDANCE_2, '$0.014 per 1K tokens up to 1080p, $0.008 per 1K tokens at 4k; audio included'),
  falTokens('bytedance/seedance-2.0/text-to-video', SEEDANCE_2),
  falTokens('bytedance/seedance-2.5/image-to-video', SEEDANCE_2_5, '$0.0214 per 1K tokens at 480p/720p, $0.0234 at 1080p; tokens include input clip seconds when extending'),
  falTokens('bytedance/seedance-2.5/text-to-video', SEEDANCE_2_5),

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
  { provider: 'photoroom', model: 'sdk.photoroom.com/v1/segment', effectiveFrom: INITIAL, sourceUrl: 'https://www.photoroom.com/api/pricing', prices: { call: 0.02 } },

  // ---- Replicate (verified 2026-09-11 on each model's API page; all four are per output image)
  replicatePerImage('851-labs/background-remover', 0.00044, '2272 runs per $1'),
  replicatePerImage('recraft-ai/recraft-remove-background', 0.01, '$0.01 per output image'),
  replicatePerImage('bria/remove-background', 0.018, '$0.018 per output image'),
  replicatePerImage('nightmareai/real-esrgan', 0.002, '$2 per thousand output images'),
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
