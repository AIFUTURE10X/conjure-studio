/**
 * Dot Matrix 3D Logo Configurator - Configuration Options
 * All settings and presets for the advanced logo configurator
 *
 * Enhanced with: Fancy Fonts, Per-Letter Colors, Materials, Text Effects, and more
 */

// ============================================
// IMPORTS FROM NEW COMPONENTS
// ============================================

// Re-export types from component files for convenience
export type { FancyFontStyle, FancyFontCategory } from '../components/Logo/FancyFontGrid'
export type { LetterColorConfig } from '../components/Logo/LetterColorPicker'
export type { MaterialType, MaterialOption } from '../components/Logo/MaterialSelector'
export type { TextOutline, GlowEffect, TextTexture, LetterEffect } from '../components/Logo/TextEffectsPanel'
export type { IconStyle as ExtendedIconStyle, IconPosition } from '../components/Logo/IconSelector'

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface DotMatrixConfig {
  // Brand Identity
  brandName: string
  tagline: string
  taglinePosition: TaglinePosition | null
  taglineStyle: TaglineStyle | null
  taglineSize: TaglineSize | null
  useInitials: boolean

  // Dot Matrix Pattern
  dotSize: DotSize | null
  dotSpacing: DotSpacing | null
  dotShape: DotShape | null
  patternStyle: PatternStyle | null
  patternCoverage: PatternCoverage | null
  dotGradient: boolean

  // Color Scheme
  textColor: ColorOption | null
  dotColor: ColorOption | null
  accentColor: ColorOption | null
  backgroundColor: BackgroundColor | null
  gradientDirection: GradientDirection | null
  metallicFinish: MetallicFinish | null

  // NEW: Per-Letter Color Control
  letterColors: Array<{ position: number; color: ColorOption }>

  // NEW: Custom Colors
  customTextColor: string | null
  customDotColor: string | null

  // Typography
  fontStyle: FontStyle | null
  textWeight: TextWeight | null
  letterSpacing: LetterSpacing | null
  textCase: TextCase | null

  // NEW: Fancy Font Selection
  fancyFontId: string | null

  // Layout & Composition
  brandPosition: BrandPosition | null
  logoOrientation: LogoOrientation | null
  tiltAngle: number // -30 to +30

  // Decorative Elements
  swooshStyle: SwooshStyle | null
  swooshPosition: SwooshPosition | null
  sparkleIntensity: SparkleIntensity | null
  shadowStyle: ShadowStyle | null
  hasReflection: boolean

  // 3D Effects
  depthLevel: DepthLevel | null
  depthAmount: number // NEW: 0-100 granular control
  lightingDirection: LightingDirection | null
  bevelStyle: BevelStyle | null
  perspective: Perspective | null

  // Icon Integration (Enhanced)
  iconStyle: IconStyle | null
  extendedIconStyle: string | null // NEW: From IconSelector
  iconPosition: string | null // NEW: Icon position

  // NEW: Material/Surface Type
  materialType: string | null

  // NEW: Text Effects
  textOutline: string | null
  glowEffect: string | null
  glowIntensity: number // 0-100
  textTexture: string | null
  letterEffect: string | null
}

// ============================================
// ENUM-LIKE TYPES
// ============================================

export type DotSize = 'tiny' | 'small' | 'medium' | 'large' | 'extra-large'
export type DotSpacing = 'tight' | 'normal' | 'loose' | 'very-loose'
export type DotShape = 'circle' | 'square' | 'diamond' | 'hexagon'
export type PatternStyle = 'uniform' | 'halftone' | 'scatter' | 'radial'
export type PatternCoverage = 'full' | 'partial-fade' | 'edge-only' | 'center-only'

export type BackgroundColor = 'dark-navy' | 'black' | 'dark-gray' | 'gradient' | 'transparent'
export type GradientDirection = 'left-right' | 'top-bottom' | 'diagonal' | 'radial'
export type MetallicFinish = 'chrome' | 'gold' | 'bronze' | 'rose-gold' | 'platinum' | 'copper'

