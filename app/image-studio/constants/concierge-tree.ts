import { VIDEO_MODELS } from '@/lib/video/providers'
import { videoGenerationCost } from '@/lib/credits/cost-map'
import type { StudioMode } from '../context/studio-types'
import type { VideoSettingsValue } from './video-settings-defaults'

/**
 * Concierge decision tree: goal → (optional source question) → plan.
 * Plans reference real model ids and derive credit estimates from the live
 * cost map, so adding/repricing a model updates the Concierge automatically.
 */

/** window CustomEvent fired when a video job completes (checklist listens). */
export const VIDEO_COMPLETED_EVENT = 'conjure:video-completed'

export type ConciergeGoalId = 'clip' | 'product' | 'talking' | 'film' | 'logo-sting' | 'image-only'

export type ConciergeSourceId = 'have-image' | 'make-image' | 'no-image'

/** How a checklist step ticks itself: from real studio state, or manually. */
export type ConciergeAutoTick = 'mode' | 'image-generated' | 'start-frame' | 'clip-completed'

export interface ConciergeStep {
  key: string
  label: string
  auto?: ConciergeAutoTick
}

export interface ConciergePlan {
  id: string
  title: string
  /** Studio mode the plan starts in ("Set up my studio" switches here). */
  mode: StudioMode
  /** Video clip settings to prefill (persist even while working in image mode). */
  video?: VideoSettingsValue
  /** Starter motion prompt — applied only if the video prompt box is empty. */
  promptSeed?: string
  /** AI-written video prompt — overwrites the box (the user asked for a setup). */
  videoPrompt?: string
  /** AI-written image prompt for plans that start in image mode. */
  imagePrompt?: string
  /** Aspect ratio for the image generator (matched to the video aspect). */
  imageAspectRatio?: string
  /** One-line rationale for the model/settings choice. */
  why: string
  /** Recommend drafting on Seedance Fast before the final model. */
  draftFirst?: boolean
  steps: ConciergeStep[]
}

export interface ConciergeGoal {
  id: ConciergeGoalId
  label: string
  sublabel: string
  /** Goals with several entry points ask where the visuals come from. */
  asksSource: boolean
}

export const CONCIERGE_GOALS: ConciergeGoal[] = [
  { id: 'clip', label: 'A short video clip', sublabel: 'From a photo or an idea', asksSource: true },
  { id: 'product', label: 'A product video', sublabel: 'Ad, reveal, or showcase', asksSource: true },
  { id: 'talking', label: 'A talking person', sublabel: 'Dialogue with lip sync', asksSource: true },
  { id: 'film', label: 'A narrated film', sublabel: 'Multiple scenes, voice + music', asksSource: false },
  { id: 'logo-sting', label: 'An animated logo', sublabel: 'Brand reveal sting', asksSource: false },
  { id: 'image-only', label: 'Just an image', sublabel: 'No video needed', asksSource: false },
]

/** One-tap chip → the freeform sentence it sends into the concierge chat. */
export const GOAL_STARTER_MESSAGES: Record<ConciergeGoalId, string> = {
  clip: 'I want to make a short video clip',
  product: 'I want to make a product video',
  talking: 'I want to make a video of a person talking',
  film: 'I want to make a narrated film with multiple scenes',
  'logo-sting': 'I want to make an animated logo reveal',
  'image-only': 'I just want to generate an image',
}

const kling: VideoSettingsValue = { model: 'kling-3', duration: 5, resolution: '1080p', aspectRatio: 'auto', generateAudio: true }
const seedanceQuiet: VideoSettingsValue = { model: 'seedance-2', duration: 5, resolution: '1080p', aspectRatio: 'auto', generateAudio: false }
const veoTalk: VideoSettingsValue = { model: 'veo-3.1', duration: 8, resolution: '1080p', aspectRatio: 'auto', generateAudio: true }
const veoText: VideoSettingsValue = { model: 'veo-3.1', duration: 6, resolution: '1080p', aspectRatio: 'auto', generateAudio: true }

