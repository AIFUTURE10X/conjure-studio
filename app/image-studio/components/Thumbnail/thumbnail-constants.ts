/**
 * Thumbnail mode — types, defaults, templates, and text presets.
 *
 * The stage is a fixed 1280×720 (YouTube) coordinate space. Layer positions
 * are stored as percentages of the stage so they stay resolution-independent
 * and export cleanly at full size.
 */

export const THUMB_WIDTH = 1280
export const THUMB_HEIGHT = 720
export const THUMB_STORAGE_KEY = 'thumbnail-config-v1'

export type BackgroundKind = 'solid' | 'gradient' | 'image'
export type TextPresetId = 'pop' | 'outline' | 'shadow' | 'block'

export interface ThumbnailBackground {
  kind: BackgroundKind
  color: string
  gradient: [string, string]
  imageUrl?: string
  /** Photo adjustments applied to an image background. */
  adjust?: ImageAdjust
  /** Darken overlay opacity 0–80 (% black scrim) for legibility behind text. */
  scrim?: number
}

export interface ThumbnailSubject {
  url: string
  /** Center position as a percentage of the stage (0–100). */
  x: number
  y: number
  /** Width as a percentage of stage width. */
  scale: number
  flip: boolean
  /** Photo adjustments (brightness/contrast/etc.). */
  adjust?: ImageAdjust
  /** Pop effects — drop shadow / outline / glow on the cutout. */
  fx?: SubjectFx
}

export interface ThumbnailHighlight {
  color: string
  /** 0–100 (square → pill). */
  roundness: number
  /** 0–100 box opacity. */
  opacity: number
}

export interface ThumbnailHeadline {
  text: string
  preset: TextPresetId
  color: string
  /** Center position as a percentage of the stage (0–100). */
  x: number
  y: number
  /** Font size as a percentage of stage height. */
  size: number
  rotation: number
  uppercase: boolean
  /** Font id from THUMBNAIL_FONTS (defaults to 'geist'). */
  font?: string
  /** Gradient text fill (two colors) when set. */
  gradient?: [string, string] | null
  /** Colored highlight box behind the text (Canva "Background" effect). */
  highlight?: ThumbnailHighlight | null
}

export interface ThumbnailConfig {
  templateId: string
  background: ThumbnailBackground
  subject: ThumbnailSubject | null
  headline: ThumbnailHeadline
  stickers: ThumbnailSticker[]
}

export const TEXT_PRESETS: { id: TextPresetId; label: string }[] = [
  { id: 'pop', label: 'Pop' },
  { id: 'outline', label: 'Outline' },
  { id: 'shadow', label: 'Shadow' },
  { id: 'block', label: 'Block' },
]

export const DEFAULT_CONFIG: ThumbnailConfig = {
  templateId: 'text-left',
  background: { kind: 'gradient', color: '#0b1220', gradient: ['#7c3aed', '#db2777'] },
  subject: null,
  headline: {
    text: 'YOUR TITLE HERE',
    preset: 'pop',
    color: '#ffe14d',
    x: 32,
    y: 50,
    size: 17,
    rotation: 0,
    uppercase: true,
  },
  stickers: [],
}

export interface ThumbnailTemplate {
  id: string
  label: string
  headline: Pick<ThumbnailHeadline, 'x' | 'y' | 'size' | 'preset' | 'color'>
  /** Applied only when a subject image exists. */
  subject: Pick<ThumbnailSubject, 'x' | 'y' | 'scale'>
  background: Pick<ThumbnailBackground, 'kind' | 'color' | 'gradient'>
}