export type FontStyle = 'sans-serif-bold' | 'serif-elegant' | 'modern-geometric' | 'tech-digital' | 'script-fancy' | 'display-bold'
export type TextWeight = 'light' | 'regular' | 'bold' | 'extra-bold'
export type LetterSpacing = 'tight' | 'normal' | 'wide' | 'very-wide'
export type TextCase = 'uppercase' | 'titlecase' | 'lowercase'

export type TaglinePosition = 'below' | 'above' | 'right' | 'left' | 'inline' | 'integrated'
export type TaglineStyle = 'match' | 'italic' | 'lighter' | 'caps' | 'same-as-brand' | 'smaller'
export type TaglineSize = 'small' | 'medium' | 'large'

export type BrandPosition = 'above' | 'below' | 'left' | 'right' | 'integrated'
export type LogoOrientation = 'horizontal' | 'vertical' | 'square'

export type SwooshStyle = 'none' | 'circular' | 'dynamic' | 'ribbon' | 'orbit'
export type SwooshPosition = 'around' | 'above' | 'below' | 'wrapping'
export type SparkleIntensity = 'none' | 'subtle' | 'medium' | 'dramatic'
export type ShadowStyle = 'none' | 'soft-drop' | 'hard' | 'long-cast'

export type DepthLevel = 'flat' | 'subtle' | 'medium' | 'deep' | 'extreme'
export type LightingDirection = 'top-left' | 'top' | 'top-right' | 'side'
export type BevelStyle = 'none' | 'soft' | 'sharp' | 'embossed'
export type Perspective = 'straight' | 'slight-angle' | 'isometric'

export type IconStyle = 'none' | 'globe' | 'arrow' | 'abstract' | 'geometric' | 'star'

export interface ColorOption {
  name: string
  value: string
  hex: string
}

// ============================================
// OPTIONS ARRAYS
// ============================================

export const DOT_SIZE_OPTIONS: Array<{ value: DotSize; label: string; description: string }> = [
  { value: 'tiny', label: 'Tiny', description: 'Fine detail dots' },
  { value: 'small', label: 'Small', description: 'Subtle pattern' },
  { value: 'medium', label: 'Medium', description: 'Balanced visibility' },
  { value: 'large', label: 'Large', description: 'Bold statement' },
  { value: 'extra-large', label: 'Extra Large', description: 'Chunky, prominent' },
]

export const DOT_SPACING_OPTIONS: Array<{ value: DotSpacing; label: string; description: string }> = [
  { value: 'tight', label: 'Tight', description: 'Dense, almost solid' },
  { value: 'normal', label: 'Normal', description: 'Classic halftone' },
  { value: 'loose', label: 'Loose', description: 'Airy, spaced out' },
  { value: 'very-loose', label: 'Very Loose', description: 'Scattered dots' },
]

export const DOT_SHAPE_OPTIONS: Array<{ value: DotShape; label: string; icon: string }> = [
  { value: 'circle', label: 'Circle', icon: '●' },
  { value: 'square', label: 'Square', icon: '■' },
  { value: 'diamond', label: 'Diamond', icon: '◆' },
  { value: 'hexagon', label: 'Hexagon', icon: '⬡' },
]

export const PATTERN_STYLE_OPTIONS: Array<{ value: PatternStyle; label: string; description: string }> = [
  { value: 'uniform', label: 'Uniform Grid', description: 'Even spacing throughout' },
  { value: 'halftone', label: 'Halftone Gradient', description: 'Dots fade in size' },
  { value: 'scatter', label: 'Random Scatter', description: 'Organic distribution' },
  { value: 'radial', label: 'Radial Pattern', description: 'Radiating from center' },
]

export const PATTERN_COVERAGE_OPTIONS: Array<{ value: PatternCoverage; label: string }> = [
  { value: 'full', label: 'Full Letters' },
  { value: 'partial-fade', label: 'Partial Fade' },
  { value: 'edge-only', label: 'Edge Only' },
  { value: 'center-only', label: 'Center Only' },
]

