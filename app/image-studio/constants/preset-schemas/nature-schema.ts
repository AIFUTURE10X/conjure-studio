/**
 * Nature Schema - Nature/Eco category specific settings
 *
 * Used by presets: nature-leaf
 */

import { BaseLogoConfig, DEFAULT_BASE_CONFIG, TabDefinition, BASE_TABS } from './base-schema'
import { ColorOption } from '../dot-matrix-config'

// ============================================
// NATURE-SPECIFIC TYPES
// ============================================

export type OrganicShape = 'leaf' | 'tree' | 'vine' | 'roots' | 'petals' | 'branches' | 'flower'
export type LeafStyle = 'realistic' | 'stylized' | 'geometric' | 'abstract' | 'silhouette'
export type EcoColorPalette = 'forest' | 'spring' | 'autumn' | 'tropical' | 'earth' | 'ocean'
export type GrowthEffect = 'none' | 'sprouting' | 'flourishing' | 'seasonal' | 'wind-blown'
export type NatureTexture = 'smooth' | 'bark' | 'moss' | 'veined' | 'wood-grain'
export type WaterElement = 'none' | 'droplet' | 'wave' | 'ripple' | 'stream'

// ============================================
// NATURE CONFIG INTERFACE
// ============================================

export interface NatureLogoConfig extends BaseLogoConfig {
  // Nature-specific settings
  organicShape: OrganicShape
  leafStyle: LeafStyle
  ecoColorPalette: EcoColorPalette
  primaryLeafColor: ColorOption
  secondaryLeafColor: ColorOption
  growthEffect: GrowthEffect
  natureTexture: NatureTexture
  waterElement: WaterElement
  hasSunRays: boolean
  hasEarthElement: boolean
  isOrganic: boolean // "Organic" badge style
}

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_NATURE_CONFIG: NatureLogoConfig = {
  ...DEFAULT_BASE_CONFIG,

  // Override base defaults for nature style
  textColor: { name: 'Forest Green', value: 'forest-green', hex: '#228B22' },
  accentColor: { name: 'Earth Brown', value: 'earth-brown', hex: '#8B4513' },
  fontStyle: 'sans-serif-bold',
  backgroundColor: 'white',
  depthLevel: 'subtle',

  // Nature-specific defaults
  organicShape: 'leaf',
  leafStyle: 'stylized',
  ecoColorPalette: 'forest',
  primaryLeafColor: { name: 'Green', value: 'green', hex: '#22C55E' },
  secondaryLeafColor: { name: 'Teal', value: 'teal', hex: '#14B8A6' },
  growthEffect: 'none',
  natureTexture: 'smooth',
  waterElement: 'none',
  hasSunRays: false,
  hasEarthElement: false,
  isOrganic: false,
}

// ============================================
// NATURE-SPECIFIC OPTIONS
// ============================================

export const ORGANIC_SHAPE_OPTIONS: Array<{ value: OrganicShape; label: string; emoji: string; description: string }> = [
  { value: 'leaf', label: 'Leaf', emoji: '🍃', description: 'Single elegant leaf' },
  { value: 'tree', label: 'Tree', emoji: '🌳', description: 'Full tree silhouette' },
  { value: 'vine', label: 'Vine', emoji: '🌿', description: 'Climbing vine' },
  { value: 'roots', label: 'Roots', emoji: '🌱', description: 'Root system' },
  { value: 'petals', label: 'Petals', emoji: '🌸', description: 'Flower petals' },
  { value: 'branches', label: 'Branches', emoji: '🌲', description: 'Branch pattern' },
  { value: 'flower', label: 'Flower', emoji: '🌺', description: 'Blooming flower' },
]

export const LEAF_STYLE_OPTIONS: Array<{ value: LeafStyle; label: string; description: string }> = [
  { value: 'realistic', label: 'Realistic', description: 'Photo-realistic leaf' },
  { value: 'stylized', label: 'Stylized', description: 'Artistic interpretation' },
  { value: 'geometric', label: 'Geometric', description: 'Angular, modern' },
  { value: 'abstract', label: 'Abstract', description: 'Conceptual shape' },
  { value: 'silhouette', label: 'Silhouette', description: 'Solid shape' },
]

export const ECO_PALETTE_OPTIONS: Array<{ value: EcoColorPalette; label: string; colors: string[]; description: string }> = [
  { value: 'forest', label: 'Forest', colors: ['#228B22', '#006400', '#2E8B57'], description: 'Deep forest greens' },
  { value: 'spring', label: 'Spring', colors: ['#90EE90', '#98FB98', '#7CFC00'], description: 'Fresh spring greens' },
  { value: 'autumn', label: 'Autumn', colors: ['#D2691E', '#CD853F', '#B8860B'], description: 'Warm fall colors' },
  { value: 'tropical', label: 'Tropical', colors: ['#00FF7F', '#20B2AA', '#40E0D0'], description: 'Vibrant tropical' },
  { value: 'earth', label: 'Earth', colors: ['#8B4513', '#A0522D', '#6B4423'], description: 'Natural earth tones' },
  { value: 'ocean', label: 'Ocean', colors: ['#006994', '#40E0D0', '#7FFFD4'], description: 'Ocean and water' },
]

