/**
 * Shared types for the provider usage ledger (issue #50).
 *
 * Type-only module: it compiles to nothing, so the contract check and the
 * backfill script can transpile the rate card without resolving it.
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