// Color presets
export const TEXT_COLOR_PRESETS: ColorOption[] = [
  { name: 'Chrome', value: 'chrome', hex: '#C0C0C0' },
  { name: 'Gold', value: 'gold', hex: '#FFD700' },
  { name: 'Silver', value: 'silver', hex: '#E8E8E8' },
  { name: 'Bronze', value: 'bronze', hex: '#CD7F32' },
  { name: 'Platinum', value: 'platinum', hex: '#E5E4E2' },
  { name: 'Rose Gold', value: 'rose-gold', hex: '#B76E79' },
  { name: 'Copper', value: 'copper', hex: '#B87333' },
]

export const DOT_COLOR_PRESETS: ColorOption[] = [
  { name: 'Purple', value: 'purple', hex: '#8B5CF6' },
  { name: 'Blue', value: 'blue', hex: '#3B82F6' },
  { name: 'Cyan', value: 'cyan', hex: '#06B6D4' },
  { name: 'Green', value: 'green', hex: '#22C55E' },
  { name: 'Red', value: 'red', hex: '#EF4444' },
  { name: 'Orange', value: 'orange', hex: '#F97316' },
  { name: 'Pink', value: 'pink', hex: '#EC4899' },
  { name: 'Teal', value: 'teal', hex: '#14B8A6' },
]

export const BACKGROUND_OPTIONS: Array<{ value: BackgroundColor; label: string; preview: string }> = [
  { value: 'dark-navy', label: 'Dark Navy', preview: '#1a1a2e' },
  { value: 'black', label: 'Pure Black', preview: '#000000' },
  { value: 'dark-gray', label: 'Dark Gray', preview: '#2d2d2d' },
  { value: 'gradient', label: 'Navy Gradient', preview: 'linear-gradient(135deg, #1a1a2e, #000)' },
  { value: 'transparent', label: 'Transparent', preview: 'transparent' },
]

export const METALLIC_FINISH_OPTIONS: Array<{ value: MetallicFinish; label: string; color: string }> = [
  { value: 'chrome', label: 'Chrome', color: '#C0C0C0' },
  { value: 'gold', label: 'Gold', color: '#FFD700' },
  { value: 'bronze', label: 'Bronze', color: '#CD7F32' },
  { value: 'rose-gold', label: 'Rose Gold', color: '#B76E79' },
  { value: 'platinum', label: 'Platinum', color: '#E5E4E2' },
  { value: 'copper', label: 'Copper', color: '#B87333' },
]

export const FONT_STYLE_OPTIONS: Array<{ value: FontStyle; label: string; description: string }> = [
  { value: 'sans-serif-bold', label: 'Sans-Serif Bold', description: 'Modern, clean' },
  { value: 'serif-elegant', label: 'Serif Elegant', description: 'Classic, refined' },
  { value: 'modern-geometric', label: 'Modern Geometric', description: 'Tech, futuristic' },
  { value: 'tech-digital', label: 'Tech Digital', description: 'Digital, cyber' },
  { value: 'script-fancy', label: 'Script Fancy', description: 'Elegant, decorative cursive' },
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

export const TEXT_CASE_OPTIONS: Array<{ value: TextCase; label: string; example: string }> = [
  { value: 'uppercase', label: 'UPPERCASE', example: 'BRAND' },
  { value: 'titlecase', label: 'Title Case', example: 'Brand' },
  { value: 'lowercase', label: 'lowercase', example: 'brand' },
]

export const BRAND_POSITION_OPTIONS: Array<{ value: BrandPosition; label: string; icon: string }> = [
  { value: 'above', label: 'Above Icon', icon: '⬆' },
  { value: 'below', label: 'Below Icon', icon: '⬇' },
  { value: 'left', label: 'Left of Icon', icon: '⬅' },
  { value: 'right', label: 'Right of Icon', icon: '➡' },
  { value: 'integrated', label: 'Integrated', icon: '⬛' },
]

export const LOGO_ORIENTATION_OPTIONS: Array<{ value: LogoOrientation; label: string }> = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
  { value: 'square', label: 'Square' },
]