export const GROWTH_EFFECT_OPTIONS: Array<{ value: GrowthEffect; label: string; description: string }> = [
  { value: 'none', label: 'None', description: 'Static design' },
  { value: 'sprouting', label: 'Sprouting', description: 'New growth emerging' },
  { value: 'flourishing', label: 'Flourishing', description: 'Full bloom' },
  { value: 'seasonal', label: 'Seasonal', description: 'Season transition' },
  { value: 'wind-blown', label: 'Wind-Blown', description: 'Gentle movement' },
]

export const NATURE_TEXTURE_OPTIONS: Array<{ value: NatureTexture; label: string; description: string }> = [
  { value: 'smooth', label: 'Smooth', description: 'Clean, flat surface' },
  { value: 'bark', label: 'Bark', description: 'Tree bark texture' },
  { value: 'moss', label: 'Moss', description: 'Soft moss coating' },
  { value: 'veined', label: 'Veined', description: 'Leaf vein pattern' },
  { value: 'wood-grain', label: 'Wood Grain', description: 'Natural wood pattern' },
]

export const WATER_ELEMENT_OPTIONS: Array<{ value: WaterElement; label: string; description: string }> = [
  { value: 'none', label: 'None', description: 'No water element' },
  { value: 'droplet', label: 'Droplet', description: 'Water drop' },
  { value: 'wave', label: 'Wave', description: 'Flowing wave' },
  { value: 'ripple', label: 'Ripple', description: 'Water ripples' },
  { value: 'stream', label: 'Stream', description: 'Flowing stream' },
]

export const NATURE_LEAF_COLORS: ColorOption[] = [
  { name: 'Fresh Green', value: 'fresh-green', hex: '#22C55E' },
  { name: 'Forest Green', value: 'forest-green', hex: '#228B22' },
  { name: 'Teal', value: 'teal', hex: '#14B8A6' },
  { name: 'Olive', value: 'olive', hex: '#808000' },
  { name: 'Lime', value: 'lime', hex: '#84CC16' },
  { name: 'Sage', value: 'sage', hex: '#9CAF88' },
  { name: 'Mint', value: 'mint', hex: '#98FF98' },
  { name: 'Autumn Orange', value: 'autumn-orange', hex: '#D2691E' },
]

// ============================================
// NATURE TAB DEFINITION
// ============================================

export const NATURE_CATEGORY_TAB: TabDefinition = {
  id: 'nature-organics',
  label: 'Nature',
  icon: 'Leaf',
  component: 'NatureOrganicsTab',
}

export const NATURE_TABS: TabDefinition[] = [
  BASE_TABS[0], // Brand
  NATURE_CATEGORY_TAB, // Nature Organics (category-specific)
  BASE_TABS[1], // Colors
  BASE_TABS[2], // Fonts
  BASE_TABS[3], // Icons
  BASE_TABS[4], // 3D/FX
  BASE_TABS[5], // Advanced
]

// ============================================
// PROMPT BUILDER HELPERS
// ============================================

export function buildNaturePromptSegment(config: NatureLogoConfig): string {
  const segments: string[] = []

  // Organic shape
  const shapeMap: Record<OrganicShape, string> = {
    'leaf': 'elegant leaf',
    'tree': 'tree silhouette',
    'vine': 'climbing vine',
    'roots': 'root system',
    'petals': 'flower petals',
    'branches': 'tree branches',
    'flower': 'blooming flower',
  }
  segments.push(`${config.leafStyle} ${shapeMap[config.organicShape]} icon`)

  // Color palette
  const paletteMap: Record<EcoColorPalette, string> = {
    'forest': 'deep forest greens',
    'spring': 'fresh spring colors',
    'autumn': 'warm autumn tones',
    'tropical': 'vibrant tropical colors',
    'earth': 'natural earth tones',
    'ocean': 'ocean-inspired blues and teals',
  }
  segments.push(`in ${paletteMap[config.ecoColorPalette]}`)

  // Texture
  if (config.natureTexture !== 'smooth') {
    segments.push(`with ${config.natureTexture} texture`)
  }

  // Growth effect
  if (config.growthEffect !== 'none') {
    const growthMap: Record<GrowthEffect, string> = {
      'none': '',
      'sprouting': 'with sprouting new growth',
      'flourishing': 'in full flourishing bloom',
      'seasonal': 'showing seasonal transition',
      'wind-blown': 'with gentle wind-blown movement',
    }
    segments.push(growthMap[config.growthEffect])
  }

  // Water element
  if (config.waterElement !== 'none') {
    segments.push(`with ${config.waterElement} water element`)
  }

  // Sun rays
  if (config.hasSunRays) {
    segments.push('with sun rays accent')
  }

  // Earth element
  if (config.hasEarthElement) {
    segments.push('grounded with earth element')
  }

  // Organic badge
  if (config.isOrganic) {
    segments.push('eco-friendly organic certified style')
  }

  return segments.filter(Boolean).join(', ')
}
