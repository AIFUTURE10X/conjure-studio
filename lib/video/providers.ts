/**
 * Video model registry — config-driven so adding a model is a new entry,
 * not new plumbing. Each entry resolves the fal endpoint for a request and
 * maps our generic params onto that endpoint's input schema (param names
 * differ per model: Kling uses start_image_url, Veo uses first_frame_url on
 * a dedicated first+last endpoint, Seedance uses image_url/end_image_url).
 *
 * Endpoint IDs and schemas verified against fal.ai docs 2026-07-20.
 */

export type VideoModelId = 'seedance-fast' | 'seedance-2' | 'kling-3' | 'veo-3.1'

export type VideoResolution = '480p' | '720p' | '1080p' | '4k'

export interface VideoGenerationParams {
  prompt: string
  /** Start frame URL (https or fal storage). Absent = text-to-video. */
  startImageUrl?: string
  /** End frame URL — only honored by endFrame-capable models. */
  endImageUrl?: string
  durationSeconds: number
  resolution: VideoResolution
  aspectRatio: string
  generateAudio: boolean
}

export interface VideoExtendParams {
  prompt: string
  videoUrl: string
  resolution: VideoResolution
  aspectRatio: string
  generateAudio: boolean
}

export interface VideoModelConfig {
  id: VideoModelId
  label: string
  tier: 'draft' | 'final'
  description: string
  capabilities: {
    textToVideo: boolean
    imageToVideo: boolean
    endFrame: boolean
    audio: boolean
    resolutions: VideoResolution[]
    /** Supported clip lengths in seconds (UI options; input is clamped to range). */
    durations: number[]
  }
  /**
   * How clips get longer than one pass allows: 'native' models extend the
   * same file server-side (Veo, ~+7s per pass, up to ~148s total); the rest
   * chain by using the last frame as the next clip's start frame.
   */
  extendMode: 'native' | 'frame-chain'
  /** Native extension request (extendMode 'native' only). */
  buildExtend?: (params: VideoExtendParams) => { endpoint: string; input: Record<string, unknown>; addedSeconds: number }
  endpoint: (params: VideoGenerationParams) => string
  buildInput: (params: VideoGenerationParams) => Record<string, unknown>
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(Math.round(value), min), max)

/** Snap to the closest value in a list (for models with fixed duration steps). */
const nearest = (value: number, options: number[]) =>
  options.reduce((best, option) => (Math.abs(option - value) < Math.abs(best - value) ? option : best))

