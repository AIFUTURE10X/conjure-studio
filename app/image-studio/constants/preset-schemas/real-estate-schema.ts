/**
 * Real Estate Schema - Property/Real Estate category specific settings
 *
 * Used by presets: real-estate-house, real-estate-key
 */

import { BaseLogoConfig, DEFAULT_BASE_CONFIG, TabDefinition, BASE_TABS } from './base-schema'
import { ColorOption } from '../dot-matrix-config'

// ============================================
// REAL-ESTATE-SPECIFIC TYPES
// ============================================

export type PropertyType = 'residential' | 'commercial' | 'luxury' | 'industrial' | 'land' | 'mixed-use'
export type ArchitecturalStyle = 'contemporary' | 'classic' | 'minimalist' | 'art-deco' | 'colonial' | 'modern'
export type RooflineStyle = 'peaked' | 'flat' | 'curved' | 'multi-level' | 'gabled' | 'hip'
export type KeyStyle = 'none' | 'ornate' | 'modern' | 'vintage' | 'skeleton' | 'electronic'
export type PropertyElement = 'none' | 'door' | 'window' | 'chimney' | 'fence' | 'path'

// ============================================
// REAL ESTATE CONFIG INTERFACE
// ============================================

export interface RealEstateLogoConfig extends BaseLogoConfig {
  // Real estate-specific settings
  propertyType: PropertyType
  architecturalStyle: ArchitecturalStyle
  rooflineStyle: RooflineStyle
  keyStyle: KeyStyle
  propertyElement: PropertyElement
  primaryPropertyColor: ColorOption
  hasHouseIcon: boolean
  hasKeyIcon: boolean
  hasLocationPin: boolean
  showLuxuryBadge: boolean
  agencyStyle: 'boutique' | 'corporate' | 'local' | 'national'
}

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_REAL_ESTATE_CONFIG: RealEstateLogoConfig = {
  ...DEFAULT_BASE_CONFIG,

  // Override base defaults for real estate style
  textColor: { name: 'Navy', value: 'navy', hex: '#1E3A5F' },
  accentColor: { name: 'Gold', value: 'gold', hex: '#D4AF37' },
  fontStyle: 'sans-serif-bold',
  backgroundColor: 'white',
  metallicFinish: 'gold',

  // Real estate-specific defaults
  propertyType: 'residential',
  architecturalStyle: 'modern',
  rooflineStyle: 'peaked',
  keyStyle: 'none',
  propertyElement: 'none',
  primaryPropertyColor: { name: 'Navy Blue', value: 'navy', hex: '#1E3A5F' },
  hasHouseIcon: true,
  hasKeyIcon: false,
  hasLocationPin: false,
  showLuxuryBadge: false,
  agencyStyle: 'boutique',
}

// ============================================
// REAL ESTATE-SPECIFIC OPTIONS
// ============================================

export const PROPERTY_TYPE_OPTIONS: Array<{ value: PropertyType; label: string; description: string }> = [
  { value: 'residential', label: 'Residential', description: 'Homes and apartments' },
  { value: 'commercial', label: 'Commercial', description: 'Office and retail' },
  { value: 'luxury', label: 'Luxury', description: 'High-end properties' },
  { value: 'industrial', label: 'Industrial', description: 'Warehouses and factories' },
  { value: 'land', label: 'Land', description: 'Plots and acreage' },
  { value: 'mixed-use', label: 'Mixed Use', description: 'Combined property types' },
]

export const ARCHITECTURAL_STYLE_OPTIONS: Array<{ value: ArchitecturalStyle; label: string; description: string }> = [
  { value: 'contemporary', label: 'Contemporary', description: 'Current modern design' },
  { value: 'classic', label: 'Classic', description: 'Timeless traditional' },
  { value: 'minimalist', label: 'Minimalist', description: 'Clean, simple lines' },
  { value: 'art-deco', label: 'Art Deco', description: '1920s geometric' },
  { value: 'colonial', label: 'Colonial', description: 'Historic American' },
  { value: 'modern', label: 'Modern', description: 'Sharp, angular' },
]

export const ROOFLINE_STYLE_OPTIONS: Array<{ value: RooflineStyle; label: string; description: string }> = [
  { value: 'peaked', label: 'Peaked', description: 'Traditional triangle' },
  { value: 'flat', label: 'Flat', description: 'Modern flat roof' },
  { value: 'curved', label: 'Curved', description: 'Arched design' },
  { value: 'multi-level', label: 'Multi-Level', description: 'Complex roofline' },
  { value: 'gabled', label: 'Gabled', description: 'Classic gable' },
  { value: 'hip', label: 'Hip', description: 'Sloped on all sides' },
]

