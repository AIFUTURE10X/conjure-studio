/**
 * Food Schema - Food & Dining category specific settings
 *
 * Used by presets: food-restaurant, food-coffee
 */

import { BaseLogoConfig, DEFAULT_BASE_CONFIG, TabDefinition, BASE_TABS } from './base-schema'
import { ColorOption } from '../dot-matrix-config'

// ============================================
// FOOD-SPECIFIC TYPES
// ============================================

export type CuisineStyle = 'fine-dining' | 'casual' | 'artisan' | 'rustic' | 'modern' | 'fast-casual'
export type FoodIcon = 'none' | 'fork-knife' | 'chef-hat' | 'plate' | 'cup' | 'spoon' | 'whisk' | 'pizza' | 'burger'
export type WarmthLevel = 'cool' | 'neutral' | 'warm' | 'cozy' | 'hot'
export type FoodTexture = 'clean' | 'chalkboard' | 'vintage-paper' | 'wood-board' | 'menu-style'
export type AtmosphereType = 'elegant' | 'homey' | 'trendy' | 'traditional' | 'minimalist'

// ============================================
// FOOD CONFIG INTERFACE
// ============================================

export interface FoodLogoConfig extends BaseLogoConfig {
  // Food-specific settings
  cuisineStyle: CuisineStyle
  foodIcon: FoodIcon
  warmthLevel: WarmthLevel
  foodTexture: FoodTexture
  atmosphereType: AtmosphereType
  primaryWarmColor: ColorOption
  hasPlateElement: boolean
  hasSteamEffect: boolean
  isOrganic: boolean
  showCuisineType: string | null // "Italian", "Asian", etc.
}

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_FOOD_CONFIG: FoodLogoConfig = {
  ...DEFAULT_BASE_CONFIG,

  // Override base defaults for food style
  textColor: { name: 'Burgundy', value: 'burgundy', hex: '#722F37' },
  accentColor: { name: 'Gold', value: 'gold', hex: '#D4AF37' },
  fontStyle: 'serif-elegant',
  backgroundColor: 'dark-gray',

  // Food-specific defaults
  cuisineStyle: 'fine-dining',
  foodIcon: 'none',
  warmthLevel: 'warm',
  foodTexture: 'clean',
  atmosphereType: 'elegant',
  primaryWarmColor: { name: 'Warm Orange', value: 'warm-orange', hex: '#E07A2F' },
  hasPlateElement: false,
  hasSteamEffect: false,
  isOrganic: false,
  showCuisineType: null,
}

// ============================================
// FOOD-SPECIFIC OPTIONS
// ============================================

export const CUISINE_STYLE_OPTIONS: Array<{ value: CuisineStyle; label: string; description: string }> = [
  { value: 'fine-dining', label: 'Fine Dining', description: 'Upscale restaurant' },
  { value: 'casual', label: 'Casual', description: 'Relaxed dining' },
  { value: 'artisan', label: 'Artisan', description: 'Craft/specialty' },
  { value: 'rustic', label: 'Rustic', description: 'Farmhouse style' },
  { value: 'modern', label: 'Modern', description: 'Contemporary fusion' },
  { value: 'fast-casual', label: 'Fast Casual', description: 'Quick service quality' },
]

export const FOOD_ICON_OPTIONS: Array<{ value: FoodIcon; label: string; emoji: string }> = [
  { value: 'none', label: 'None', emoji: '—' },
  { value: 'fork-knife', label: 'Fork & Knife', emoji: '🍴' },
  { value: 'chef-hat', label: 'Chef Hat', emoji: '👨‍🍳' },
  { value: 'plate', label: 'Plate', emoji: '🍽️' },
  { value: 'cup', label: 'Cup/Mug', emoji: '☕' },
  { value: 'spoon', label: 'Spoon', emoji: '🥄' },
  { value: 'whisk', label: 'Whisk', emoji: '🥣' },
  { value: 'pizza', label: 'Pizza', emoji: '🍕' },
  { value: 'burger', label: 'Burger', emoji: '🍔' },
]

export const WARMTH_LEVEL_OPTIONS: Array<{ value: WarmthLevel; label: string; description: string; colorHint: string }> = [
  { value: 'cool', label: 'Cool', description: 'Fresh, light', colorHint: '#E0F2FE' },
  { value: 'neutral', label: 'Neutral', description: 'Balanced', colorHint: '#F5F5F4' },
  { value: 'warm', label: 'Warm', description: 'Inviting', colorHint: '#FEF3C7' },
  { value: 'cozy', label: 'Cozy', description: 'Homey feel', colorHint: '#FED7AA' },
  { value: 'hot', label: 'Hot', description: 'Energetic', colorHint: '#FCA5A5' },
]

