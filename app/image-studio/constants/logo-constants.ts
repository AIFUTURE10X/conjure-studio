// Logo concept styles - the "what" of the logo
export type LogoConcept = 'minimalist' | 'modern' | 'vintage' | 'playful' | 'elegant' | 'bold'
export type LogoType = 'wordmark' | 'monogram' | 'icon-wordmark' | 'badge' | 'emblem' | 'mascot'
export type LogoVisualStyle = 'minimal' | 'luxury' | 'modern' | 'vintage' | 'boutique' | 'corporate' | 'tech' | 'handcrafted'
export type LogoRenderTreatment = 'flat-vector' | 'soft-3d' | 'metallic' | 'embossed' | 'foil' | 'glass' | 'neon'
export type LogoTypographyDirection = 'clean-sans' | 'elegant-serif' | 'script' | 'geometric' | 'bold-display' | 'reference-match'

export const LOGO_TYPE_VALUES: readonly LogoType[] = ['wordmark', 'monogram', 'icon-wordmark', 'badge', 'emblem', 'mascot']
export const LOGO_VISUAL_STYLE_VALUES: readonly LogoVisualStyle[] = ['minimal', 'luxury', 'modern', 'vintage', 'boutique', 'corporate', 'tech', 'handcrafted']
export const LOGO_RENDER_TREATMENT_VALUES: readonly LogoRenderTreatment[] = ['flat-vector', 'soft-3d', 'metallic', 'embossed', 'foil', 'glass', 'neon']
export const LOGO_TYPOGRAPHY_DIRECTION_VALUES: readonly LogoTypographyDirection[] = ['clean-sans', 'elegant-serif', 'script', 'geometric', 'bold-display', 'reference-match']

export const LOGO_TYPE_OPTIONS: Array<{
  value: LogoType
  label: string
  description: string
  icon: string
}> = [
  { value: 'wordmark', label: 'Wordmark', description: 'Text-led brand name', icon: 'Aa' },
  { value: 'monogram', label: 'Monogram', description: 'Initials or lettermark', icon: 'M' },
  { value: 'icon-wordmark', label: 'Icon + Wordmark', description: 'Symbol with brand text', icon: '◆' },
  { value: 'badge', label: 'Badge', description: 'Contained stamp layout', icon: '◉' },
  { value: 'emblem', label: 'Emblem', description: 'Integrated mark and text', icon: '◇' },
  { value: 'mascot', label: 'Mascot', description: 'Character-led identity', icon: '★' },
]

export const LOGO_VISUAL_STYLE_OPTIONS: Array<{
  value: LogoVisualStyle
  label: string
  description: string
}> = [
  { value: 'minimal', label: 'Minimal', description: 'Simple and restrained' },
  { value: 'luxury', label: 'Luxury', description: 'Premium and refined' },
  { value: 'modern', label: 'Modern', description: 'Clean contemporary' },
  { value: 'vintage', label: 'Vintage', description: 'Heritage character' },
  { value: 'boutique', label: 'Boutique', description: 'Warm crafted premium' },
  { value: 'corporate', label: 'Corporate', description: 'Professional and stable' },
  { value: 'tech', label: 'Tech', description: 'Precise and futuristic' },
  { value: 'handcrafted', label: 'Handcrafted', description: 'Human and artisanal' },
]

export const LOGO_RENDER_TREATMENT_OPTIONS: Array<{
  value: LogoRenderTreatment
  label: string
  description: string
}> = [
  { value: 'flat-vector', label: 'Flat Vector', description: 'Crisp 2D mark' },
  { value: 'soft-3d', label: 'Soft 3D', description: 'Gentle depth' },
  { value: 'metallic', label: 'Metallic', description: 'Gold or chrome finish' },
  { value: 'embossed', label: 'Embossed', description: 'Raised/debossed surface' },
  { value: 'foil', label: 'Foil', description: 'Premium stamped shine' },
  { value: 'glass', label: 'Glass', description: 'Translucent polished look' },
  { value: 'neon', label: 'Neon', description: 'Glow treatment' },
]

export const LOGO_TYPOGRAPHY_DIRECTION_OPTIONS: Array<{
  value: LogoTypographyDirection
  label: string
  description: string
}> = [
  { value: 'clean-sans', label: 'Clean Sans', description: 'Readable modern type' },
  { value: 'elegant-serif', label: 'Elegant Serif', description: 'Luxury editorial type' },
  { value: 'script', label: 'Script', description: 'Flowing signature style' },
  { value: 'geometric', label: 'Geometric', description: 'Precise constructed forms' },
  { value: 'bold-display', label: 'Bold Display', description: 'Strong headline lettering' },
  { value: 'reference-match', label: 'Reference Match', description: 'Follow uploaded typography' },
]

