/**
 * Creative Schema - Creative/Agency category specific settings
 *
 * Used by presets: creative-studio, creative-camera
 */

import { BaseLogoConfig, DEFAULT_BASE_CONFIG, TabDefinition, BASE_TABS } from './base-schema'
import { ColorOption } from '../dot-matrix-config'

// ============================================
// CREATIVE-SPECIFIC TYPES
// ============================================

export type CreativeField = 'design' | 'photography' | 'video' | 'branding' | 'illustration' | 'advertising'
export type ArtisticStyle = 'bold-vibrant' | 'subtle-elegant' | 'playful' | 'minimalist' | 'experimental'
export type BrushStyle = 'none' | 'paint-stroke' | 'watercolor' | 'ink-splash' | 'marker' | 'pencil'
export type CreativeElement = 'none' | 'palette' | 'camera' | 'brush' | 'pen' | 'lens' | 'film'
export type ColorVibrancy = 'muted' | 'balanced' | 'vibrant' | 'neon' | 'rainbow'

// ============================================
// CREATIVE CONFIG INTERFACE
// ============================================

export interface CreativeLogoConfig extends BaseLogoConfig {
  // Creative-specific settings
  creativeField: CreativeField
  artisticStyle: ArtisticStyle
  brushStyle: BrushStyle
  creativeElement: CreativeElement
  colorVibrancy: ColorVibrancy
  primaryCreativeColor: ColorOption
  secondaryCreativeColor: ColorOption
  hasGradientSplash: boolean
  hasArtisticTexture: boolean
  showPortfolioStyle: boolean
  isAgency: boolean
}

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_CREATIVE_CONFIG: CreativeLogoConfig = {
  ...DEFAULT_BASE_CONFIG,

  // Override base defaults for creative style
  textColor: { name: 'Black', value: 'black', hex: '#000000' },
  accentColor: { name: 'Pink', value: 'pink', hex: '#EC4899' },
  fontStyle: 'modern-geometric',
  backgroundColor: 'white',
  depthLevel: 'subtle',

  // Creative-specific defaults
  creativeField: 'design',
  artisticStyle: 'bold-vibrant',
  brushStyle: 'none',
  creativeElement: 'none',
  colorVibrancy: 'vibrant',
  primaryCreativeColor: { name: 'Pink', value: 'pink', hex: '#EC4899' },
  secondaryCreativeColor: { name: 'Purple', value: 'purple', hex: '#8B5CF6' },
  hasGradientSplash: false,
  hasArtisticTexture: false,
  showPortfolioStyle: false,
  isAgency: true,
}

// ============================================
// CREATIVE-SPECIFIC OPTIONS
// ============================================

export const CREATIVE_FIELD_OPTIONS: Array<{ value: CreativeField; label: string; emoji: string; description: string }> = [
  { value: 'design', label: 'Design', emoji: '🎨', description: 'Graphic/web design' },
  { value: 'photography', label: 'Photography', emoji: '📷', description: 'Photo studio' },
  { value: 'video', label: 'Video', emoji: '🎬', description: 'Film/video production' },
  { value: 'branding', label: 'Branding', emoji: '✨', description: 'Brand identity' },
  { value: 'illustration', label: 'Illustration', emoji: '🖼️', description: 'Illustration art' },
  { value: 'advertising', label: 'Advertising', emoji: '📢', description: 'Ad agency' },
]

export const ARTISTIC_STYLE_OPTIONS: Array<{ value: ArtisticStyle; label: string; description: string }> = [
  { value: 'bold-vibrant', label: 'Bold & Vibrant', description: 'Eye-catching, energetic' },
  { value: 'subtle-elegant', label: 'Subtle & Elegant', description: 'Refined, sophisticated' },
  { value: 'playful', label: 'Playful', description: 'Fun, whimsical' },
  { value: 'minimalist', label: 'Minimalist', description: 'Clean, simple' },
  { value: 'experimental', label: 'Experimental', description: 'Avant-garde, unique' },
]

export const BRUSH_STYLE_OPTIONS: Array<{ value: BrushStyle; label: string; description: string }> = [
  { value: 'none', label: 'None', description: 'No brush effect' },
  { value: 'paint-stroke', label: 'Paint Stroke', description: 'Bold brush stroke' },
  { value: 'watercolor', label: 'Watercolor', description: 'Soft watercolor wash' },
  { value: 'ink-splash', label: 'Ink Splash', description: 'Dynamic ink splatter' },
  { value: 'marker', label: 'Marker', description: 'Marker pen style' },
  { value: 'pencil', label: 'Pencil', description: 'Sketchy pencil lines' },
]

