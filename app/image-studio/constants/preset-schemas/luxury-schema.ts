/**
 * Luxury Schema - Luxury/Premium category specific settings
 *
 * Used by presets: luxury-crown, luxury-diamond
 */

import { BaseLogoConfig, DEFAULT_BASE_CONFIG, TabDefinition, BASE_TABS } from './base-schema'
import { ColorOption } from '../dot-matrix-config'

// ============================================
// LUXURY-SPECIFIC TYPES
// ============================================

export type MetalType = 'gold' | 'platinum' | 'rose-gold' | 'silver' | 'rhodium' | 'copper' | 'bronze'
export type GemStyle = 'none' | 'diamond' | 'ruby' | 'emerald' | 'sapphire' | 'amethyst' | 'pearl'
export type GemPlacement = 'accent' | 'inlay' | 'scattered' | 'border' | 'crown-point'
export type FinishQuality = 'polished' | 'brushed' | 'satin' | 'matte' | 'hammered'
export type EngravingStyle = 'none' | 'serif' | 'script' | 'monogram' | 'art-deco'
export type LuxuryPattern = 'none' | 'filigree' | 'damask' | 'laurel' | 'baroque'

// ============================================
// LUXURY CONFIG INTERFACE
// ============================================

export interface LuxuryLogoConfig extends BaseLogoConfig {
  // Luxury-specific settings
  metalType: MetalType
  gemStyle: GemStyle
  gemPlacement: GemPlacement
  gemColor: ColorOption
  finishQuality: FinishQuality
  engravingStyle: EngravingStyle
  luxuryPattern: LuxuryPattern
  hasGoldLeaf: boolean
  hasCrownElement: boolean
  exclusivityLevel: 'premium' | 'luxury' | 'ultra-luxury'
}

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_LUXURY_CONFIG: LuxuryLogoConfig = {
  ...DEFAULT_BASE_CONFIG,

  // Override base defaults for luxury style
  textColor: { name: 'Gold', value: 'gold', hex: '#D4AF37' },
  accentColor: { name: 'Black', value: 'black', hex: '#000000' },
  fontStyle: 'serif-elegant',
  backgroundColor: 'black',
  depthLevel: 'deep',
  sparkleIntensity: 'medium',

  // Luxury-specific defaults
  metalType: 'gold',
  gemStyle: 'none',
  gemPlacement: 'accent',
  gemColor: { name: 'Diamond', value: 'diamond', hex: '#B9F2FF' },
  finishQuality: 'polished',
  engravingStyle: 'none',
  luxuryPattern: 'none',
  hasGoldLeaf: false,
  hasCrownElement: false,
  exclusivityLevel: 'luxury',
}

// ============================================
// LUXURY-SPECIFIC OPTIONS
// ============================================

export const METAL_TYPE_OPTIONS: Array<{ value: MetalType; label: string; hex: string }> = [
  { value: 'gold', label: 'Gold', hex: '#D4AF37' },
  { value: 'platinum', label: 'Platinum', hex: '#E5E4E2' },
  { value: 'rose-gold', label: 'Rose Gold', hex: '#B76E79' },
  { value: 'silver', label: 'Silver', hex: '#C0C0C0' },
  { value: 'rhodium', label: 'Rhodium', hex: '#D4D7D9' },
  { value: 'copper', label: 'Copper', hex: '#B87333' },
  { value: 'bronze', label: 'Bronze', hex: '#CD7F32' },
]

export const GEM_STYLE_OPTIONS: Array<{ value: GemStyle; label: string; hex: string }> = [
  { value: 'none', label: 'None', hex: 'transparent' },
  { value: 'diamond', label: 'Diamond', hex: '#B9F2FF' },
  { value: 'ruby', label: 'Ruby', hex: '#E0115F' },
  { value: 'emerald', label: 'Emerald', hex: '#50C878' },
  { value: 'sapphire', label: 'Sapphire', hex: '#0F52BA' },
  { value: 'amethyst', label: 'Amethyst', hex: '#9966CC' },
  { value: 'pearl', label: 'Pearl', hex: '#FDEEF4' },
]

export const GEM_PLACEMENT_OPTIONS: Array<{ value: GemPlacement; label: string; description: string }> = [
  { value: 'accent', label: 'Accent', description: 'Single gem highlight' },
  { value: 'inlay', label: 'Inlay', description: 'Embedded in letters' },
  { value: 'scattered', label: 'Scattered', description: 'Multiple gems spread' },
  { value: 'border', label: 'Border', description: 'Around the edges' },
  { value: 'crown-point', label: 'Crown Point', description: 'Top of crown/logo' },
]

