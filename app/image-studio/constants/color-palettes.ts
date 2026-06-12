/**
 * Color Palettes and Presets
 * Consolidated color constants used across the Image Studio
 */

// ============================================
// TYPES
// ============================================

export interface ColorOption {
  name: string
  value: string
  hex: string
}

export type ColorCategory = 'primary' | 'metallic' | 'neon' | 'pastel' | 'earth' | 'gradient'

/** Per-letter color assignment: 1-based letter position → palette color. */
export interface LetterColorConfig {
  position: number
  color: ColorOption
}

// ============================================
// QUICK COLOR PRESETS (Simple picker)
// ============================================

export const QUICK_COLORS = [
  '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00',
  '#ff00ff', '#00ffff', '#ffa500', '#800080', '#ffc0cb', '#808080'
]

// ============================================
// LETTER COLOR PALETTE
// ============================================

export const LETTER_COLOR_PALETTE: ColorOption[] = [
  { name: 'Red', value: 'red', hex: '#EF4444' },
  { name: 'Orange', value: 'orange', hex: '#F97316' },
  { name: 'Amber', value: 'amber', hex: '#F59E0B' },
  { name: 'Yellow', value: 'yellow', hex: '#EAB308' },
  { name: 'Lime', value: 'lime', hex: '#84CC16' },
  { name: 'Green', value: 'green', hex: '#22C55E' },
  { name: 'Cyan', value: 'cyan', hex: '#06B6D4' },
  { name: 'Blue', value: 'blue', hex: '#3B82F6' },
  { name: 'Purple', value: 'purple', hex: '#A855F7' },
  { name: 'Pink', value: 'pink', hex: '#EC4899' },
  { name: 'White', value: 'white', hex: '#FFFFFF' },
  { name: 'Black', value: 'black', hex: '#000000' },
]

// ============================================
// EXPANDED COLOR CATEGORIES
// ============================================

export const COLOR_CATEGORIES: { id: ColorCategory; label: string; icon: string }[] = [
  { id: 'primary', label: 'Primary', icon: '🎨' },
  { id: 'metallic', label: 'Metallic', icon: '✨' },
  { id: 'neon', label: 'Neon', icon: '💡' },
  { id: 'pastel', label: 'Pastel', icon: '🌸' },
  { id: 'earth', label: 'Earth', icon: '🌿' },
  { id: 'gradient', label: 'Gradient', icon: '🌈' },
]

// ============================================
// EXPANDED COLOR PRESETS
// ============================================