export const FOOD_TEXTURE_OPTIONS: Array<{ value: FoodTexture; label: string; description: string }> = [
  { value: 'clean', label: 'Clean', description: 'Modern, minimal' },
  { value: 'chalkboard', label: 'Chalkboard', description: 'Cafe menu style' },
  { value: 'vintage-paper', label: 'Vintage Paper', description: 'Old recipe card' },
  { value: 'wood-board', label: 'Wood Board', description: 'Cutting board texture' },
  { value: 'menu-style', label: 'Menu Style', description: 'Classic menu design' },
]

export const ATMOSPHERE_OPTIONS: Array<{ value: AtmosphereType; label: string; description: string }> = [
  { value: 'elegant', label: 'Elegant', description: 'Sophisticated dining' },
  { value: 'homey', label: 'Homey', description: 'Home-cooked feel' },
  { value: 'trendy', label: 'Trendy', description: 'Hip and modern' },
  { value: 'traditional', label: 'Traditional', description: 'Classic establishment' },
  { value: 'minimalist', label: 'Minimalist', description: 'Clean and simple' },
]

export const FOOD_WARM_COLORS: ColorOption[] = [
  { name: 'Warm Orange', value: 'warm-orange', hex: '#E07A2F' },
  { name: 'Burgundy', value: 'burgundy', hex: '#722F37' },
  { name: 'Coffee Brown', value: 'coffee', hex: '#6F4E37' },
  { name: 'Cream', value: 'cream', hex: '#FFFDD0' },
  { name: 'Tomato Red', value: 'tomato', hex: '#FF6347' },
  { name: 'Olive', value: 'olive', hex: '#808000' },
  { name: 'Honey Gold', value: 'honey', hex: '#EB9605' },
]

export const CUISINE_TYPES = [
  'Italian', 'French', 'Asian', 'Japanese', 'Mexican', 'American',
  'Mediterranean', 'Indian', 'Thai', 'Greek', 'Spanish', 'Brazilian'
]

// ============================================
// FOOD TAB DEFINITION
// ============================================

export const FOOD_CATEGORY_TAB: TabDefinition = {
  id: 'food-culinary',
  label: 'Culinary',
  icon: 'UtensilsCrossed',
  component: 'FoodCulinaryTab',
}

export const FOOD_TABS: TabDefinition[] = [
  BASE_TABS[0], // Brand
  FOOD_CATEGORY_TAB, // Food Culinary (category-specific)
  BASE_TABS[1], // Colors
  BASE_TABS[2], // Fonts
  BASE_TABS[3], // Icons
  BASE_TABS[4], // 3D/FX
  BASE_TABS[5], // Advanced
]

// ============================================
// PROMPT BUILDER HELPERS
// ============================================

export function buildFoodPromptSegment(config: FoodLogoConfig): string {
  const segments: string[] = []

  // Cuisine style
  const styleMap: Record<CuisineStyle, string> = {
    'fine-dining': 'upscale fine dining restaurant',
    'casual': 'casual dining establishment',
    'artisan': 'artisan craft eatery',
    'rustic': 'rustic farmhouse restaurant',
    'modern': 'modern contemporary fusion',
    'fast-casual': 'quality fast-casual dining',
  }
  segments.push(styleMap[config.cuisineStyle])

  // Food icon
  if (config.foodIcon !== 'none') {
    const iconMap: Record<FoodIcon, string> = {
      'none': '',
      'fork-knife': 'with elegant fork and knife icon',
      'chef-hat': 'with chef hat symbol',
      'plate': 'with serving plate element',
      'cup': 'with coffee cup/mug icon',
      'spoon': 'with spoon element',
      'whisk': 'with whisk icon',
      'pizza': 'with pizza slice icon',
      'burger': 'with burger icon',
    }
    segments.push(iconMap[config.foodIcon])
  }

  // Warmth
  const warmthMap: Record<WarmthLevel, string> = {
    'cool': 'cool fresh color palette',
    'neutral': 'neutral balanced tones',
    'warm': 'warm inviting colors',
    'cozy': 'cozy homey atmosphere',
    'hot': 'vibrant energetic colors',
  }
  segments.push(warmthMap[config.warmthLevel])

  // Texture
  if (config.foodTexture !== 'clean') {
    segments.push(`${config.foodTexture} style texture`)
  }

  // Steam effect
  if (config.hasSteamEffect) {
    segments.push('with rising steam effect')
  }

  // Plate element
  if (config.hasPlateElement) {
    segments.push('with decorative plate border')
  }

  // Organic
  if (config.isOrganic) {
    segments.push('organic farm-to-table aesthetic')
  }

  // Cuisine type
  if (config.showCuisineType) {
    segments.push(`${config.showCuisineType} cuisine style`)
  }

  return segments.filter(Boolean).join(', ')
}
