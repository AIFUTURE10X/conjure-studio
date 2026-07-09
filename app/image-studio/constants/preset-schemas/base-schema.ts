/**
 * Base Schema - Common settings shared by ALL logo presets
 *
 * This defines the foundational configuration that every preset type uses.
 * Category-specific schemas extend this with additional settings.
 */

import { ColorOption } from '../dot-matrix-config'

// ============================================
// SHARED TYPES
// ============================================

export type FontStyle = 'sans-serif-bold' | 'serif-elegant' | 'modern-geometric' | 'tech-digital' | 'script-fancy' | 'display-bold'
export type TextWeight = 'light' | 'regular' | 'bold' | 'extra-bold'
export type LetterSpacing = 'tight' | 'normal' | 'wide' | 'very-wide'
export type TextCase = 'uppercase' | 'titlecase' | 'lowercase'
export type DepthLevel = 'flat' | 'subtle' | 'medium' | 'deep' | 'extreme'
export type LightingDirection = 'top-left' | 'top' | 'top-right' | 'side'
export type BevelStyle = 'none' | 'soft' | 'sharp' | 'embossed'
export type ShadowStyle = 'none' | 'soft-drop' | 'hard' | 'long-cast'
export type SparkleIntensity = 'none' | 'subtle' | 'medium' | 'dramatic'
export type BackgroundType = 'dark-navy' | 'black' | 'dark-gray' | 'gradient' | 'transparent' | 'white' | 'light-gray'
export type LogoOrientation = 'horizontal' | 'vertical' | 'square'
export type BrandPosition = 'above' | 'below' | 'left' | 'right' | 'integrated'

// Text placement (brand name position relative to icon)
export type TextPlacement = 'center' | 'left' | 'right' | 'stacked' | 'inline'

// Tagline settings
export type TaglinePosition = 'below' | 'above' | 'right' | 'left' | 'inline' | 'integrated'
export type TaglineStyle = 'match' | 'italic' | 'lighter' | 'caps'
export type TaglineSize = 'small' | 'medium'

// ============================================
// BASE CONFIG INTERFACE
// ============================================

export interface BaseLogoConfig {
  // Brand Identity
  brandName: string
  tagline: string
  useInitials: boolean

  // Text & Tagline Placement
  textPlacement: TextPlacement
  taglinePosition: TaglinePosition
  taglinePlacement?: TaglinePosition // Alias from wizard
  taglineStyle: TaglineStyle
  taglineSize: TaglineSize

  // Colors
  textColor: ColorOption
  accentColor: ColorOption
  backgroundColor: BackgroundType
  customTextColor: string | null
  customAccentColor: string | null

  // Typography
  fontStyle: FontStyle
  textWeight: TextWeight
  letterSpacing: LetterSpacing
  textCase: TextCase
  fancyFontId: string | null

  // Layout
  logoOrientation: LogoOrientation
  brandPosition: BrandPosition
  tiltAngle: number

  // Icons (uses existing IconSelector)
  extendedIconStyle: string | null
  iconPosition: string | null

  // 3D Effects
  depthLevel: DepthLevel
  depthAmount: number // 0-100 granular control
  lightingDirection: LightingDirection
  bevelStyle: BevelStyle

  // Decorative Effects
  shadowStyle: ShadowStyle
  sparkleIntensity: SparkleIntensity
  hasReflection: boolean

  // Text Effects
  textOutline: string | null
  glowEffect: string | null
  glowIntensity: number
  textTexture: string | null
  letterEffect: string | null

  // Materials (shared)
  materialType: string | null
  metallicFinish: string | null
}

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_BASE_CONFIG: BaseLogoConfig = {
  // Brand Identity
  brandName: '',
  tagline: '',
  useInitials: false,

  // Text & Tagline Placement
  textPlacement: 'center',
  taglinePosition: 'below',
  taglineStyle: 'lighter',
  taglineSize: 'small',

  // Colors
  textColor: { name: 'Chrome', value: 'chrome', hex: '#C0C0C0' },
  accentColor: { name: 'Purple', value: 'purple', hex: '#8B5CF6' },
  backgroundColor: 'dark-navy',
  customTextColor: null,
  customAccentColor: null,

  // Typography
  fontStyle: 'sans-serif-bold',
  textWeight: 'bold',
  letterSpacing: 'normal',
  textCase: 'uppercase',
  fancyFontId: null,

  // Layout
  logoOrientation: 'horizontal',
  brandPosition: 'integrated',
  tiltAngle: 0,

  // Icons
  extendedIconStyle: null,
  iconPosition: null,

  // 3D Effects
  depthLevel: 'medium',
  depthAmount: 50,
  lightingDirection: 'top-left',
  bevelStyle: 'soft',

  // Decorative Effects
  shadowStyle: 'soft-drop',
  sparkleIntensity: 'subtle',
  hasReflection: false,

  // Text Effects
  textOutline: null,
  glowEffect: null,
  glowIntensity: 0,
  textTexture: null,
  letterEffect: null,

  // Materials
  materialType: null,
  metallicFinish: 'chrome',
}