export const EXPANDED_COLOR_PRESETS: Record<ColorCategory, ColorOption[]> = {
  primary: [
    { name: 'Red', value: 'red', hex: '#EF4444' },
    { name: 'Crimson', value: 'crimson', hex: '#DC143C' },
    { name: 'Orange', value: 'orange', hex: '#F97316' },
    { name: 'Amber', value: 'amber', hex: '#F59E0B' },
    { name: 'Yellow', value: 'yellow', hex: '#EAB308' },
    { name: 'Lime', value: 'lime', hex: '#84CC16' },
    { name: 'Green', value: 'green', hex: '#22C55E' },
    { name: 'Emerald', value: 'emerald', hex: '#10B981' },
    { name: 'Teal', value: 'teal', hex: '#14B8A6' },
    { name: 'Cyan', value: 'cyan', hex: '#06B6D4' },
    { name: 'Sky', value: 'sky', hex: '#0EA5E9' },
    { name: 'Blue', value: 'blue', hex: '#3B82F6' },
    { name: 'Indigo', value: 'indigo', hex: '#6366F1' },
    { name: 'Violet', value: 'violet', hex: '#8B5CF6' },
    { name: 'Purple', value: 'purple', hex: '#A855F7' },
    { name: 'Fuchsia', value: 'fuchsia', hex: '#D946EF' },
    { name: 'Pink', value: 'pink', hex: '#EC4899' },
    { name: 'Rose', value: 'rose', hex: '#F43F5E' },
    { name: 'White', value: 'white', hex: '#FFFFFF' },
    { name: 'Black', value: 'black', hex: '#000000' },
  ],
  metallic: [
    { name: 'Chrome', value: 'chrome', hex: '#C0C0C0' },
    { name: 'Silver', value: 'silver', hex: '#E8E8E8' },
    { name: 'Gold', value: 'gold', hex: '#FFD700' },
    { name: 'Rose Gold', value: 'rose-gold', hex: '#B76E79' },
    { name: 'Bronze', value: 'bronze', hex: '#CD7F32' },
    { name: 'Copper', value: 'copper', hex: '#B87333' },
    { name: 'Platinum', value: 'platinum', hex: '#E5E4E2' },
    { name: 'Titanium', value: 'titanium', hex: '#878681' },
    { name: 'Brass', value: 'brass', hex: '#B5A642' },
    { name: 'Pewter', value: 'pewter', hex: '#96A8A1' },
  ],
  neon: [
    { name: 'Neon Pink', value: 'neon-pink', hex: '#FF10F0' },
    { name: 'Neon Magenta', value: 'neon-magenta', hex: '#FF00FF' },
    { name: 'Neon Red', value: 'neon-red', hex: '#FF3131' },
    { name: 'Neon Orange', value: 'neon-orange', hex: '#FF6600' },
    { name: 'Neon Yellow', value: 'neon-yellow', hex: '#FFFF00' },
    { name: 'Neon Green', value: 'neon-green', hex: '#39FF14' },
    { name: 'Neon Cyan', value: 'neon-cyan', hex: '#00FFFF' },
    { name: 'Neon Blue', value: 'neon-blue', hex: '#4D4DFF' },
    { name: 'Neon Purple', value: 'neon-purple', hex: '#BC13FE' },
    { name: 'Electric Blue', value: 'electric-blue', hex: '#7DF9FF' },
  ],
  pastel: [
    { name: 'Blush', value: 'blush', hex: '#FFB6C1' },
    { name: 'Peach', value: 'peach', hex: '#FFDAB9' },
    { name: 'Cream', value: 'cream', hex: '#FFFDD0' },
    { name: 'Mint', value: 'mint', hex: '#98FF98' },
    { name: 'Seafoam', value: 'seafoam', hex: '#93E9BE' },
    { name: 'Sky Blue', value: 'sky-blue', hex: '#87CEEB' },
    { name: 'Periwinkle', value: 'periwinkle', hex: '#CCCCFF' },
    { name: 'Lavender', value: 'lavender', hex: '#E6E6FA' },
    { name: 'Lilac', value: 'lilac', hex: '#DCD0FF' },
    { name: 'Baby Pink', value: 'baby-pink', hex: '#F4C2C2' },
  ],
  earth: [
    { name: 'Terracotta', value: 'terracotta', hex: '#E2725B' },
    { name: 'Rust', value: 'rust', hex: '#B7410E' },
    { name: 'Sienna', value: 'sienna', hex: '#A0522D' },
    { name: 'Chocolate', value: 'chocolate', hex: '#7B3F00' },
    { name: 'Coffee', value: 'coffee', hex: '#6F4E37' },
    { name: 'Olive', value: 'olive', hex: '#808000' },
    { name: 'Forest', value: 'forest', hex: '#228B22' },
    { name: 'Sage', value: 'sage', hex: '#9DC183' },
    { name: 'Sand', value: 'sand', hex: '#C2B280' },
    { name: 'Charcoal', value: 'charcoal', hex: '#36454F' },
  ],
  gradient: [
    { name: 'Sunset', value: 'sunset-gradient', hex: '#FF6B6B' },
    { name: 'Ocean', value: 'ocean-gradient', hex: '#667EEA' },
    { name: 'Aurora', value: 'aurora-gradient', hex: '#A8EDEA' },
    { name: 'Fire', value: 'fire-gradient', hex: '#F12711' },
    { name: 'Galaxy', value: 'galaxy-gradient', hex: '#8E2DE2' },
    { name: 'Tropical', value: 'tropical-gradient', hex: '#11998E' },
    { name: 'Cotton Candy', value: 'cotton-candy-gradient', hex: '#FFECD2' },
    { name: 'Midnight', value: 'midnight-gradient', hex: '#232526' },
  ],
}

// ============================================
// GRADIENT DEFINITIONS
// ============================================

export const GRADIENT_DEFINITIONS: Record<string, string> = {
  'sunset-gradient': 'linear-gradient(135deg, #FF6B6B 0%, #FFA07A 50%, #FFD93D 100%)',
  'ocean-gradient': 'linear-gradient(135deg, #667EEA 0%, #764BA2 50%, #6B8DD6 100%)',
  'aurora-gradient': 'linear-gradient(135deg, #A8EDEA 0%, #FED6E3 50%, #D299C2 100%)',
  'fire-gradient': 'linear-gradient(135deg, #F12711 0%, #F5AF19 100%)',
  'galaxy-gradient': 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 50%, #1A1A2E 100%)',
  'tropical-gradient': 'linear-gradient(135deg, #11998E 0%, #38EF7D 100%)',
  'cotton-candy-gradient': 'linear-gradient(135deg, #FFECD2 0%, #FCB69F 50%, #FF9A9E 100%)',
  'midnight-gradient': 'linear-gradient(135deg, #232526 0%, #414345 50%, #1a1a2e 100%)',
}