export const LOGO_CONCEPTS: Array<{
  value: LogoConcept
  label: string
  icon: string
  color: string
}> = [
  { value: 'minimalist', label: 'Minimal', icon: '○', color: '#a1a1aa' },      // zinc-400
  { value: 'modern', label: 'Modern', icon: '◆', color: '#3b82f6' },          // blue-500
  { value: 'vintage', label: 'Vintage', icon: '◈', color: '#d97706' },        // amber-600
  { value: 'playful', label: 'Playful', icon: '★', color: '#facc15' },        // yellow-400
  { value: 'elegant', label: 'Elegant', icon: '♦', color: '#a855f7' },        // purple-500
  { value: 'bold', label: 'Bold', icon: '■', color: '#ef4444' },              // red-500
]

// Rendering styles - the "how" of the logo (can combine with any concept)
export type RenderStyle = 'flat' | '3d' | '3d-metallic' | '3d-crystal' | '3d-gradient' | 'neon'

export const RENDER_STYLES: Array<{
  value: RenderStyle
  label: string
  icon: string
  description: string
  color: string
  gradient?: string
}> = [
  { value: 'flat', label: 'Flat', icon: '□', description: '2D, solid colors', color: '#71717a' },
  { value: '3d', label: '3D', icon: '◇', description: 'Subtle depth', color: '#6366f1' },
  { value: '3d-metallic', label: 'Metal', icon: '⬡', description: 'Chrome, gold', color: '#d4af37' },
  { value: '3d-crystal', label: 'Crystal', icon: '💎', description: 'Glass, diamond', color: '#67e8f9' },
  { value: '3d-gradient', label: 'Gradient', icon: '●', description: 'Colorful 3D', color: '#ec4899', gradient: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)' },
  { value: 'neon', label: 'Neon', icon: '✦', description: 'Glowing', color: '#22d3ee' },
]

// Background removal methods
import type { BgRemovalMethod, LogoGenerationModel, LogoTextMode } from '../hooks/useLogoGeneration'

export const BG_REMOVAL_METHODS: Array<{
  value: BgRemovalMethod
  label: string
  description: string
  badge?: string
  requiresModel?: LogoGenerationModel
}> = [
  {
    value: 'native-transparent',
    label: 'Legacy transparent PNG',
    description: 'OpenAI generation with local transparent cleanup; PhotoRoom is more reliable',
    badge: 'Legacy',
    requiresModel: 'gpt-image-2',
  },
  {
    value: 'photoroom',
    label: 'PhotoRoom',
    description: 'Professional API cleanup for the cleanest transparent PNG edges',
    badge: 'Best'
  },
  {
    value: 'replicate',
    label: 'BRIA AI (Replicate)',
    description: 'Optional Replicate cleanup for difficult backgrounds',
    badge: 'Replicate'
  },
  {
    value: '851-labs',
    label: '851-labs',
    description: 'Very cheap (~$0.0005/run), good for general use',
    badge: 'Budget'
  },
]

// Resolution options
export type LogoResolution = '1K' | '2K' | '4K'

export const RESOLUTION_OPTIONS: Array<{ value: LogoResolution; label: string }> = [
  { value: '1K', label: '1K (1024px)' },
  { value: '2K', label: '2K (2048px)' },
  { value: '4K', label: '4K (4096px)' },
]

export const LOGO_MODEL_OPTIONS: Array<{
  value: LogoGenerationModel
  label: string
  description: string
}> = [
  {
    value: 'gpt-image-2',
    label: 'ChatGPT Images 2.0',
    description: 'OpenAI latest',
  },
]

export const LOGO_TEXT_MODE_OPTIONS: Array<{
  value: LogoTextMode
  label: string
  description: string
}> = [
  {
    value: 'ai-text',
    label: 'AI Text',
    description: 'Let the image model draw lettering',
  },
  {
    value: 'exact-text-overlay',
    label: 'Exact Text',
    description: 'Generate mark only, add real fonts after',
  },
]

export const GOLD_GRADIENT = "linear-gradient(135deg, #c99850 0%, #dbb56e 25%, #f4d698 50%, #dbb56e 75%, #c99850 100%)"

// CSS for transparency checkerboard pattern
export const transparencyGridStyle = {
  backgroundImage: `
    linear-gradient(45deg, #404040 25%, transparent 25%),
    linear-gradient(-45deg, #404040 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #404040 75%),
    linear-gradient(-45deg, transparent 75%, #404040 75%)
  `,
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
  backgroundColor: '#2a2a2a'
}
