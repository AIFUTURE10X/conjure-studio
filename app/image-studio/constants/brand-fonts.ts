/**
 * Brand Font Constants
 * Shared font-related constants used across mockup components
 */

// ============================================
// TYPES
// ============================================

export interface WeightOption {
  value: number
  label: string
}

// ============================================
// POPULAR FONTS
// ============================================

/**
 * Curated list of popular fonts for quick access in font selectors
 */
export const POPULAR_FONTS = [
  'montserrat',
  'poppins',
  'raleway',
  'playfair-display',
  'bebas-neue',
  'orbitron',
  'great-vibes',
  'pacifico'
]

// ============================================
// FONT WEIGHT OPTIONS
// ============================================

/**
 * Available font weight options with display labels
 */
export const WEIGHT_OPTIONS: WeightOption[] = [
  { value: 300, label: 'Fine' },
  { value: 400, label: 'Normal' },
  { value: 600, label: 'Bold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'X-Bold' },
]

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get the display label for a font weight value
 * @param weight - The numeric font weight (300, 400, 600, 700, 800)
 * @returns The human-readable label for the weight
 */
export function getWeightLabel(weight: number): string {
  const option = WEIGHT_OPTIONS.find(o => o.value === weight)
  return option?.label || `${weight}`
}
