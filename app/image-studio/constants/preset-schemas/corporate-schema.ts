/**
 * Corporate Schema - Corporate/Business category specific settings
 *
 * Used by presets: corporate-dotmatrix, corporate-swoosh, corporate-globe
 * This schema extends from the existing DotMatrix config for compatibility
 */

import { BaseLogoConfig, DEFAULT_BASE_CONFIG, TabDefinition, BASE_TABS } from './base-schema'
import { ColorOption } from '../dot-matrix-config'

// ============================================
// CORPORATE-SPECIFIC TYPES (from DotMatrix)
// ============================================

export type DotSize = 'tiny' | 'small' | 'medium' | 'large' | 'extra-large'
export type DotSpacing = 'tight' | 'normal' | 'loose' | 'very-loose'
export type DotShape = 'circle' | 'square' | 'diamond' | 'hexagon'
export type PatternStyle = 'uniform' | 'halftone' | 'scatter' | 'radial'
export type PatternCoverage = 'full' | 'partial-fade' | 'edge-only' | 'center-only'
export type SwooshStyle = 'none' | 'circular' | 'dynamic' | 'ribbon' | 'orbit'
export type SwooshPosition = 'around' | 'above' | 'below' | 'wrapping'
export type GradientDirection = 'left-right' | 'top-bottom' | 'diagonal' | 'radial'
export type CorporateStyle = 'consulting' | 'recruitment' | 'technology' | 'professional-services' | 'global'

// ============================================
// CORPORATE CONFIG INTERFACE
// ============================================

export interface CorporateLogoConfig extends BaseLogoConfig {
  // Dot Matrix settings (existing DotMatrix features)
  dotSize: DotSize
  dotSpacing: DotSpacing
  dotShape: DotShape
  patternStyle: PatternStyle
  patternCoverage: PatternCoverage
  dotGradient: boolean
  dotColor: ColorOption

  // Swoosh settings
  swooshStyle: SwooshStyle
  swooshPosition: SwooshPosition

  // Corporate-specific settings
  corporateStyle: CorporateStyle
  gradientDirection: GradientDirection
  hasGlobeElement: boolean
  hasNetworkLines: boolean
  showProfessionalBadge: boolean
  isGlobalBrand: boolean
}

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_CORPORATE_CONFIG: CorporateLogoConfig = {
  ...DEFAULT_BASE_CONFIG,

  // Override base defaults for corporate style
  textColor: { name: 'Chrome', value: 'chrome', hex: '#C0C0C0' },
  accentColor: { name: 'Purple', value: 'purple', hex: '#8B5CF6' },
  fontStyle: 'sans-serif-bold',
  backgroundColor: 'dark-navy',
  depthLevel: 'deep',
  metallicFinish: 'chrome',

  // Dot Matrix defaults
  dotSize: 'medium',
  dotSpacing: 'normal',
  dotShape: 'circle',
  patternStyle: 'halftone',
  patternCoverage: 'full',
  dotGradient: true,
  dotColor: { name: 'Purple', value: 'purple', hex: '#8B5CF6' },

  // Swoosh defaults
  swooshStyle: 'circular',
  swooshPosition: 'around',

  // Corporate-specific defaults
  corporateStyle: 'consulting',
  gradientDirection: 'diagonal',
  hasGlobeElement: false,
  hasNetworkLines: false,
  showProfessionalBadge: false,
  isGlobalBrand: false,
}

// ============================================
// CORPORATE-SPECIFIC OPTIONS
// ============================================

export const DOT_SIZE_OPTIONS: Array<{ value: DotSize; label: string }> = [
  { value: 'tiny', label: 'Tiny' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'extra-large', label: 'Extra Large' },
]

export const DOT_SPACING_OPTIONS: Array<{ value: DotSpacing; label: string }> = [
  { value: 'tight', label: 'Tight' },
  { value: 'normal', label: 'Normal' },
  { value: 'loose', label: 'Loose' },
  { value: 'very-loose', label: 'Very Loose' },
]

export const DOT_SHAPE_OPTIONS: Array<{ value: DotShape; label: string; icon: string }> = [
  { value: 'circle', label: 'Circle', icon: '●' },
  { value: 'square', label: 'Square', icon: '■' },
  { value: 'diamond', label: 'Diamond', icon: '◆' },
  { value: 'hexagon', label: 'Hexagon', icon: '⬡' },
]

export const PATTERN_STYLE_OPTIONS: Array<{ value: PatternStyle; label: string; description: string }> = [
  { value: 'uniform', label: 'Uniform', description: 'Even distribution' },
  { value: 'halftone', label: 'Halftone', description: 'Print-style dots' },
  { value: 'scatter', label: 'Scatter', description: 'Random scatter' },
  { value: 'radial', label: 'Radial', description: 'Radiating from center' },
]