export const VIDEO_MODELS: Record<VideoModelId, VideoModelConfig> = {
  'seedance-fast': {
    id: 'seedance-fast',
    label: 'Seedance Fast',
    tier: 'draft',
    description: 'ByteDance Seedance 1.0 Pro Fast — cheap, quick drafts up to 1080p.',
    capabilities: {
      textToVideo: true,
      imageToVideo: true,
      endFrame: false,
      audio: false,
      resolutions: ['480p', '720p', '1080p'],
      durations: [5, 6, 8, 10, 12],
    },
    extendMode: 'frame-chain',
    endpoint: (p) =>
      p.startImageUrl
        ? 'fal-ai/bytedance/seedance/v1/pro/fast/image-to-video'
        : 'fal-ai/bytedance/seedance/v1/pro/fast/text-to-video',
    buildInput: (p) => ({
      prompt: p.prompt,
      resolution: p.resolution === '4k' ? '1080p' : p.resolution,
      duration: String(clamp(p.durationSeconds, 2, 12)),
      // text-to-video has no 'auto' option
      aspect_ratio: p.startImageUrl ? p.aspectRatio : (p.aspectRatio === 'auto' ? '16:9' : p.aspectRatio),
      ...(p.startImageUrl ? { image_url: p.startImageUrl } : {}),
    }),
  },

  'seedance-2': {
    id: 'seedance-2',
    label: 'Seedance 2.0',
    tier: 'final',
    description: 'ByteDance Seedance 2.0 — top quality up to 4K with native audio and end-frame support.',
    capabilities: {
      textToVideo: true,
      imageToVideo: true,
      endFrame: true,
      audio: true,
      resolutions: ['480p', '720p', '1080p', '4k'],
      durations: [5, 6, 8, 10, 12, 15],
    },
    extendMode: 'frame-chain',
    endpoint: (p) =>
      p.startImageUrl
        ? 'bytedance/seedance-2.0/image-to-video'
        : 'bytedance/seedance-2.0/text-to-video',
    buildInput: (p) => ({
      prompt: p.prompt,
      resolution: p.resolution,
      duration: String(clamp(p.durationSeconds, 4, 15)),
      aspect_ratio: p.aspectRatio,
      generate_audio: p.generateAudio,
      ...(p.startImageUrl ? { image_url: p.startImageUrl } : {}),
      ...(p.startImageUrl && p.endImageUrl ? { end_image_url: p.endImageUrl } : {}),
    }),
  },

  'kling-3': {
    id: 'kling-3',
    label: 'Kling 3.0 Pro',
    tier: 'final',
    description: 'Kling 3.0 Pro — cinematic motion, native audio, end-frame transitions. Resolution is model-managed.',
    capabilities: {
      textToVideo: true,
      imageToVideo: true,
      endFrame: true,
      audio: true,
      // Kling v3 has no resolution input; shown as a single fixed option.
      resolutions: ['1080p'],
      durations: [5, 6, 8, 10, 12, 15],
    },
    extendMode: 'frame-chain',
    endpoint: (p) =>
      p.startImageUrl
        ? 'fal-ai/kling-video/v3/pro/image-to-video'
        : 'fal-ai/kling-video/v3/pro/text-to-video',
    buildInput: (p) => ({
      prompt: p.prompt,
      duration: String(clamp(p.durationSeconds, 3, 15)),
      generate_audio: p.generateAudio,
      ...(p.startImageUrl ? { start_image_url: p.startImageUrl } : {}),
      ...(p.startImageUrl && p.endImageUrl ? { end_image_url: p.endImageUrl } : {}),
    }),
  },

  'veo-3.1': {
    id: 'veo-3.1',
    label: 'Veo 3.1',
    tier: 'final',
    description: 'Google Veo 3.1 — best-in-class realism and synchronized dialogue/audio. Premium price.',
    capabilities: {
      textToVideo: true,
      imageToVideo: true,
      endFrame: true,
      audio: true,
      resolutions: ['720p', '1080p', '4k'],
      durations: [4, 6, 8],
    },
    extendMode: 'native',
    buildExtend: (p) => ({
      endpoint: 'fal-ai/veo3.1/extend-video',
      input: {
        prompt: p.prompt,
        video_url: p.videoUrl,
        duration: '7s',
        // extend-video supports 720p/1080p only
        resolution: p.resolution === '1080p' || p.resolution === '4k' ? '1080p' : '720p',
        aspect_ratio: p.aspectRatio === '16:9' || p.aspectRatio === '9:16' ? p.aspectRatio : 'auto',
        generate_audio: p.generateAudio,
      },
      addedSeconds: 7,
    }),
    endpoint: (p) => {
      if (p.startImageUrl && p.endImageUrl) return 'fal-ai/veo3.1/first-last-frame-to-video'
      if (p.startImageUrl) return 'fal-ai/veo3.1/image-to-video'
      return 'fal-ai/veo3.1'
    },
    buildInput: (p) => {
      const aspect = p.aspectRatio === '16:9' || p.aspectRatio === '9:16' ? p.aspectRatio : 'auto'
      const base = {
        prompt: p.prompt,
        duration: `${nearest(p.durationSeconds, [4, 6, 8])}s`,
        resolution: p.resolution === '480p' ? '720p' : p.resolution,
        aspect_ratio: aspect,
        generate_audio: p.generateAudio,
      }
      if (p.startImageUrl && p.endImageUrl) {
        return { ...base, first_frame_url: p.startImageUrl, last_frame_url: p.endImageUrl }
      }
      if (p.startImageUrl) {
        return { ...base, image_url: p.startImageUrl }
      }
      return base
    },
  },
}

export const VIDEO_MODEL_IDS = Object.keys(VIDEO_MODELS) as VideoModelId[]

export function getVideoModel(id: string): VideoModelConfig | undefined {
  return VIDEO_MODELS[id as VideoModelId]
}