export const KEY_STYLE_OPTIONS: Array<{ value: KeyStyle; label: string; description: string }> = [
  { value: 'none', label: 'None', description: 'No key element' },
  { value: 'ornate', label: 'Ornate', description: 'Decorative vintage key' },
  { value: 'modern', label: 'Modern', description: 'Sleek contemporary key' },
  { value: 'vintage', label: 'Vintage', description: 'Antique key design' },
  { value: 'skeleton', label: 'Skeleton', description: 'Classic skeleton key' },
  { value: 'electronic', label: 'Electronic', description: 'Smart key/fob' },
]

export const PROPERTY_ELEMENT_OPTIONS: Array<{ value: PropertyElement; label: string; description: string }> = [
  { value: 'none', label: 'None', description: 'No extra element' },
  { value: 'door', label: 'Door', description: 'Entry door detail' },
  { value: 'window', label: 'Window', description: 'Window element' },
  { value: 'chimney', label: 'Chimney', description: 'Chimney stack' },
  { value: 'fence', label: 'Fence', description: 'Picket fence' },
  { value: 'path', label: 'Path', description: 'Walkway detail' },
]

export const AGENCY_STYLE_OPTIONS: Array<{ value: RealEstateLogoConfig['agencyStyle']; label: string; description: string }> = [
  { value: 'boutique', label: 'Boutique', description: 'Personalized, exclusive' },
  { value: 'corporate', label: 'Corporate', description: 'Large firm feel' },
  { value: 'local', label: 'Local', description: 'Community-focused' },
  { value: 'national', label: 'National', description: 'Nationwide presence' },
]

export const REAL_ESTATE_COLORS: ColorOption[] = [
  { name: 'Navy Blue', value: 'navy', hex: '#1E3A5F' },
  { name: 'Gold', value: 'gold', hex: '#D4AF37' },
  { name: 'Forest Green', value: 'forest', hex: '#228B22' },
  { name: 'Burgundy', value: 'burgundy', hex: '#722F37' },
  { name: 'Slate Gray', value: 'slate', hex: '#708090' },
  { name: 'Copper', value: 'copper', hex: '#B87333' },
]

// ============================================
// REAL ESTATE TAB DEFINITION
// ============================================

export const REAL_ESTATE_CATEGORY_TAB: TabDefinition = {
  id: 'property-style',
  label: 'Property',
  icon: 'Home',
  component: 'RealEstatePropertyTab',
}

export const REAL_ESTATE_TABS: TabDefinition[] = [
  BASE_TABS[0], // Brand
  REAL_ESTATE_CATEGORY_TAB, // Property (category-specific)
  BASE_TABS[1], // Colors
  BASE_TABS[2], // Fonts
  BASE_TABS[3], // Icons
  BASE_TABS[4], // 3D/FX
  BASE_TABS[5], // Advanced
]

// ============================================
// PROMPT BUILDER HELPERS
// ============================================

export function buildRealEstatePromptSegment(config: RealEstateLogoConfig): string {
  const segments: string[] = []

  // Property type
  segments.push(`${config.propertyType} real estate`)

  // Agency style
  const agencyMap: Record<RealEstateLogoConfig['agencyStyle'], string> = {
    'boutique': 'boutique agency',
    'corporate': 'corporate firm',
    'local': 'local community agency',
    'national': 'national brand',
  }
  segments.push(agencyMap[config.agencyStyle])

  // House icon
  if (config.hasHouseIcon) {
    const archMap: Record<ArchitecturalStyle, string> = {
      'contemporary': 'contemporary',
      'classic': 'classic traditional',
      'minimalist': 'minimalist modern',
      'art-deco': 'art deco style',
      'colonial': 'colonial style',
      'modern': 'sharp modern',
    }
    segments.push(`with ${archMap[config.architecturalStyle]} house icon`)

    if (config.rooflineStyle !== 'peaked') {
      segments.push(`${config.rooflineStyle} roofline`)
    }
  }

  // Key icon
  if (config.hasKeyIcon && config.keyStyle !== 'none') {
    segments.push(`with ${config.keyStyle} key symbol`)
  }

  // Location pin
  if (config.hasLocationPin) {
    segments.push('with location pin marker')
  }

  // Property element
  if (config.propertyElement !== 'none') {
    segments.push(`with ${config.propertyElement} detail`)
  }

  // Luxury badge
  if (config.showLuxuryBadge) {
    segments.push('premium luxury branding')
  }

  return segments.filter(Boolean).join(', ')
}