const PLANS: Record<string, ConciergePlan> = {
  'clip:have-image': {
    id: 'clip:have-image',
    title: 'Photo → cinematic clip',
    mode: 'video',
    video: kling,
    why: 'Kling 3.0 Pro has the strongest cinematic motion for image-to-video.',
    draftFirst: true,
    steps: [
      { key: 'frame', label: 'Put your image in the Start frame slot (upload or drag in)', auto: 'start-frame' },
      { key: 'motion', label: 'Describe motion only — one camera chip + one action, under 45 words' },
      { key: 'draft', label: 'Optional: test the idea on Seedance Fast first (15 credits)' },
      { key: 'generate', label: 'Generate the final clip', auto: 'clip-completed' },
    ],
  },
  'clip:make-image': {
    id: 'clip:make-image',
    title: 'Idea → image → clip',
    mode: 'image',
    video: kling,
    why: 'Generate the scene as an image first — cheap to iterate, then animate the keeper.',
    draftFirst: true,
    steps: [
      { key: 'image', label: 'Generate the scene (Quick Recipes give one-tap looks)', auto: 'image-generated' },
      { key: 'animate', label: 'Press Animate on the best result', auto: 'start-frame' },
      { key: 'motion', label: 'A motion prompt auto-writes — keep one camera move' },
      { key: 'generate', label: 'Generate the clip', auto: 'clip-completed' },
    ],
  },
  'clip:no-image': {
    id: 'clip:no-image',
    title: 'Text → video',
    mode: 'video',
    video: veoText,
    why: 'Veo 3.1 is the strongest pure text-to-video model, with native audio.',
    draftFirst: true,
    steps: [
      { key: 'prompt', label: 'Describe the scene AND the motion (no frames needed)' },
      { key: 'draft', label: 'Optional: draft on Seedance Fast first (15 credits)' },
      { key: 'generate', label: 'Generate on Veo 3.1', auto: 'clip-completed' },
    ],
  },
  'product:have-image': {
    id: 'product:have-image',
    title: 'Product shot → reveal',
    mode: 'video',
    video: seedanceQuiet,
    why: 'Seedance 2.0 is the best quality-per-credit at the final tier, with 4K and end frames.',
    steps: [
      { key: 'frame', label: 'Put your product shot in the Start frame slot', auto: 'start-frame' },
      { key: 'end', label: 'Optional: end frame for a controlled reveal (closed → open)' },
      { key: 'motion', label: 'Use the Orbit or Push In chip + one surface action' },
      { key: 'generate', label: 'Generate the clip', auto: 'clip-completed' },
    ],
  },
  'product:make-image': {
    id: 'product:make-image',
    title: 'Product image → reveal',
    mode: 'image',
    video: seedanceQuiet,
    why: 'Make a clean product shot first, then animate it on Seedance 2.0.',
    steps: [
      { key: 'image', label: 'Generate a clean product shot (studio light, plain backdrop)', auto: 'image-generated' },
      { key: 'animate', label: 'Press Animate on the best one', auto: 'start-frame' },
      { key: 'motion', label: 'Use the Orbit or Push In camera chip' },
      { key: 'generate', label: 'Generate the clip', auto: 'clip-completed' },
    ],
  },
  'talking:have-image': {
    id: 'talking:have-image',
    title: 'Portrait → talking video',
    mode: 'video',
    video: veoTalk,
    why: 'Veo 3.1 does synced dialogue natively — and Extend adds +7s per pass.',
    steps: [
      { key: 'frame', label: 'Put the portrait in the Start frame slot', auto: 'start-frame' },
      { key: 'dialogue', label: 'Write the dialogue in quotes inside the prompt' },
      { key: 'generate', label: 'Generate the clip', auto: 'clip-completed' },
      { key: 'extend', label: 'Need it longer? Extend on the finished clip (+7s each pass)' },
    ],
  },
  'talking:make-image': {
    id: 'talking:make-image',
    title: 'Portrait → talking video',
    mode: 'image',
    video: veoTalk,
    why: 'Generate the portrait first, then Veo 3.1 handles synced dialogue.',
    steps: [
      { key: 'image', label: 'Generate the portrait (front-facing works best)', auto: 'image-generated' },
      { key: 'animate', label: 'Press Animate on the best one', auto: 'start-frame' },
      { key: 'dialogue', label: 'Write the dialogue in quotes inside the prompt' },
      { key: 'generate', label: 'Generate the clip', auto: 'clip-completed' },
    ],
  },
  'film': {
    id: 'film',
    title: 'Story → narrated film',
    mode: 'video',
    video: seedanceQuiet,
    why: 'Story Mode scripts scenes and generates every frame and clip; Assemble Film adds narration + music.',
    steps: [
      { key: 'story', label: 'Open Story Mode (top of the video panel) and describe your story' },
      { key: 'review', label: 'Review the script — Refine with AI edits it conversationally' },
      { key: 'clips', label: 'Generate the scene clips', auto: 'clip-completed' },
      { key: 'assemble', label: 'Assemble Film: stitch clips, add narration and music' },
    ],
  },
  'logo-sting': {
    id: 'logo-sting',
    title: 'Logo sting',
    mode: 'image',
    video: seedanceQuiet,
    promptSeed: 'the scattered particles swirl inward and assemble into the glowing logo as the camera pushes in',
    why: 'Start/end frames lock the transition: scattered pieces morph into the finished logo.',
    steps: [
      { key: 'frames', label: 'Generate two frames: logo scattered, logo assembled', auto: 'image-generated' },
      { key: 'pair', label: 'Animate the scattered one, End Frame the assembled one', auto: 'start-frame' },
      { key: 'generate', label: 'Generate the clip (motion prompt is pre-filled)', auto: 'clip-completed' },
    ],
  },
  'image-only': {
    id: 'image-only',
    title: 'Image generation',
    mode: 'image',
    why: 'No video settings needed — everything happens in the image generator.',
    steps: [
      { key: 'prompt', label: 'Describe subject + style, or tap a Quick Recipe' },
      { key: 'generate', label: 'Generate', auto: 'image-generated' },
      { key: 'refine', label: 'Refine with More Like This, AI Edit, or Upscale 4K' },
    ],
  },
}

export function getConciergePlanById(planId: string): ConciergePlan | null {
  return PLANS[planId] ?? null
}

export function resolveConciergePlan(goal: ConciergeGoalId, source: ConciergeSourceId | null): ConciergePlan {
  const goalConfig = CONCIERGE_GOALS.find((g) => g.id === goal)
  const key = goalConfig?.asksSource ? `${goal}:${source ?? 'make-image'}` : goal
  return PLANS[key] ?? PLANS['clip:make-image']
}

export function planModelLabel(plan: ConciergePlan): string {
  if (!plan.video) return 'Image models'
  return VIDEO_MODELS[plan.video.model]?.label ?? plan.video.model
}

/** Live credit estimate straight from the cost map. */
export function planCostLine(plan: ConciergePlan): string {
  if (!plan.video) return '1–4 credits per image'
  const { model, duration, resolution, generateAudio } = plan.video
  const finalCost = videoGenerationCost(model, duration, resolution, generateAudio)
  if (!plan.draftFirst) return `~${finalCost} credits per clip`
  const draftCost = videoGenerationCost('seedance-fast', 5, '1080p', false)
  return `~${draftCost} draft + ~${finalCost} final`
}