export const THUMBNAIL_TEMPLATES: ThumbnailTemplate[] = [
  {
    id: 'text-left',
    label: 'Text left · Face right',
    headline: { x: 30, y: 50, size: 17, preset: 'pop', color: '#ffe14d' },
    subject: { x: 78, y: 58, scale: 46 },
    background: { kind: 'gradient', color: '#0b1220', gradient: ['#7c3aed', '#db2777'] },
  },
  {
    id: 'big-number',
    label: 'Big word / number',
    headline: { x: 50, y: 50, size: 34, preset: 'outline', color: '#ffffff' },
    subject: { x: 80, y: 62, scale: 40 },
    background: { kind: 'gradient', color: '#111827', gradient: ['#0ea5e9', '#1e3a8a'] },
  },
  {
    id: 'reaction',
    label: 'Reaction face',
    headline: { x: 30, y: 22, size: 16, preset: 'block', color: '#ffffff' },
    subject: { x: 60, y: 60, scale: 58 },
    background: { kind: 'gradient', color: '#1a1a1a', gradient: ['#f59e0b', '#b91c1c'] },
  },
  {
    id: 'full-bleed',
    label: 'Full background',
    headline: { x: 50, y: 80, size: 15, preset: 'shadow', color: '#ffffff' },
    subject: { x: 50, y: 55, scale: 60 },
    background: { kind: 'image', color: '#000000', gradient: ['#000000', '#000000'] },
  },
  {
    id: 'top-list',
    label: 'Top 10 / List',
    headline: { x: 27, y: 32, size: 26, preset: 'block', color: '#ffe14d' },
    subject: { x: 80, y: 62, scale: 40 },
    background: { kind: 'gradient', color: '#0b1220', gradient: ['#0ea5e9', '#0b3b82'] },
  },
  {
    id: 'versus',
    label: 'VS / Versus',
    headline: { x: 50, y: 50, size: 30, preset: 'outline', color: '#ff3b30' },
    subject: { x: 78, y: 60, scale: 44 },
    background: { kind: 'gradient', color: '#120505', gradient: ['#b91c1c', '#111827'] },
  },
  {
    id: 'podcast',
    label: 'Podcast · Centered',
    headline: { x: 50, y: 18, size: 13, preset: 'shadow', color: '#ffffff' },
    subject: { x: 50, y: 60, scale: 62 },
    background: { kind: 'gradient', color: '#0a0a0a', gradient: ['#312e81', '#0a0a0a'] },
  },
  {
    id: 'lower-third',
    label: 'Lower third',
    headline: { x: 50, y: 84, size: 13, preset: 'block', color: '#ffffff' },
    subject: { x: 72, y: 50, scale: 56 },
    background: { kind: 'gradient', color: '#0b1220', gradient: ['#059669', '#064e3b'] },
  },
]

export function backgroundCss(bg: ThumbnailBackground): string {
  if (bg.kind === 'solid') return bg.color
  if (bg.kind === 'gradient') return `linear-gradient(135deg, ${bg.gradient[0]} 0%, ${bg.gradient[1]} 100%)`
  return bg.color // image handled by an <img> layer; this is the fallback fill
}

/* ----------------------- Photo adjustments & pop FX ---------------------- */

/** Client-side photo adjustments, applied as a CSS filter (Canva "Adjust"). */
export interface ImageAdjust {
  brightness: number // % (100 = normal)
  contrast: number // %
  saturation: number // %
  blur: number // px
}

export const DEFAULT_ADJUST: ImageAdjust = { brightness: 100, contrast: 100, saturation: 100, blur: 0 }

/** Pop effects on a cut-out subject (Canva "Shadows": drop / outline / glow). */
export interface SubjectFx {
  shadow: boolean
  shadowColor: string
  shadowOpacity: number // 0–100
  shadowBlur: number // px
  shadowOffset: number // px
  shadowAngle: number // deg (direction)
  outline: boolean
  outlineColor: string
  outlineWidth: number // px
  glow: boolean
  glowColor: string
  glowSize: number // px
}

/** Default reproduces the original soft drop shadow, so existing thumbnails are unchanged. */
export const DEFAULT_SUBJECT_FX: SubjectFx = {
  shadow: true,
  shadowColor: '#000000',
  shadowOpacity: 45,
  shadowBlur: 24,
  shadowOffset: 12,
  shadowAngle: 90,
  outline: false,
  outlineColor: '#ffffff',
  outlineWidth: 6,
  glow: false,
  glowColor: '#ffe14d',
  glowSize: 16,
}

// CSS filter helpers live in ./thumbnail-fx (logic, not data).

/* ----------------------------- AI generation ----------------------------- */

export interface ThumbnailAiStyle {
  id: string
  label: string
  prompt: string
}

