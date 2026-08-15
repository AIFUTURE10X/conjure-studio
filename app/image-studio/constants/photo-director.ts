import type { DirectorBrief, DirectorStep } from '@/lib/video/photo-director-schema'

/**
 * Photo Director static options — plain-language labels for the guided flow.
 * Pure data only (may exceed line limits per the constants exemption).
 */

export const DIRECTOR_STEPS: { key: DirectorStep; label: string }[] = [
  { key: 'upload', label: 'Photos' },
  { key: 'analysis', label: 'Analysis' },
  { key: 'brief', label: 'Your goals' },
  { key: 'concepts', label: 'Concepts' },
  { key: 'storyboard', label: 'Storyboard' },
  { key: 'preflight', label: 'Review & cost' },
  { key: 'generate', label: 'Clips' },
  { key: 'done', label: 'Done' },
]

export const MIN_PHOTOS = 2
export const MAX_PHOTOS = 6
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024 // pre-compression cap, mirrors FrameSlot

export const PURPOSE_OPTIONS: { value: DirectorBrief['purpose']; label: string }[] = [
  { value: 'reel', label: 'Instagram Reel' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'fb-ad', label: 'Facebook ad' },
  { value: 'listing', label: 'Hotel listing' },
  { value: 'hero', label: 'Website hero' },
  { value: 'other', label: 'General social post' },
]

export const GOAL_OPTIONS: { value: DirectorBrief['goal']; label: string }[] = [
  { value: 'showcase-room', label: 'Showcase the complete room' },
  { value: 'highlight-view', label: 'Highlight the view' },
  { value: 'luxury-atmosphere', label: 'Create a luxurious atmosphere' },
  { value: 'drive-bookings', label: 'Encourage bookings' },
  { value: 'explain-features', label: 'Explain room features' },
  { value: 'quick-tour', label: 'Quick visual tour' },
  { value: 'calm-lifestyle', label: 'Calm lifestyle video' },
]

export const DURATION_BUCKETS: {
  value: DirectorBrief['durationBucket']
  label: string
  /** Storyboards are built from ~6s shot atoms. */
  shotCount: number
  targetSeconds: number
}[] = [
  { value: '6-8', label: '6–8 seconds', shotCount: 1, targetSeconds: 7 },
  { value: '10-15', label: '10–15 seconds', shotCount: 2, targetSeconds: 12 },
  { value: '20-30', label: '20–30 seconds', shotCount: 4, targetSeconds: 24 },
]

export const MOOD_OPTIONS: { value: DirectorBrief['mood']; label: string }[] = [
  { value: 'peaceful-morning', label: 'Peaceful morning' },
  { value: 'warm-welcoming', label: 'Warm and welcoming' },
  { value: 'premium-boutique', label: 'Premium boutique hotel' },
  { value: 'romantic', label: 'Romantic getaway' },
  { value: 'bright-practical', label: 'Bright and practical' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'ai-choose', label: 'Let the AI choose' },
]

export const STRUCTURE_OPTIONS: { value: DirectorBrief['structure']; label: string; hint: string }[] = [
  { value: 'continuous-transition', label: 'One continuous transition', hint: 'The camera travels from photo 1 to photo 2 in a single move.' },
  { value: 'two-shot', label: 'Two separate shots', hint: 'Each photo is animated on its own, then joined with a cut.' },
  { value: 'multi-shot-reel', label: 'Multi-shot reel', hint: 'Wide shots plus close-up detail shots cropped from your photos.' },
  { value: 'ai-recommend', label: 'Let the AI recommend', hint: 'The AI picks the safest structure for your photos.' },
]

export const TOGGLE_DEFS: { key: keyof DirectorBrief['toggles']; label: string }[] = [
  { key: 'titleText', label: 'Add title text' },
  { key: 'captions', label: 'Add feature captions' },
  { key: 'cta', label: 'Add booking call to action' },
  { key: 'music', label: 'Add music' },
  { key: 'ambient', label: 'Add ambient audio' },
  { key: 'logo', label: 'Add hotel logo' },
  { key: 'specWatermark', label: 'Add "Spec Concept" watermark' },
]

export const DEFAULT_BRIEF: DirectorBrief = {
  purpose: 'reel',
  goal: 'showcase-room',
  durationBucket: '10-15',
  mood: 'ai-choose',
  structure: 'ai-recommend',
  toggles: {
    titleText: false,
    captions: false,
    cta: false,
    music: false,
    ambient: false,
    logo: false,
    specWatermark: false,
  },
  hotelName: '',
  location: '',
  message: '',
  ctaText: '',
}

/** Aspect ratio implied by the video's purpose (vertical social defaults to 9:16). */
export function aspectForPurpose(purpose: DirectorBrief['purpose']): string {
  switch (purpose) {
    case 'reel':
    case 'tiktok':
    case 'fb-ad':
      return '9:16'
    case 'listing':
    case 'hero':
      return '16:9'
    default:
      return '9:16'
  }
}

/** Review checklist shown for every generated clip. */
export const CLIP_CHECKLIST: { key: string; label: string }[] = [
  { key: 'same-room', label: 'Same room' },
  { key: 'furniture', label: 'Furniture preserved' },
  { key: 'architecture', label: 'Architecture preserved' },
  { key: 'view', label: 'Exterior view preserved' },
  { key: 'no-new-objects', label: 'No new objects' },
  { key: 'no-morphing', label: 'No visible morphing' },
  { key: 'natural-motion', label: 'Camera movement feels natural' },
]