export const SWOOSH_STYLE_OPTIONS: Array<{ value: SwooshStyle; label: string; description: string }> = [
  { value: 'none', label: 'None', description: 'No swoosh' },
  { value: 'circular', label: 'Circular', description: 'Round arc' },
  { value: 'dynamic', label: 'Dynamic', description: 'Flowing curve' },
  { value: 'ribbon', label: 'Ribbon', description: 'Thick band' },
  { value: 'orbit', label: 'Orbit', description: 'Elliptical path' },
]

export const SWOOSH_POSITION_OPTIONS: Array<{ value: SwooshPosition; label: string }> = [
  { value: 'around', label: 'Around Letters' },
  { value: 'above', label: 'Above' },
  { value: 'below', label: 'Below' },
  { value: 'wrapping', label: 'Wrapping Through' },
]

export const SPARKLE_OPTIONS: Array<{ value: SparkleIntensity; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'medium', label: 'Medium' },
  { value: 'dramatic', label: 'Dramatic' },
]

export const SHADOW_STYLE_OPTIONS: Array<{ value: ShadowStyle; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'soft-drop', label: 'Soft Drop' },
  { value: 'hard', label: 'Hard Shadow' },
  { value: 'long-cast', label: 'Long Cast' },
]

export const DEPTH_LEVEL_OPTIONS: Array<{ value: DepthLevel; label: string }> = [
  { value: 'flat', label: 'Flat' },
  { value: 'subtle', label: 'Subtle 3D' },
  { value: 'medium', label: 'Medium 3D' },
  { value: 'deep', label: 'Deep 3D' },
  { value: 'extreme', label: 'Extreme 3D' },
]

export const LIGHTING_OPTIONS: Array<{ value: LightingDirection; label: string; icon: string }> = [
  { value: 'top-left', label: 'Top Left', icon: '↖' },
  { value: 'top', label: 'Top', icon: '↑' },
  { value: 'top-right', label: 'Top Right', icon: '↗' },
  { value: 'side', label: 'Side', icon: '→' },
]

export const BEVEL_OPTIONS: Array<{ value: BevelStyle; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'soft', label: 'Soft Bevel' },
  { value: 'sharp', label: 'Sharp Bevel' },
  { value: 'embossed', label: 'Embossed' },
]

export const PERSPECTIVE_OPTIONS: Array<{ value: Perspective; label: string }> = [
  { value: 'straight', label: 'Straight-on' },
  { value: 'slight-angle', label: 'Slight Angle' },
  { value: 'isometric', label: 'Isometric' },
]

export const ICON_STYLE_OPTIONS: Array<{ value: IconStyle; label: string; icon: string }> = [
  { value: 'none', label: 'None', icon: '—' },
  { value: 'globe', label: 'Globe', icon: '🌐' },
  { value: 'arrow', label: 'Arrow', icon: '➤' },
  { value: 'abstract', label: 'Abstract', icon: '◈' },
  { value: 'geometric', label: 'Geometric', icon: '⬡' },
  { value: 'star', label: 'Star', icon: '★' },
]

// ============================================
// INDUSTRY PRESETS
// ============================================

export interface IndustryPreset {
  id: string
  name: string
  icon: string
  description: string
  config: Partial<DotMatrixConfig>
}