export const THUMBNAIL_AI_STYLES: ThumbnailAiStyle[] = [
  { id: 'photo', label: 'Real Photo', prompt: 'photorealistic, dramatic studio lighting, sharp focus, shallow depth of field' },
  { id: '3d', label: '3D', prompt: 'glossy 3D render, vibrant, Pixar-like, soft global illumination' },
  { id: 'cinematic', label: 'Cinematic', prompt: 'cinematic film still, moody volumetric lighting, teal-and-orange color grade' },
  { id: 'comic', label: 'Comic', prompt: 'bold comic-book illustration, thick outlines, halftone shading, dynamic energy' },
  { id: 'vibrant', label: 'Vibrant', prompt: 'explosive vibrant gradient, neon accents, energetic abstract shapes' },
  { id: 'gaming', label: 'Gaming', prompt: 'epic gaming key art, intense action, glowing magical effects, high energy' },
]

export interface ThumbnailModelOption {
  id: string
  label: string
  full: string
}

export const THUMBNAIL_MODELS: ThumbnailModelOption[] = [
  { id: 'gemini-3.1-flash-image-preview', label: 'Flash', full: 'Gemini 3.1 Flash — fastest' },
  { id: 'gemini-3-pro-image-preview', label: 'Pro', full: 'Gemini 3 Pro — higher quality' },
  { id: 'gpt-image-2', label: 'GPT', full: 'ChatGPT Images 2.0' },
]

export const THUMBNAIL_SIZES = ['1K', '2K', '4K'] as const
export type ThumbnailSize = (typeof THUMBNAIL_SIZES)[number]

/** An AI-proposed thumbnail concept (from /api/generate-thumbnail-concepts). */
export interface ThumbnailConcept {
  summary: string
  headline: string
  color: string
  templateId: string
  styleId: string
  backgroundPrompt: string
}

/* ------------------------------- Stickers -------------------------------- */

export type StickerType = 'emoji' | 'arrow' | 'circle' | 'image'

export interface ThumbnailSticker {
  id: string
  type: StickerType
  content: string // emoji char (for 'emoji'); image URL (for 'image'); empty for shapes
  x: number // center %
  y: number
  size: number // % of stage height
  rotation: number
  color: string // shapes only
}

export interface StickerEmoji {
  char: string
  /** Space-separated search terms. */
  keywords: string
}

export const STICKER_EMOJI_ITEMS: StickerEmoji[] = [
  { char: '🔥', keywords: 'fire hot lit trending' },
  { char: '😱', keywords: 'shock scared scream omg surprise' },
  { char: '👉', keywords: 'point right arrow this' },
  { char: '❌', keywords: 'no wrong cross error stop' },
  { char: '✅', keywords: 'yes check correct done right' },
  { char: '💰', keywords: 'money cash rich profit bag' },
  { char: '🎯', keywords: 'target goal aim focus bullseye' },
  { char: '👀', keywords: 'eyes look watch see' },
  { char: '⭐', keywords: 'star rating favorite best' },
  { char: '💯', keywords: 'hundred perfect score 100' },
  { char: '⚡', keywords: 'lightning fast power energy bolt' },
  { char: '❤️', keywords: 'heart love like red' },
  { char: '😂', keywords: 'laugh funny lol joke cry' },
  { char: '🤯', keywords: 'mind blown shock wow explode' },
  { char: '🚀', keywords: 'rocket launch grow boost fast' },
  { char: '👑', keywords: 'crown king queen best royal' },
  { char: '😡', keywords: 'angry mad rage furious' },
  { char: '😎', keywords: 'cool sunglasses confident' },
  { char: '🤔', keywords: 'think hmm question wonder' },
  { char: '😭', keywords: 'cry sad tears sob' },
  { char: '🤬', keywords: 'angry swear rage mad' },
  { char: '💪', keywords: 'strong muscle gym power flex' },
  { char: '🧠', keywords: 'brain smart mind think' },
  { char: '💡', keywords: 'idea tip light bulb smart' },
  { char: '⏰', keywords: 'time clock alarm urgent fast' },
  { char: '📈', keywords: 'chart up growth profit stocks' },
  { char: '📉', keywords: 'chart down loss crash drop' },
  { char: '🏆', keywords: 'trophy win winner award best' },
  { char: '🎉', keywords: 'party celebrate confetti win' },
  { char: '😍', keywords: 'love heart eyes amazing wow' },
  { char: '🙏', keywords: 'pray please thanks hope' },
  { char: '👍', keywords: 'thumbs up like good yes' },
  { char: '👎', keywords: 'thumbs down dislike bad no' },
  { char: '🤑', keywords: 'money face rich greedy cash' },
  { char: '😴', keywords: 'sleep tired boring bed' },
  { char: '🥵', keywords: 'hot heat sweat fire' },
  { char: '🤖', keywords: 'robot ai tech bot' },
  { char: '🎮', keywords: 'game gaming controller play' },
  { char: '🍔', keywords: 'food burger eat fast' },
  { char: '🚨', keywords: 'alert siren warning emergency breaking' },
]