// ============================================
// SHARED OPTIONS
// ============================================

export const FONT_STYLE_OPTIONS: Array<{ value: FontStyle; label: string; description: string }> = [
  { value: 'sans-serif-bold', label: 'Sans Serif Bold', description: 'Clean, modern, professional' },
  { value: 'serif-elegant', label: 'Serif Elegant', description: 'Classic, sophisticated, timeless' },
  { value: 'modern-geometric', label: 'Modern Geometric', description: 'Contemporary, tech-forward' },
  { value: 'tech-digital', label: 'Tech Digital', description: 'Futuristic, digital, cutting-edge' },
  { value: 'script-fancy', label: 'Script Fancy', description: 'Elegant, artistic, handwritten feel' },
  { value: 'display-bold', label: 'Display Bold', description: 'Impactful, attention-grabbing' },
]

export const TEXT_WEIGHT_OPTIONS: Array<{ value: TextWeight; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'regular', label: 'Regular' },
  { value: 'bold', label: 'Bold' },
  { value: 'extra-bold', label: 'Extra Bold' },
]

export const LETTER_SPACING_OPTIONS: Array<{ value: LetterSpacing; label: string }> = [
  { value: 'tight', label: 'Tight' },
  { value: 'normal', label: 'Normal' },
  { value: 'wide', label: 'Wide' },
  { value: 'very-wide', label: 'Very Wide' },
]

export const DEPTH_LEVEL_OPTIONS: Array<{ value: DepthLevel; label: string; description: string }> = [
  { value: 'flat', label: 'Flat', description: '2D, no depth' },
  { value: 'subtle', label: 'Subtle', description: 'Slight 3D effect' },
  { value: 'medium', label: 'Medium', description: 'Balanced depth' },
  { value: 'deep', label: 'Deep', description: 'Strong 3D extrusion' },
  { value: 'extreme', label: 'Extreme', description: 'Dramatic depth' },
]

export const LIGHTING_OPTIONS: Array<{ value: LightingDirection; label: string }> = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top', label: 'Top' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'side', label: 'Side' },
]

export const BACKGROUND_OPTIONS: Array<{ value: BackgroundType; label: string; hex: string }> = [
  { value: 'dark-navy', label: 'Dark Navy', hex: '#0f172a' },
  { value: 'black', label: 'Black', hex: '#000000' },
  { value: 'dark-gray', label: 'Dark Gray', hex: '#1f2937' },
  { value: 'gradient', label: 'Gradient', hex: 'linear' },
  { value: 'transparent', label: 'Transparent', hex: 'transparent' },
  { value: 'white', label: 'White', hex: '#ffffff' },
  { value: 'light-gray', label: 'Light Gray', hex: '#f3f4f6' },
]

export const TAGLINE_POSITION_OPTIONS: Array<{ value: TaglinePosition; label: string }> = [
  { value: 'below', label: 'Below Brand' },
  { value: 'above', label: 'Above Brand' },
  { value: 'right', label: 'Right Side' },
  { value: 'left', label: 'Left Side' },
  { value: 'inline', label: 'Inline' },
  { value: 'integrated', label: 'Integrated' },
]

export const TEXT_PLACEMENT_OPTIONS: Array<{ value: TextPlacement; label: string; description: string }> = [
  { value: 'center', label: 'Centered', description: 'Text centered, icon as accent' },
  { value: 'left', label: 'Left of Icon', description: 'Text to the left of icon/symbol' },
  { value: 'right', label: 'Right of Icon', description: 'Text to the right of icon/symbol' },
  { value: 'stacked', label: 'Stacked', description: 'Icon above, text below' },
  { value: 'inline', label: 'Inline', description: 'Icon and text side by side' },
]

export const TAGLINE_STYLE_OPTIONS: Array<{ value: TaglineStyle; label: string }> = [
  { value: 'match', label: 'Match Brand' },
  { value: 'italic', label: 'Italic' },
  { value: 'lighter', label: 'Lighter Weight' },
  { value: 'caps', label: 'All Caps' },
]

// ============================================
// TAB DEFINITIONS
// ============================================

export interface TabDefinition {
  id: string
  label: string
  icon: string
  component: string // Component name to render
}

export const BASE_TABS: TabDefinition[] = [
  { id: 'brand', label: 'Brand', icon: 'Type', component: 'BrandTab' },
  { id: 'colors', label: 'Colors', icon: 'Palette', component: 'ColorsTab' },
  { id: 'typography', label: 'Fonts', icon: 'Type', component: 'TypographyTab' },
  { id: 'layout', label: 'Icons', icon: 'Image', component: 'LayoutTab' },
  { id: 'effects', label: '3D/FX', icon: 'Layers', component: 'EffectsTab' },
  { id: 'advanced', label: 'Advanced', icon: 'Sparkles', component: 'AdvancedTab' },
]
