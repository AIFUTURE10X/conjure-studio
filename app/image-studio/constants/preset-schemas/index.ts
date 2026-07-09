/**
 * Preset Schema Registry
 *
 * Central registry for all logo preset schemas.
 * Maps preset IDs to their category-specific schemas and configurators.
 */

import { PresetCategory } from '../logo-presets'

// Base schema exports
export * from './base-schema'

// Category schema exports
export * from './tech-schema'
export * from './luxury-schema'
export * from './nature-schema'
export * from './food-schema'
export * from './real-estate-schema'
export * from './finance-schema'
export * from './creative-schema'
export * from './sports-schema'
export * from './corporate-schema'

// Import tab definitions
import { BASE_TABS, TabDefinition, BaseLogoConfig, DEFAULT_BASE_CONFIG } from './base-schema'
import { TECH_TABS, TechLogoConfig, DEFAULT_TECH_CONFIG, buildTechPromptSegment } from './tech-schema'
import { LUXURY_TABS, LuxuryLogoConfig, DEFAULT_LUXURY_CONFIG, buildLuxuryPromptSegment } from './luxury-schema'
import { NATURE_TABS, NatureLogoConfig, DEFAULT_NATURE_CONFIG, buildNaturePromptSegment } from './nature-schema'
import { FOOD_TABS, FoodLogoConfig, DEFAULT_FOOD_CONFIG, buildFoodPromptSegment } from './food-schema'
import { REAL_ESTATE_TABS, RealEstateLogoConfig, DEFAULT_REAL_ESTATE_CONFIG, buildRealEstatePromptSegment } from './real-estate-schema'
import { FINANCE_TABS, FinanceLogoConfig, DEFAULT_FINANCE_CONFIG, buildFinancePromptSegment } from './finance-schema'
import { CREATIVE_TABS, CreativeLogoConfig, DEFAULT_CREATIVE_CONFIG, buildCreativePromptSegment } from './creative-schema'
import { SPORTS_TABS, SportsLogoConfig, DEFAULT_SPORTS_CONFIG, buildSportsPromptSegment } from './sports-schema'
import { CORPORATE_TABS, CorporateLogoConfig, DEFAULT_CORPORATE_CONFIG, buildCorporatePromptSegment } from './corporate-schema'

// ============================================
// UNIFIED CONFIG TYPE
// ============================================

/**
 * Union type of all possible config types
 * This allows the UnifiedConfigurator to work with any preset type
 */
export type UnifiedLogoConfig =
  | BaseLogoConfig
  | TechLogoConfig
  | LuxuryLogoConfig
  | NatureLogoConfig
  | FoodLogoConfig
  | RealEstateLogoConfig
  | FinanceLogoConfig
  | CreativeLogoConfig
  | SportsLogoConfig
  | CorporateLogoConfig

// ============================================
// SCHEMA REGISTRY
// ============================================

export interface PresetSchema {
  category: PresetCategory
  tabs: TabDefinition[]
  defaults: Partial<UnifiedLogoConfig>
  buildPromptSegment: (config: UnifiedLogoConfig) => string
}

/**
 * Maps preset IDs to their schemas
 */
