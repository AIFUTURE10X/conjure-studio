import type { VideoModelId, VideoResolution } from '@/lib/video/providers'

/** Clip settings for the video generator (shared by canvas, presets, story mode). */
export interface VideoSettingsValue {
  model: VideoModelId
  duration: number
  resolution: VideoResolution
  aspectRatio: string
  generateAudio: boolean
}

export const DEFAULT_VIDEO_SETTINGS: VideoSettingsValue = {
  model: 'seedance-fast',
  duration: 5,
  resolution: '1080p',
  aspectRatio: 'auto',
  generateAudio: false,
}
