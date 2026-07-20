/**
 * Credit costs per operation. Config-driven so pricing can be tuned without
 * touching route code. Rough anchor: 1 credit ≈ $0.03–0.05 retail; costs
 * scale with what the providers charge us per call.
 */

export const SIGNUP_GRANT_CREDITS = 30

export type ImageModelId =
  | 'gemini-3.1-flash-image-preview'
  | 'gemini-3-pro-image-preview'
  | 'gemini-2.5-flash-image'
  | 'gpt-image-2'

export type ImageSize = '1K' | '2K' | '4K'

const IMAGE_GENERATION_COSTS: Record<ImageModelId, Record<ImageSize, number>> = {
  'gemini-3.1-flash-image-preview': { '1K': 1, '2K': 2, '4K': 4 },
  'gemini-2.5-flash-image': { '1K': 1, '2K': 2, '4K': 4 },
  'gemini-3-pro-image-preview': { '1K': 2, '2K': 3, '4K': 5 },
  'gpt-image-2': { '1K': 4, '2K': 4, '4K': 4 },
}

/** Cost of generating `count` images on a model at a size. Unknown inputs fall back to the most expensive tier so misconfig never undercharges. */
export function imageGenerationCost(model: string, size: string, count: number): number {
  const modelCosts = IMAGE_GENERATION_COSTS[model as ImageModelId]
  const perImage = modelCosts?.[size as ImageSize] ?? 5
  return perImage * Math.max(1, count)
}

export const TRANSFORM_COSTS = {
  removeBackground: 1,
  upscale: 2,
  vectorize: 1,
  recolor: 1,
  mockupPhoto: 1,
  brandKit: 3,
  thumbnailEdit: 2,
  imageEdit: 2,
} as const

export type TransformOperation = keyof typeof TRANSFORM_COSTS

export function transformCost(operation: TransformOperation): number {
  return TRANSFORM_COSTS[operation]
}

/**
 * Video credits per second, keyed by our model ids (lib/video/providers.ts).
 * Anchored to fal's per-second pricing at ~2.5x retail: Kling $0.112–0.168/s,
 * Veo $0.20–0.40/s, Seedance Fast ~$0.05/s, Seedance 2.0 mid-tier.
 */
const VIDEO_CREDITS_PER_SECOND: Record<string, { base: number; audio: number }> = {
  'seedance-fast': { base: 3, audio: 3 },
  'seedance-2': { base: 6, audio: 8 },
  'kling-3': { base: 8, audio: 10 },
  'veo-3.1': { base: 12, audio: 20 },
}

/** Post-production video tools (flat per-run). */
export const VIDEO_TOOL_COSTS = {
  lipsync: 10,
  videoUpscale: 15,
} as const

export type VideoToolOperation = keyof typeof VIDEO_TOOL_COSTS

export function videoToolCost(operation: VideoToolOperation): number {
  return VIDEO_TOOL_COSTS[operation]
}

/** Cost of one video clip. Unknown models fall back to the most expensive rate so misconfig never undercharges. */
export function videoGenerationCost(
  model: string,
  durationSeconds: number,
  resolution: string,
  withAudio: boolean,
): number {
  const rates = VIDEO_CREDITS_PER_SECOND[model] ?? { base: 20, audio: 20 }
  const perSecond = withAudio ? rates.audio : rates.base
  const seconds = Math.min(Math.max(Math.round(durationSeconds) || 5, 2), 15)
  const resolutionMultiplier = resolution.toLowerCase() === '4k' ? 2 : 1
  return Math.ceil(perSecond * seconds * resolutionMultiplier)
}