/** Back-compat: plain list of emoji characters. */
export const STICKER_EMOJIS = STICKER_EMOJI_ITEMS.map((e) => e.char)

/** Sentinel selection ids so the subject and headline share the single-selection
 *  state with stickers (only one layer shows handles at a time). */
export const SUBJECT_SELECTION_ID = '__thumbnail_subject__'
export const HEADLINE_SELECTION_ID = '__thumbnail_headline__'

export const STICKER_SHAPES: { type: StickerType; label: string }[] = [
  { type: 'arrow', label: 'Arrow' },
  { type: 'circle', label: 'Circle' },
]

export function createSticker(
  type: StickerType,
  content = '',
  overrides: Partial<Pick<ThumbnailSticker, 'x' | 'y' | 'size'>> = {},
): ThumbnailSticker {
  const size = type === 'emoji' ? 14 : type === 'image' ? 16 : 20
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `s_${Date.now()}_${Math.random()}`,
    type,
    content,
    x: 50,
    y: 50,
    size,
    rotation: 0,
    color: '#ff3b30',
    ...overrides,
  }
}

/** Build a thumbnail-optimised image prompt — high impact, no baked-in text. */
export function buildThumbnailBgPrompt(idea: string, stylePrompt: string): string {
  const concept = idea.trim() || 'an eye-catching, attention-grabbing scene'
  return [
    `YouTube thumbnail background image. Concept: ${concept}.`,
    `Style: ${stylePrompt}.`,
    'Bold, high-contrast, vivid saturated colors, strong single focal point, professional and attention-grabbing.',
    'Leave clear negative space for a headline and a person.',
    'Absolutely no text, no words, no letters, no captions, no logos, no watermark.',
  ].join(' ')
}

/* -------------------------------- Export --------------------------------- */

export type ThumbnailFormat = 'png' | 'jpg'

/** YouTube rejects thumbnails over 2 MB. */
export const MAX_THUMBNAIL_BYTES = 2 * 1024 * 1024

export const UPSCALE_TARGETS = ['2K', '4K'] as const
export type UpscaleTarget = (typeof UPSCALE_TARGETS)[number]

/* ------------------------------ Brand colors ----------------------------- */

/** Named brand colors for the background recolor step (the recolor engine
 *  takes color *names*, not hex). Hex is shown in the swatch only. */
export const THUMBNAIL_BRAND_COLORS: { name: string; hex: string }[] = [
  { name: 'Gold', hex: '#dbb56e' },
  { name: 'Navy', hex: '#1e3a8a' },
  { name: 'Black', hex: '#0a0a0a' },
  { name: 'White', hex: '#f5f5f5' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Teal', hex: '#0d9488' },
  { name: 'Purple', hex: '#7c3aed' },
  { name: 'Orange', hex: '#ea580c' },
  { name: 'Pink', hex: '#db2777' },
  { name: 'Green', hex: '#16a34a' },
]

/* -------------------------------- History -------------------------------- */

/** A saved thumbnail (reuses the studio's logo_history table, style='thumbnail'). */
export interface ThumbnailHistoryItem {
  id: string
  imageUrl: string
  prompt: string
  timestamp: number
  /** Full editable config snapshot, when present, so the thumbnail can reopen. */
  config?: ThumbnailConfig
}

export const THUMBNAIL_HISTORY_STYLE = 'thumbnail'