export const PRESET_SCHEMA_REGISTRY: Record<string, PresetSchema> = {
  // Real Estate
  'real-estate-house': {
    category: 'real-estate',
    tabs: REAL_ESTATE_TABS,
    defaults: DEFAULT_REAL_ESTATE_CONFIG,
    buildPromptSegment: (config) => buildRealEstatePromptSegment(config as RealEstateLogoConfig),
  },
  'real-estate-key': {
    category: 'real-estate',
    tabs: REAL_ESTATE_TABS,
    defaults: { ...DEFAULT_REAL_ESTATE_CONFIG, hasKeyIcon: true, hasHouseIcon: false },
    buildPromptSegment: (config) => buildRealEstatePromptSegment(config as RealEstateLogoConfig),
  },

  // Technology
  'tech-circuit': {
    category: 'tech',
    tabs: TECH_TABS,
    defaults: { ...DEFAULT_TECH_CONFIG, techPattern: 'circuit' },
    buildPromptSegment: (config) => buildTechPromptSegment(config as TechLogoConfig),
  },
  'tech-ai': {
    category: 'tech',
    tabs: TECH_TABS,
    defaults: { ...DEFAULT_TECH_CONFIG, techPattern: 'neural', digitalEffect: 'hologram' },
    buildPromptSegment: (config) => buildTechPromptSegment(config as TechLogoConfig),
  },
  'tech-cube': {
    category: 'tech',
    tabs: TECH_TABS,
    defaults: { ...DEFAULT_TECH_CONFIG, techPattern: 'hexagon', depthLevel: 'deep' },
    buildPromptSegment: (config) => buildTechPromptSegment(config as TechLogoConfig),
  },

  // Food & Dining
  'food-restaurant': {
    category: 'food',
    tabs: FOOD_TABS,
    defaults: { ...DEFAULT_FOOD_CONFIG, cuisineStyle: 'fine-dining', foodIcon: 'fork-knife' },
    buildPromptSegment: (config) => buildFoodPromptSegment(config as FoodLogoConfig),
  },
  'food-coffee': {
    category: 'food',
    tabs: FOOD_TABS,
    defaults: { ...DEFAULT_FOOD_CONFIG, cuisineStyle: 'artisan', foodIcon: 'cup', atmosphereType: 'homey' },
    buildPromptSegment: (config) => buildFoodPromptSegment(config as FoodLogoConfig),
  },

  // Finance
  'finance-growth': {
    category: 'finance',
    tabs: FINANCE_TABS,
    defaults: { ...DEFAULT_FINANCE_CONFIG, growthSymbol: 'chart', financeType: 'investment' },
    buildPromptSegment: (config) => buildFinancePromptSegment(config as FinanceLogoConfig),
  },
  'finance-shield': {
    category: 'finance',
    tabs: FINANCE_TABS,
    defaults: { ...DEFAULT_FINANCE_CONFIG, trustElement: 'shield', securityLevel: 'fortress' },
    buildPromptSegment: (config) => buildFinancePromptSegment(config as FinanceLogoConfig),
  },

  // Creative
  'creative-studio': {
    category: 'creative',
    tabs: CREATIVE_TABS,
    defaults: { ...DEFAULT_CREATIVE_CONFIG, creativeField: 'design', creativeElement: 'palette' },
    buildPromptSegment: (config) => buildCreativePromptSegment(config as CreativeLogoConfig),
  },
  'creative-camera': {
    category: 'creative',
    tabs: CREATIVE_TABS,
    defaults: { ...DEFAULT_CREATIVE_CONFIG, creativeField: 'photography', creativeElement: 'camera' },
    buildPromptSegment: (config) => buildCreativePromptSegment(config as CreativeLogoConfig),
  },

  // Sports
  'sports-fitness': {
    category: 'sports',
    tabs: SPORTS_TABS,
    defaults: { ...DEFAULT_SPORTS_CONFIG, sportsType: 'gym', sportsElement: 'dumbbell' },
    buildPromptSegment: (config) => buildSportsPromptSegment(config as SportsLogoConfig),
  },

  // Luxury
  'luxury-crown': {
    category: 'luxury',
    tabs: LUXURY_TABS,
    defaults: { ...DEFAULT_LUXURY_CONFIG, hasCrownElement: true },
    buildPromptSegment: (config) => buildLuxuryPromptSegment(config as LuxuryLogoConfig),
  },
  'luxury-diamond': {
    category: 'luxury',
    tabs: LUXURY_TABS,
    defaults: { ...DEFAULT_LUXURY_CONFIG, gemStyle: 'diamond', gemPlacement: 'accent' },
    buildPromptSegment: (config) => buildLuxuryPromptSegment(config as LuxuryLogoConfig),
  },

  // Nature
  'nature-leaf': {
    category: 'nature',
    tabs: NATURE_TABS,
    defaults: DEFAULT_NATURE_CONFIG,
    buildPromptSegment: (config) => buildNaturePromptSegment(config as NatureLogoConfig),
  },

  // Corporate
  'corporate-dotmatrix': {
    category: 'corporate',
    tabs: CORPORATE_TABS,
    defaults: DEFAULT_CORPORATE_CONFIG,
    buildPromptSegment: (config) => buildCorporatePromptSegment(config as CorporateLogoConfig),
  },
  'corporate-swoosh': {
    category: 'corporate',
    tabs: CORPORATE_TABS,
    defaults: { ...DEFAULT_CORPORATE_CONFIG, swooshStyle: 'dynamic', patternStyle: 'uniform' },
    buildPromptSegment: (config) => buildCorporatePromptSegment(config as CorporateLogoConfig),
  },
  'corporate-globe': {
    category: 'corporate',
    tabs: CORPORATE_TABS,
    defaults: { ...DEFAULT_CORPORATE_CONFIG, hasGlobeElement: true, hasNetworkLines: true, isGlobalBrand: true },
    buildPromptSegment: (config) => buildCorporatePromptSegment(config as CorporateLogoConfig),
  },
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get the schema for a preset ID
 */
export function getSchemaForPreset(presetId: string): PresetSchema | null {
  return PRESET_SCHEMA_REGISTRY[presetId] || null
}

/**
 * Get tabs for a preset ID (with fallback to base tabs)
 */
export function getTabsForPreset(presetId: string): TabDefinition[] {
  const schema = PRESET_SCHEMA_REGISTRY[presetId]
  return schema?.tabs || BASE_TABS
}

/**
 * Get default config for a preset ID
 */
export function getDefaultConfigForPreset(presetId: string): Partial<UnifiedLogoConfig> {
  const schema = PRESET_SCHEMA_REGISTRY[presetId]
  return schema?.defaults || DEFAULT_BASE_CONFIG
}

/**
 * Get category for a preset ID
 */
export function getCategoryForPreset(presetId: string): PresetCategory | null {
  const schema = PRESET_SCHEMA_REGISTRY[presetId]
  return schema?.category || null
}

/**
 * Get all preset IDs for a category
 */
export function getPresetIdsForCategory(category: PresetCategory): string[] {
  return Object.entries(PRESET_SCHEMA_REGISTRY)
    .filter(([_, schema]) => schema.category === category)
    .map(([id]) => id)
}

/**
 * Check if a preset has a category-specific tab
 */
export function hasCategoryTab(presetId: string): boolean {
  const schema = PRESET_SCHEMA_REGISTRY[presetId]
  if (!schema) return false
  return schema.tabs.length > BASE_TABS.length
}

/**
 * Get the category-specific tab for a preset (if any)
 */
export function getCategoryTab(presetId: string): TabDefinition | null {
  const schema = PRESET_SCHEMA_REGISTRY[presetId]
  if (!schema) return null

  // The category tab is typically the second tab (after Brand)
  const categoryTab = schema.tabs.find(tab =>
    !BASE_TABS.some(baseTab => baseTab.id === tab.id)
  )

  return categoryTab || null
}

/**
 * Build a full prompt from a preset ID and config
 * Useful for generating directly without opening the configurator
 */
export function buildFullPrompt(presetId: string, config: Partial<UnifiedLogoConfig>): string {
  const schema = getSchemaForPreset(presetId)
  const defaults = getDefaultConfigForPreset(presetId)
  const mergedConfig = { ...defaults, ...config } as UnifiedLogoConfig

  const segments: string[] = []

  // Brand name with text placement
  if (mergedConfig.brandName) {
    const brandName = mergedConfig.brandName.trim()

    // Check for textPlacement from wizard config
    const textPlacement = (mergedConfig as any).textPlacement || 'center'

    if (textPlacement && textPlacement !== 'center') {
      const textPlacementMap: Record<string, string> = {
        'left': `brand name "${brandName}" positioned to the LEFT side of the icon/symbol`,
        'right': `brand name "${brandName}" positioned to the RIGHT side of the icon/symbol`,
        'stacked': `icon/symbol on top with brand name "${brandName}" below`,
        'inline': `brand name "${brandName}" inline horizontally with icon/symbol`,
      }
      if (textPlacementMap[textPlacement]) {
        segments.push(textPlacementMap[textPlacement])
      } else {
        segments.push(`"${brandName}"`)
      }
    } else {
      // Default centered text
      segments.push(`"${brandName}"`)
    }
  }

  // Tagline with expanded position options
  if (mergedConfig.tagline) {
    const taglinePositionMap: Record<string, string> = {
      'below': 'with tagline below the brand name',
      'above': 'with tagline above the brand name',
      'right': 'with tagline to the right of the brand name',
      'left': 'with tagline to the LEFT of the brand name',
      'inline': 'with tagline inline with the brand name',
      'integrated': 'with tagline integrated into the logo design',
    }
    // Check both taglinePlacement (from wizard) and taglinePosition (from schema)
    const taglinePos = (mergedConfig as any).taglinePlacement || mergedConfig.taglinePosition || 'below'
    segments.push(`${taglinePositionMap[taglinePos] || 'with tagline'}: "${mergedConfig.tagline}"`)
  }

  // Category-specific prompt segment
  if (schema?.buildPromptSegment) {
    const categorySegment = schema.buildPromptSegment(mergedConfig)
    if (categorySegment) {
      segments.push(categorySegment)
    }
  }

  // ============================================
  // IMAGE COLORS
  // ============================================
  const imageColorScheme = (mergedConfig as any).imageColorScheme
  if (imageColorScheme) {
    const schemeMap: Record<string, string> = {
      'monochrome': 'monochromatic single-color design',
      'duotone': 'two-tone color scheme',
      'tricolor': 'three-color palette',
      'multicolor': 'vibrant multicolor design',
      'gradient': 'smooth gradient color transitions',
    }
    if (schemeMap[imageColorScheme]) {
      segments.push(schemeMap[imageColorScheme])
    }
  }

  // Specific image colors (from color picker)
  const imageColors = (mergedConfig as any).imageColors
  if (imageColors && Array.isArray(imageColors) && imageColors.length > 0) {
    const colorNames = imageColors.map((c: string) => c.charAt(0).toUpperCase() + c.slice(1))
    if (colorNames.length === 1) {
      segments.push(`in ${colorNames[0]}`)
    } else if (colorNames.length === 2) {
      segments.push(`in ${colorNames[0]} and ${colorNames[1]}`)
    } else {
      const lastColor = colorNames.pop()
      segments.push(`in ${colorNames.join(', ')}, and ${lastColor}`)
    }
  }

  // ============================================
  // TEXT COLORS
  // ============================================
  const textColorChoice = (mergedConfig as any).textColorChoice
  if (textColorChoice && textColorChoice !== 'match-image') {
    if (textColorChoice === 'custom') {
      const customColor = (mergedConfig as any).customTextColor
      if (customColor) {
        segments.push(`${customColor} colored text`)
      }
    } else {
      segments.push(`${textColorChoice} colored text`)
    }
  }

  // ============================================
  // ICON CATEGORY (from wizard)
  // ============================================
  const iconCategory = (mergedConfig as any).iconCategory
  if (iconCategory && iconCategory !== 'none') {
    const iconCategoryMap: Record<string, string> = {
      'abstract': 'with abstract geometric icon element',
      'industry': 'with industry-specific icon element',
      'nature': 'with nature-inspired organic icon element',
      'tech': 'with technology/digital icon element',
      'health': 'with health/medical icon element',
      'education': 'with education/learning icon element',
      'entertainment': 'with entertainment/media icon element',
      'finance': 'with finance/business icon element',
    }
    if (iconCategoryMap[iconCategory]) {
      segments.push(iconCategoryMap[iconCategory])
    } else {
      segments.push(`with ${iconCategory} style icon element`)
    }
  }

  // ============================================
  // FONT PROMPT (from wizard - specific font styling)
  // ============================================
  const fontPrompt = (mergedConfig as any).fontPrompt
  if (fontPrompt) {
    segments.push(`with ${fontPrompt} typography`)
  } else {
    // Fallback: If no specific fontPrompt but fontStyle is set from style question
    const fontStyle = (mergedConfig as any).fontStyle || mergedConfig.fontStyle
    if (fontStyle) {
      const fontStyleMap: Record<string, string> = {
        'modern-geometric': 'with modern geometric sans-serif typography',
        'serif-elegant': 'with elegant serif typography',
        'sans-serif-bold': 'with bold sans-serif typography',
        'tech-digital': 'with tech digital typography',
        'script-fancy': 'with fancy script typography',
        'display-bold': 'with bold display typography',
        'retro': 'with retro vintage typography',
        'script': 'with script calligraphy typography',
        'tech': 'with futuristic tech typography',
      }
      if (fontStyleMap[fontStyle]) {
        segments.push(fontStyleMap[fontStyle])
      }
    }
  }

  // ============================================
  // STYLE-SPECIFIC SETTINGS (from wizard style question)
  // ============================================

  // Text weight (from Bold & Powerful style)
  const textWeight = (mergedConfig as any).textWeight
  if (textWeight && textWeight !== 'normal') {
    const weightMap: Record<string, string> = {
      'bold': 'bold heavy text',
      'extra-bold': 'extra bold impactful text',
      'thin': 'thin delicate text',
    }
    if (weightMap[textWeight]) {
      segments.push(weightMap[textWeight])
    }
  }

  // Color vibrancy (from Playful & Creative style)
  const colorVibrancy = (mergedConfig as any).colorVibrancy
  if (colorVibrancy && colorVibrancy !== 'normal') {
    const vibrancyMap: Record<string, string> = {
      'vibrant': 'vibrant saturated colors',
      'muted': 'muted desaturated colors',
      'pastel': 'soft pastel colors',
    }
    if (vibrancyMap[colorVibrancy]) {
      segments.push(vibrancyMap[colorVibrancy])
    }
  }

  // Eco color palette (from Natural & Organic style)
  const ecoColorPalette = (mergedConfig as any).ecoColorPalette
  if (ecoColorPalette) {
    const paletteMap: Record<string, string> = {
      'forest': 'forest green earthy color palette',
      'ocean': 'ocean blue aquatic color palette',
      'earth': 'warm earth tone color palette',
      'sunset': 'sunset warm gradient color palette',
    }
    if (paletteMap[ecoColorPalette]) {
      segments.push(paletteMap[ecoColorPalette])
    }
  }

  // Glow effect (from Futuristic & Tech style)
  const glowEnabled = (mergedConfig as any).glowEnabled
  if (glowEnabled === true) {
    segments.push('with neon glow effect')
  }

  // Texture style (from Handcrafted & Artisan style)
  const textureStyle = (mergedConfig as any).textureStyle
  if (textureStyle && textureStyle !== 'none') {
    const textureMap: Record<string, string> = {
      'textured': 'with hand-drawn textured appearance',
      'rough': 'with rough organic texture',
      'smooth': 'with smooth polished surface',
    }
    if (textureMap[textureStyle]) {
      segments.push(textureMap[textureStyle])
    }
  }

  // 3D depth
  if (mergedConfig.depthLevel && mergedConfig.depthLevel !== 'flat') {
    const depthMap: Record<string, string> = {
      'subtle': 'subtle 3D depth',
      'medium': 'medium 3D extrusion',
      'deep': 'deep 3D extrusion',
      'extreme': 'extreme dramatic 3D depth',
    }
    if (depthMap[mergedConfig.depthLevel]) {
      segments.push(depthMap[mergedConfig.depthLevel])
    }
  }

  // 3D style type (extruded, embossed, floating, debossed) with intensity
  if ((mergedConfig as any).depthStylePrompt) {
    const intensity = (mergedConfig as any).extrusionDepth ?? 50
    let intensityWord = 'moderate'
    if (intensity <= 20) intensityWord = 'subtle'
    else if (intensity <= 40) intensityWord = 'light'
    else if (intensity <= 60) intensityWord = 'moderate'
    else if (intensity <= 80) intensityWord = 'pronounced'
    else intensityWord = 'extreme'

    segments.push(`${intensityWord} ${(mergedConfig as any).depthStylePrompt}`)
  }

  // Metallic finish
  if (mergedConfig.metallicFinish) {
    segments.push(`${mergedConfig.metallicFinish} metallic finish`)
  }

  // Lighting
  if (mergedConfig.lightingDirection && mergedConfig.lightingDirection !== 'top-left') {
    segments.push(`lighting from ${mergedConfig.lightingDirection}`)
  }

  // Sparkle
  if (mergedConfig.sparkleIntensity && mergedConfig.sparkleIntensity !== 'none') {
    segments.push(`${mergedConfig.sparkleIntensity} sparkle accents`)
  }

  // Background
  const bgMap: Record<string, string> = {
    'dark-navy': 'dark navy blue background',
    'black': 'pure black background',
    'dark-gray': 'dark gray background',
    'gradient': 'gradient background',
    'transparent': 'transparent background',
    'white': 'white background',
    'light-gray': 'light gray background',
  }
  if (mergedConfig.backgroundColor && bgMap[mergedConfig.backgroundColor]) {
    segments.push(bgMap[mergedConfig.backgroundColor])
  }

  // Custom logo image description from wizard (logoImagePrompt)
  if ((mergedConfig as any).logoImagePrompt) {
    segments.push((mergedConfig as any).logoImagePrompt)
  }

  // ============================================
  // TILT ANGLE (from wizard)
  // ============================================
  const tiltAngle = (mergedConfig as any).tiltAngle
  if (tiltAngle && tiltAngle !== 0) {
    const absAngle = Math.abs(tiltAngle)
    const direction = tiltAngle < 0 ? 'left' : 'right'
    if (absAngle <= 10) {
      segments.push(`subtle ${direction} tilt rotation`)
    } else if (absAngle <= 25) {
      segments.push(`dynamic ${direction} tilt at ${absAngle} degrees`)
    } else {
      segments.push(`dramatic ${direction} tilt rotation at ${absAngle} degrees`)
    }
  }

  // ============================================
  // TEXT VERTICAL ALIGNMENT (from wizard)
  // ============================================
  const textVerticalAlign = (mergedConfig as any).textVerticalAlign
  if (textVerticalAlign && textVerticalAlign !== 'center') {
    const alignMap: Record<string, string> = {
      'top': 'with text raised/positioned higher relative to icon',
      'bottom': 'with text lowered/positioned lower relative to icon',
    }
    if (alignMap[textVerticalAlign]) {
      segments.push(alignMap[textVerticalAlign])
    }
  }

  // Professional quality
  segments.push('Professional premium quality corporate branding')

  return segments.filter(Boolean).join(' ')
}

/**
 * Build a negative prompt for a preset
 */
export function buildNegativePromptForPreset(config: Partial<UnifiedLogoConfig>): string {
  const negatives: string[] = [
    'blurry',
    'low quality',
    'amateur',
    'distorted text',
    'misspelled',
    'watermark',
    'signature',
  ]

  // Add depth-specific negatives
  if (config.depthLevel === 'flat') {
    negatives.push('3D', 'depth', 'extrusion', 'shadow')
  }

  return negatives.join(', ')
}