export const PATTERN_COVERAGE_OPTIONS: Array<{ value: PatternCoverage; label: string; description: string }> = [
  { value: 'full', label: 'Full', description: 'Cover entire text' },
  { value: 'partial-fade', label: 'Partial Fade', description: 'Fading coverage' },
  { value: 'edge-only', label: 'Edge Only', description: 'Around edges' },
  { value: 'center-only', label: 'Center Only', description: 'Center concentrated' },
]

export const SWOOSH_STYLE_OPTIONS: Array<{ value: SwooshStyle; label: string; description: string }> = [
  { value: 'none', label: 'None', description: 'No swoosh' },
  { value: 'circular', label: 'Circular', description: 'Circular arc' },
  { value: 'dynamic', label: 'Dynamic', description: 'Flowing curve' },
  { value: 'ribbon', label: 'Ribbon', description: 'Ribbon band' },
  { value: 'orbit', label: 'Orbit', description: 'Orbital ring' },
]

export const SWOOSH_POSITION_OPTIONS: Array<{ value: SwooshPosition; label: string }> = [
  { value: 'around', label: 'Around' },
  { value: 'above', label: 'Above' },
  { value: 'below', label: 'Below' },
  { value: 'wrapping', label: 'Wrapping' },
]

export const CORPORATE_STYLE_OPTIONS: Array<{ value: CorporateStyle; label: string; description: string }> = [
  { value: 'consulting', label: 'Consulting', description: 'Professional services' },
  { value: 'recruitment', label: 'Recruitment', description: 'HR/staffing' },
  { value: 'technology', label: 'Technology', description: 'Tech company' },
  { value: 'professional-services', label: 'Professional', description: 'B2B services' },
  { value: 'global', label: 'Global', description: 'International corp' },
]

export const CORPORATE_DOT_COLORS: ColorOption[] = [
  { name: 'Purple', value: 'purple', hex: '#8B5CF6' },
  { name: 'Cyan', value: 'cyan', hex: '#06B6D4' },
  { name: 'Blue', value: 'blue', hex: '#3B82F6' },
  { name: 'Pink', value: 'pink', hex: '#EC4899' },
  { name: 'Green', value: 'green', hex: '#22C55E' },
  { name: 'Orange', value: 'orange', hex: '#F97316' },
]

// ============================================
// CORPORATE TAB DEFINITION
// ============================================

export const CORPORATE_CATEGORY_TAB: TabDefinition = {
  id: 'dots-pattern',
  label: 'Dots',
  icon: 'Grid',
  component: 'DotsTab', // Reuses existing DotsTab
}

export const CORPORATE_TABS: TabDefinition[] = [
  BASE_TABS[0], // Brand
  CORPORATE_CATEGORY_TAB, // Dots (category-specific - existing)
  BASE_TABS[1], // Colors
  BASE_TABS[2], // Fonts
  BASE_TABS[3], // Icons
  BASE_TABS[4], // 3D/FX
  BASE_TABS[5], // Advanced
]

// ============================================
// PROMPT BUILDER HELPERS
// ============================================

export function buildCorporatePromptSegment(config: CorporateLogoConfig): string {
  const segments: string[] = []

  // Corporate style
  const styleMap: Record<CorporateStyle, string> = {
    'consulting': 'consulting firm',
    'recruitment': 'recruitment/HR company',
    'technology': 'technology corporation',
    'professional-services': 'professional services company',
    'global': 'global corporation',
  }
  segments.push(styleMap[config.corporateStyle])

  // Dot pattern
  if (config.patternStyle !== 'uniform') {
    const sizeLabel = config.dotSize.toUpperCase().replace('-', ' ')
    segments.push(`with ${sizeLabel} ${config.dotShape} DOT MATRIX ${config.patternStyle} pattern texture`)
    if (config.dotGradient) {
      segments.push('gradient dots')
    }
    if (config.dotColor?.name) {
      segments.push(`in ${config.dotColor.name.toLowerCase()} (${config.dotColor.hex})`)
    }
    segments.push(`with ${config.dotSpacing.toUpperCase()} spacing`)
  }

  // Swoosh
  if (config.swooshStyle !== 'none') {
    segments.push(`${config.swooshStyle.toUpperCase()} swoosh arc element ${config.swooshPosition} the letters`)
  }

  // Globe
  if (config.hasGlobeElement) {
    segments.push('with 3D globe element')
  }

  // Network
  if (config.hasNetworkLines) {
    segments.push('with connected network lines')
  }

  // Global brand
  if (config.isGlobalBrand) {
    segments.push('international worldwide presence')
  }

  // Professional badge
  if (config.showProfessionalBadge) {
    segments.push('professional premium quality')
  }

  return segments.filter(Boolean).join(', ')
}
