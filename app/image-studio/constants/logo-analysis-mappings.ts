// ============================================
// LOGO ANALYSIS MAPPING CONSTANTS
// Used by useLogoAnalysisWizard to map AI analysis to config
// ============================================

// Maps analysis industry to questionnaire industry option IDs
export const INDUSTRY_MAP: Record<string, string> = {
  tech: 'tech',
  technology: 'tech',
  digital: 'tech',
  software: 'tech',
  luxury: 'luxury',
  premium: 'luxury',
  fashion: 'luxury',
  nature: 'nature',
  eco: 'nature',
  organic: 'nature',
  environmental: 'nature',
  food: 'food',
  restaurant: 'food',
  coffee: 'food',
  cafe: 'food',
  finance: 'finance',
  banking: 'finance',
  investment: 'finance',
  insurance: 'finance',
  creative: 'creative',
  design: 'creative',
  art: 'creative',
  photography: 'creative',
  media: 'creative',
  sports: 'sports',
  fitness: 'sports',
  athletic: 'sports',
  gym: 'sports',
  realestate: 'realestate',
  property: 'realestate',
  housing: 'realestate',
  construction: 'realestate',
}

// Maps analysis style to questionnaire style option IDs
export const STYLE_MAP: Record<string, string> = {
  modern: 'modern',
  clean: 'modern',
  minimal: 'modern',
  minimalist: 'modern',
  contemporary: 'modern',
  elegant: 'elegant',
  premium: 'elegant',
  sophisticated: 'elegant',
  luxurious: 'elegant',
  bold: 'bold',
  powerful: 'bold',
  strong: 'bold',
  impactful: 'bold',
  playful: 'playful',
  creative: 'playful',
  fun: 'playful',
  artistic: 'playful',
  organic: 'organic',
  natural: 'organic',
  earthy: 'organic',
}

// Maps analysis depth to questionnaire depth option IDs
export const DEPTH_MAP: Record<string, string> = {
  flat: 'flat',
  '2d': 'flat',
  subtle: 'subtle',
  slight: 'subtle',
  medium: 'medium',
  moderate: 'medium',
  dramatic: 'dramatic',
  deep: 'dramatic',
  extreme: 'dramatic',
}

// Color hex values for config
export interface ColorInfo {
  name: string
  value: string
  hex: string
}

export const COLOR_HEX_MAP: Record<string, ColorInfo> = {
  blue: { name: 'Blue', value: 'blue', hex: '#3B82F6' },
  purple: { name: 'Purple', value: 'purple', hex: '#8B5CF6' },
  gold: { name: 'Gold', value: 'gold', hex: '#D4AF37' },
  green: { name: 'Green', value: 'green', hex: '#22C55E' },
  red: { name: 'Red', value: 'red', hex: '#EF4444' },
  black: { name: 'Black', value: 'black', hex: '#000000' },
  cyan: { name: 'Cyan', value: 'cyan', hex: '#06B6D4' },
  pink: { name: 'Pink', value: 'pink', hex: '#EC4899' },
}

// Maps style to font style
export const STYLE_TO_FONT_MAP: Record<string, string> = {
  modern: 'modern-geometric',
  elegant: 'serif-elegant',
  bold: 'sans-serif-bold',
  playful: 'rounded-friendly',
  organic: 'handwritten-casual',
}

// Maps style to text weight
export const STYLE_TO_WEIGHT_MAP: Record<string, string> = {
  modern: 'bold',
  elegant: 'regular',
  bold: 'extra-bold',
  playful: 'bold',
  organic: 'regular',
}

// Maps depth level
export const DEPTH_LEVEL_MAP: Record<string, string> = {
  flat: 'flat',
  subtle: 'subtle',
  medium: 'medium',
  deep: 'deep',
  dramatic: 'deep',
  extreme: 'extreme',
}

// Maps pattern to config values
export const PATTERN_MAP: Record<string, string> = {
  'circuit': 'circuit',
  'neural': 'neural',
  'grid': 'grid',
  'hexagon': 'hexagon',
  'dot-matrix': 'halftone',
  'halftone': 'halftone',
  'radial': 'radial',
}

// Maps icon preference based on industry
export const INDUSTRY_TO_ICON_MAP: Record<string, string> = {
  tech: 'tech',
  nature: 'nature',
  creative: 'abstract',
  sports: 'abstract',
}

// ============================================
// PRESET SCORING CONFIGURATION
// ============================================

// Industry to preset mappings for scoring
export const INDUSTRY_PRESETS: Record<string, string[]> = {
  tech: ['tech-circuit', 'tech-ai', 'tech-cube'],
  luxury: ['luxury-crown', 'luxury-diamond'],
  nature: ['nature-leaf'],
  food: ['food-restaurant', 'food-coffee'],
  finance: ['finance-growth', 'finance-shield'],
  creative: ['creative-studio', 'creative-camera'],
  sports: ['sports-fitness'],
  realestate: ['real-estate-house', 'real-estate-key'],
  corporate: ['corporate-dotmatrix', 'corporate-swoosh', 'corporate-globe'],
}

// Style bonus presets for scoring
export const STYLE_BONUS_PRESETS: Record<string, string[]> = {
  modern: ['tech-cube', 'corporate-dotmatrix', 'tech-circuit'],
  elegant: ['luxury-crown', 'luxury-diamond', 'finance-shield'],
  bold: ['sports-fitness', 'corporate-swoosh', 'tech-ai'],
  playful: ['creative-studio', 'creative-camera', 'food-coffee'],
  organic: ['nature-leaf', 'food-restaurant', 'creative-studio'],
}

// Pattern to preset mappings for scoring
export const PATTERN_PRESETS: Record<string, string[]> = {
  'circuit': ['tech-circuit', 'tech-ai'],
  'neural': ['tech-ai', 'tech-circuit'],
  'grid': ['tech-cube', 'corporate-dotmatrix'],
  'halftone': ['corporate-dotmatrix', 'creative-studio'],
  'dot-matrix': ['corporate-dotmatrix', 'corporate-swoosh'],
}

// Default fallback presets
export const DEFAULT_PRESETS = ['corporate-dotmatrix', 'tech-circuit', 'luxury-crown', 'creative-studio']