export const INDUSTRY_PRESETS: IndustryPreset[] = [
  {
    id: 'recruitment',
    name: 'Recruitment/HR',
    icon: '👔',
    description: 'Professional, trustworthy',
    config: {
      textColor: { name: 'Chrome', value: 'chrome', hex: '#C0C0C0' },
      dotColor: { name: 'Purple', value: 'purple', hex: '#8B5CF6' },
      metallicFinish: 'chrome',
      swooshStyle: 'circular',
      backgroundColor: 'dark-navy',
      depthLevel: 'deep',
    }
  },
  {
    id: 'tech',
    name: 'Tech Startup',
    icon: '💻',
    description: 'Modern, innovative',
    config: {
      textColor: { name: 'Silver', value: 'silver', hex: '#E8E8E8' },
      dotColor: { name: 'Cyan', value: 'cyan', hex: '#06B6D4' },
      metallicFinish: 'chrome',
      swooshStyle: 'dynamic',
      fontStyle: 'modern-geometric',
      backgroundColor: 'black',
      sparkleIntensity: 'subtle',
    }
  },
  {
    id: 'finance',
    name: 'Finance',
    icon: '💰',
    description: 'Premium, trustworthy',
    config: {
      textColor: { name: 'Gold', value: 'gold', hex: '#FFD700' },
      dotColor: { name: 'Blue', value: 'blue', hex: '#3B82F6' },
      metallicFinish: 'gold',
      swooshStyle: 'ribbon',
      fontStyle: 'serif-elegant',
      backgroundColor: 'dark-navy',
      depthLevel: 'medium',
    }
  },
  {
    id: 'creative',
    name: 'Creative Agency',
    icon: '🎨',
    description: 'Vibrant, playful',
    config: {
      textColor: { name: 'Chrome', value: 'chrome', hex: '#C0C0C0' },
      dotColor: { name: 'Pink', value: 'pink', hex: '#EC4899' },
      metallicFinish: 'chrome',
      swooshStyle: 'dynamic',
      sparkleIntensity: 'medium',
      patternStyle: 'halftone',
      backgroundColor: 'gradient',
    }
  },
  {
    id: 'luxury',
    name: 'Luxury Brand',
    icon: '👑',
    description: 'Elegant, exclusive',
    config: {
      textColor: { name: 'Gold', value: 'gold', hex: '#FFD700' },
      dotColor: { name: 'Gold', value: 'gold', hex: '#FFD700' },
      metallicFinish: 'gold',
      swooshStyle: 'none',
      fontStyle: 'serif-elegant',
      backgroundColor: 'black',
      depthLevel: 'deep',
      sparkleIntensity: 'dramatic',
    }
  },
]

// ============================================
// DEFAULT CONFIGURATION
// ============================================

export const DEFAULT_DOT_MATRIX_CONFIG: DotMatrixConfig = {
  // Brand Identity
  brandName: '',
  tagline: '',
  taglinePosition: null,
  taglineStyle: null,
  taglineSize: null,
  useInitials: false,

  // Dot Matrix Pattern
  dotSize: null,
  dotSpacing: null,
  dotShape: null,
  patternStyle: null,
  patternCoverage: null,
  dotGradient: false,

  // Color Scheme
  textColor: null,
  dotColor: null,
  accentColor: null,
  backgroundColor: null,
  gradientDirection: null,
  metallicFinish: null,

  // NEW: Per-Letter Colors
  letterColors: [],

  // NEW: Custom Colors
  customTextColor: null,
  customDotColor: null,

  // Typography
  fontStyle: null,
  textWeight: null,
  letterSpacing: null,
  textCase: null,

  // NEW: Fancy Font
  fancyFontId: null,

  // Layout & Composition
  brandPosition: null,
  logoOrientation: null,
  tiltAngle: 0,

  // Decorative Elements
  swooshStyle: null,
  swooshPosition: null,
  sparkleIntensity: null,
  shadowStyle: null,
  hasReflection: false,

  // 3D Effects
  depthLevel: null,
  depthAmount: 50, // Default 50%
  lightingDirection: null,
  bevelStyle: null,
  perspective: null,

  // Icon Integration (Enhanced)
  iconStyle: null,
  extendedIconStyle: null,
  iconPosition: null,

  // NEW: Material Type
  materialType: null,

  // NEW: Text Effects
  textOutline: null,
  glowEffect: null,
  glowIntensity: 50,
  textTexture: null,
  letterEffect: null,
}
