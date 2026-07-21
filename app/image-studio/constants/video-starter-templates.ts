import type { VideoSettingsValue } from './video-settings-defaults'
import type { GeneratePreset, SavedGenerateParams } from './settings-defaults'

/**
 * Starter video templates: professionally-written recipes shown read-only in
 * the Templates browser so a new user gets day-one value and learns what a
 * good motion prompt looks like. Loading one applies prompt + clip settings;
 * they are never written to the user's preset list.
 */

/** Fill the non-video fields so a video template is a complete SavedGenerateParams. */
export function videoTemplateParams(input: {
  prompt: string
  video: VideoSettingsValue
  category?: string
  thumbnailUrl?: string
}): SavedGenerateParams {
  return {
    mainPrompt: input.prompt,
    negativePrompt: '',
    aspectRatio: input.video.aspectRatio,
    selectedStylePreset: '',
    selectedCameraAngle: '',
    selectedCameraLens: '',
    styleStrength: 'moderate',
    imageSize: '1K',
    selectedModel: '',
    video: input.video,
    ...(input.category ? { category: input.category } : {}),
    ...(input.thumbnailUrl ? { thumbnailUrl: input.thumbnailUrl } : {}),
  }
}

interface StarterTemplate {
  name: string
  category: string
  prompt: string
  video: VideoSettingsValue
}

const STARTERS: StarterTemplate[] = [
  {
    name: 'Product orbit reveal',
    category: 'Product Ads',
    prompt: 'camera orbits smoothly around the product as studio light sweeps across its surface, subtle reflections gliding over the material',
    video: { model: 'seedance-2', duration: 5, resolution: '1080p', aspectRatio: '1:1', generateAudio: false },
  },
  {
    name: 'Hero push-in',
    category: 'Product Ads',
    prompt: 'slow cinematic push-in toward the product as fine dust particles drift through a warm beam of light behind it',
    video: { model: 'kling-3', duration: 5, resolution: '1080p', aspectRatio: '16:9', generateAudio: true },
  },
  {
    name: 'TikTok hook zoom',
    category: 'Social Vertical',
    prompt: 'sudden dramatic crash zoom toward the subject with snappy handheld energy, quick and attention-grabbing',
    video: { model: 'seedance-fast', duration: 5, resolution: '1080p', aspectRatio: '9:16', generateAudio: false },
  },
  {
    name: 'Talking to camera',
    category: 'Talking Head',
    prompt: 'the person looks into the camera and speaks: "Write your line here." Natural head movement, subtle blinks, soft studio lighting',
    video: { model: 'veo-3.1', duration: 8, resolution: '1080p', aspectRatio: '16:9', generateAudio: true },
  },
  {
    name: 'Logo particle assembly',
    category: 'Logo & Brand',
    prompt: 'the scattered particles swirl inward and assemble into the glowing logo as the camera slowly pushes in',
    video: { model: 'seedance-2', duration: 5, resolution: '1080p', aspectRatio: '16:9', generateAudio: false },
  },
  {
    name: 'Steam & drizzle overhead',
    category: 'Food',
    prompt: 'slow overhead push-in as steam rises from the dish and a hand drizzles sauce across the plate in one smooth motion',
    video: { model: 'kling-3', duration: 5, resolution: '1080p', aspectRatio: '9:16', generateAudio: true },
  },
  {
    name: 'Interior FPV walkthrough',
    category: 'Real Estate',
    prompt: 'smooth FPV drone shot gliding through the interior as sunlight streams through the windows, curtains moving gently',
    video: { model: 'kling-3', duration: 10, resolution: '1080p', aspectRatio: '16:9', generateAudio: false },
  },
  {
    name: 'Landscape crane reveal',
    category: 'Travel',
    prompt: 'camera cranes upward over the valley as clouds drift and their shadows slide slowly across the hills below',
    video: { model: 'seedance-2', duration: 8, resolution: '1080p', aspectRatio: '16:9', generateAudio: true },
  },
]

export const VIDEO_STARTER_TEMPLATES: GeneratePreset[] = STARTERS.map((starter, index) => ({
  id: `starter-video-${index}`,
  name: starter.name,
  createdAt: 0,
  source: 'video',
  params: videoTemplateParams({
    prompt: starter.prompt,
    video: starter.video,
    category: starter.category,
  }),
}))

export function isStarterTemplate(preset: GeneratePreset): boolean {
  return preset.id.startsWith('starter-video-')
}
