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
}

export interface ThumbnailSubject {
  url: string
  /** Center position as a percentage of the stage (0–100). */
  x: number
  y: number
  /** Width as a percentage of stage width. */
  scale: number
  flip: boolean
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
}

export interface ThumbnailConfig {
  templateId: string
  background: ThumbnailBackground
  subject: ThumbnailSubject | null
  headline: ThumbnailHeadline
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
]

export function backgroundCss(bg: ThumbnailBackground): string {
  if (bg.kind === 'solid') return bg.color
  if (bg.kind === 'gradient') return `linear-gradient(135deg, ${bg.gradient[0]} 0%, ${bg.gradient[1]} 100%)`
  return bg.color // image handled by an <img> layer; this is the fallback fill
}