export const FINISH_QUALITY_OPTIONS: Array<{ value: FinishQuality; label: string; description: string }> = [
  { value: 'polished', label: 'Polished', description: 'Mirror-like shine' },
  { value: 'brushed', label: 'Brushed', description: 'Subtle texture lines' },
  { value: 'satin', label: 'Satin', description: 'Soft, smooth finish' },
  { value: 'matte', label: 'Matte', description: 'Non-reflective' },
  { value: 'hammered', label: 'Hammered', description: 'Artisan texture' },
]

export const ENGRAVING_STYLE_OPTIONS: Array<{ value: EngravingStyle; label: string; description: string }> = [
  { value: 'none', label: 'None', description: 'No engraving' },
  { value: 'serif', label: 'Serif', description: 'Classic engraved serif' },
  { value: 'script', label: 'Script', description: 'Elegant cursive' },
  { value: 'monogram', label: 'Monogram', description: 'Interlocked initials' },
  { value: 'art-deco', label: 'Art Deco', description: '1920s geometric' },
]

export const LUXURY_PATTERN_OPTIONS: Array<{ value: LuxuryPattern; label: string; description: string }> = [
  { value: 'none', label: 'None', description: 'Clean, no pattern' },
  { value: 'filigree', label: 'Filigree', description: 'Delicate metalwork' },
  { value: 'damask', label: 'Damask', description: 'Ornate fabric pattern' },
  { value: 'laurel', label: 'Laurel', description: 'Victory wreath' },
  { value: 'baroque', label: 'Baroque', description: 'Ornate classical' },
]

export const EXCLUSIVITY_OPTIONS: Array<{ value: LuxuryLogoConfig['exclusivityLevel']; label: string; description: string }> = [
  { value: 'premium', label: 'Premium', description: 'High-quality brand' },
  { value: 'luxury', label: 'Luxury', description: 'Exclusive luxury brand' },
  { value: 'ultra-luxury', label: 'Ultra Luxury', description: 'Ultra-exclusive, bespoke' },
]

// ============================================
// LUXURY TAB DEFINITION
// ============================================

export const LUXURY_CATEGORY_TAB: TabDefinition = {
  id: 'luxury-materials',
  label: 'Luxury',
  icon: 'Crown',
  component: 'LuxuryMaterialsTab',
}

export const LUXURY_TABS: TabDefinition[] = [
  BASE_TABS[0], // Brand
  LUXURY_CATEGORY_TAB, // Luxury Materials (category-specific)
  BASE_TABS[1], // Colors
  BASE_TABS[2], // Fonts
  BASE_TABS[3], // Icons
  BASE_TABS[4], // 3D/FX
  BASE_TABS[5], // Advanced
]

// ============================================
// PROMPT BUILDER HELPERS
// ============================================

export function buildLuxuryPromptSegment(config: LuxuryLogoConfig): string {
  const segments: string[] = []

  // Metal type
  const metalMap: Record<MetalType, string> = {
    'gold': '24k gold',
    'platinum': 'platinum',
    'rose-gold': 'rose gold',
    'silver': 'sterling silver',
    'rhodium': 'rhodium-plated',
    'copper': 'copper',
    'bronze': 'bronze',
  }
  segments.push(`${metalMap[config.metalType]} metallic finish`)

  // Gem
  if (config.gemStyle !== 'none') {
    const gemMap: Record<GemStyle, string> = {
      'none': '',
      'diamond': 'brilliant cut diamond',
      'ruby': 'deep red ruby',
      'emerald': 'vivid emerald',
      'sapphire': 'royal blue sapphire',
      'amethyst': 'purple amethyst',
      'pearl': 'lustrous pearl',
    }
    const placementMap: Record<GemPlacement, string> = {
      'accent': 'as accent',
      'inlay': 'inlaid in letters',
      'scattered': 'scattered throughout',
      'border': 'bordering the design',
      'crown-point': 'at crown point',
    }
    segments.push(`${gemMap[config.gemStyle]} ${placementMap[config.gemPlacement]}`)
  }

  // Finish
  if (config.finishQuality !== 'polished') {
    segments.push(`${config.finishQuality} metal finish`)
  }

  // Engraving
  if (config.engravingStyle !== 'none') {
    segments.push(`${config.engravingStyle} engraving style`)
  }

  // Pattern
  if (config.luxuryPattern !== 'none') {
    segments.push(`${config.luxuryPattern} decorative pattern`)
  }

  // Gold leaf
  if (config.hasGoldLeaf) {
    segments.push('with gold leaf accents')
  }

  // Crown
  if (config.hasCrownElement) {
    segments.push('with royal crown element')
  }

  // Exclusivity descriptor
  const exclusivityMap: Record<LuxuryLogoConfig['exclusivityLevel'], string> = {
    'premium': 'premium quality',
    'luxury': 'luxury brand aesthetic',
    'ultra-luxury': 'ultra-exclusive bespoke quality',
  }
  segments.push(exclusivityMap[config.exclusivityLevel])

  return segments.filter(Boolean).join(', ')
}