export const CREATIVE_ELEMENT_OPTIONS: Array<{ value: CreativeElement; label: string; emoji: string }> = [
  { value: 'none', label: 'None', emoji: '—' },
  { value: 'palette', label: 'Palette', emoji: '🎨' },
  { value: 'camera', label: 'Camera', emoji: '📷' },
  { value: 'brush', label: 'Brush', emoji: '🖌️' },
  { value: 'pen', label: 'Pen', emoji: '✒️' },
  { value: 'lens', label: 'Lens', emoji: '🔍' },
  { value: 'film', label: 'Film', emoji: '🎞️' },
]

export const COLOR_VIBRANCY_OPTIONS: Array<{ value: ColorVibrancy; label: string; description: string }> = [
  { value: 'muted', label: 'Muted', description: 'Soft, understated' },
  { value: 'balanced', label: 'Balanced', description: 'Natural, moderate' },
  { value: 'vibrant', label: 'Vibrant', description: 'Bold, saturated' },
  { value: 'neon', label: 'Neon', description: 'Electric, glowing' },
  { value: 'rainbow', label: 'Rainbow', description: 'Full spectrum' },
]

export const CREATIVE_COLORS: ColorOption[] = [
  { name: 'Hot Pink', value: 'hot-pink', hex: '#EC4899' },
  { name: 'Electric Purple', value: 'electric-purple', hex: '#8B5CF6' },
  { name: 'Cyan', value: 'cyan', hex: '#06B6D4' },
  { name: 'Lime', value: 'lime', hex: '#84CC16' },
  { name: 'Orange', value: 'orange', hex: '#F97316' },
  { name: 'Red', value: 'red', hex: '#EF4444' },
  { name: 'Yellow', value: 'yellow', hex: '#EAB308' },
  { name: 'Blue', value: 'blue', hex: '#3B82F6' },
]

// ============================================
// CREATIVE TAB DEFINITION
// ============================================

export const CREATIVE_CATEGORY_TAB: TabDefinition = {
  id: 'creative-arts',
  label: 'Creative',
  icon: 'Palette',
  component: 'CreativeArtsTab',
}

export const CREATIVE_TABS: TabDefinition[] = [
  BASE_TABS[0], // Brand
  CREATIVE_CATEGORY_TAB, // Creative Arts (category-specific)
  BASE_TABS[1], // Colors
  BASE_TABS[2], // Fonts
  BASE_TABS[3], // Icons
  BASE_TABS[4], // 3D/FX
  BASE_TABS[5], // Advanced
]

// ============================================
// PROMPT BUILDER HELPERS
// ============================================

export function buildCreativePromptSegment(config: CreativeLogoConfig): string {
  const segments: string[] = []

  // Creative field
  const fieldMap: Record<CreativeField, string> = {
    'design': 'design studio',
    'photography': 'photography studio',
    'video': 'video production company',
    'branding': 'branding agency',
    'illustration': 'illustration studio',
    'advertising': 'advertising agency',
  }
  segments.push(config.isAgency ? `creative ${fieldMap[config.creativeField]}` : fieldMap[config.creativeField])

  // Artistic style
  const styleMap: Record<ArtisticStyle, string> = {
    'bold-vibrant': 'bold vibrant',
    'subtle-elegant': 'subtle elegant',
    'playful': 'playful whimsical',
    'minimalist': 'clean minimalist',
    'experimental': 'experimental avant-garde',
  }
  segments.push(`${styleMap[config.artisticStyle]} aesthetic`)

  // Brush style
  if (config.brushStyle !== 'none') {
    const brushMap: Record<BrushStyle, string> = {
      'none': '',
      'paint-stroke': 'bold paint stroke accent',
      'watercolor': 'soft watercolor wash effect',
      'ink-splash': 'dynamic ink splash',
      'marker': 'marker pen style',
      'pencil': 'sketchy pencil line effect',
    }
    segments.push(`with ${brushMap[config.brushStyle]}`)
  }

  // Creative element
  if (config.creativeElement !== 'none') {
    const elementMap: Record<CreativeElement, string> = {
      'none': '',
      'palette': 'artist palette icon',
      'camera': 'camera lens icon',
      'brush': 'paint brush element',
      'pen': 'pen/pencil icon',
      'lens': 'camera aperture lens',
      'film': 'film reel element',
    }
    segments.push(`with ${elementMap[config.creativeElement]}`)
  }

  // Color vibrancy
  if (config.colorVibrancy !== 'balanced') {
    const vibrancyMap: Record<ColorVibrancy, string> = {
      'muted': 'muted color palette',
      'balanced': '',
      'vibrant': 'vibrant saturated colors',
      'neon': 'neon glowing colors',
      'rainbow': 'rainbow spectrum colors',
    }
    segments.push(vibrancyMap[config.colorVibrancy])
  }

  // Gradient splash
  if (config.hasGradientSplash) {
    segments.push('with colorful gradient splash')
  }

  // Artistic texture
  if (config.hasArtisticTexture) {
    segments.push('with artistic hand-made texture')
  }

  // Portfolio style
  if (config.showPortfolioStyle) {
    segments.push('portfolio-ready presentation')
  }

  return segments.filter(Boolean).join(', ')
}
