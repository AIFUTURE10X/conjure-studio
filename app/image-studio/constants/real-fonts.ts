/**
 * Real Google Fonts Library
 *
 * 18 curated fonts across 5 categories for professional logo text overlays
 */

export type RealFontCategory = 'modern' | 'luxury' | 'script' | 'bold' | 'tech'

export interface RealFont {
  name: string
  family: string // CSS font-family value
  category: RealFontCategory
  weights: number[]
  description: string
  googleUrl: string // Google Fonts URL parameter
}

export const REAL_FONTS: Record<string, RealFont> = {
  // Modern & Clean (5)
  montserrat: {
    name: 'Montserrat',
    family: "'Montserrat', sans-serif",
    category: 'modern',
    weights: [400, 500, 600, 700],
    description: 'Clean geometric sans',
    googleUrl: 'Montserrat:wght@400;500;600;700',
  },
  poppins: {
    name: 'Poppins',
    family: "'Poppins', sans-serif",
    category: 'modern',
    weights: [400, 500, 600, 700],
    description: 'Modern geometric sans',
    googleUrl: 'Poppins:wght@400;500;600;700',
  },
  nunito: {
    name: 'Nunito',
    family: "'Nunito', sans-serif",
    category: 'modern',
    weights: [400, 600, 700],
    description: 'Rounded friendly sans',
    googleUrl: 'Nunito:wght@400;600;700',
  },
  raleway: {
    name: 'Raleway',
    family: "'Raleway', sans-serif",
    category: 'modern',
    weights: [400, 500, 600],
    description: 'Elegant thin modern',
    googleUrl: 'Raleway:wght@400;500;600',
  },
  inter: {
    name: 'Inter',
    family: "'Inter', sans-serif",
    category: 'modern',
    weights: [400, 500, 600, 700],
    description: 'UI-optimized sans',
    googleUrl: 'Inter:wght@400;500;600;700',
  },

  // Luxury & Serif (4)
  'playfair-display': {
    name: 'Playfair Display',
    family: "'Playfair Display', serif",
    category: 'luxury',
    weights: [400, 600, 700],
    description: 'High-contrast luxury serif',
    googleUrl: 'Playfair+Display:wght@400;600;700',
  },
  'libre-baskerville': {
    name: 'Libre Baskerville',
    family: "'Libre Baskerville', serif",
    category: 'luxury',
    weights: [400, 700],
    description: 'Classic elegant serif',
    googleUrl: 'Libre+Baskerville:wght@400;700',
  },
  cinzel: {
    name: 'Cinzel',
    family: "'Cinzel', serif",
    category: 'luxury',
    weights: [400, 600, 700],
    description: 'Ancient Roman capitals',
    googleUrl: 'Cinzel:wght@400;600;700',
  },
  'cormorant-garamond': {
    name: 'Cormorant Garamond',
    family: "'Cormorant Garamond', serif",
    category: 'luxury',
    weights: [400, 500, 600],
    description: 'Refined display serif',
    googleUrl: 'Cormorant+Garamond:wght@400;500;600',
  },

  // Script & Handwritten (5)
  allura: {
    name: 'Allura',
    family: "'Allura', cursive",
    category: 'script',
    weights: [400],
    description: 'Wedding-style formal',
    googleUrl: 'Allura',
  },
  'great-vibes': {
    name: 'Great Vibes',
    family: "'Great Vibes', cursive",
    category: 'script',
    weights: [400],
    description: 'Flowing elegant script',
    googleUrl: 'Great+Vibes',
  },
  'dancing-script': {
    name: 'Dancing Script',
    family: "'Dancing Script', cursive",
    category: 'script',
    weights: [400, 500, 600, 700],
    description: 'Lively bouncy cursive',
    googleUrl: 'Dancing+Script:wght@400;500;600;700',
  },
  pacifico: {
    name: 'Pacifico',
    family: "'Pacifico', cursive",
    category: 'script',
    weights: [400],
    description: 'Retro surf script',
    googleUrl: 'Pacifico',
  },
  satisfy: {
    name: 'Satisfy',
    family: "'Satisfy', cursive",
    category: 'script',
    weights: [400],
    description: 'Casual brush script',
    googleUrl: 'Satisfy',
  },

  // Bold & Impact (3)
  anton: {
    name: 'Anton',
    family: "'Anton', sans-serif",
    category: 'bold',
    weights: [400],
    description: 'Powerful condensed sans',
    googleUrl: 'Anton',
  },
  'bebas-neue': {
    name: 'Bebas Neue',
    family: "'Bebas Neue', sans-serif",
    category: 'bold',
    weights: [400],
    description: 'Classic display condensed',
    googleUrl: 'Bebas+Neue',
  },
  oswald: {
    name: 'Oswald',
    family: "'Oswald', sans-serif",
    category: 'bold',
    weights: [400, 500, 600, 700],
    description: 'Modern condensed gothic',
    googleUrl: 'Oswald:wght@400;500;600;700',
  },

  // Tech & Futuristic (2)
  orbitron: {
    name: 'Orbitron',
    family: "'Orbitron', sans-serif",
    category: 'tech',
    weights: [400, 500, 600, 700],
    description: 'Sci-fi geometric',
    googleUrl: 'Orbitron:wght@400;500;600;700',
  },
  audiowide: {
    name: 'Audiowide',
    family: "'Audiowide', sans-serif",
    category: 'tech',
    weights: [400],
    description: 'Wide tech racing',
    googleUrl: 'Audiowide',
  },
}

// Font category labels for UI grouping
export const REAL_FONT_CATEGORIES: Record<RealFontCategory, { label: string; emoji: string }> = {
  modern: { label: 'Modern & Clean', emoji: '✨' },
  luxury: { label: 'Luxury & Serif', emoji: '👑' },
  script: { label: 'Script & Handwritten', emoji: '✍️' },
  bold: { label: 'Bold & Impact', emoji: '💪' },
  tech: { label: 'Tech & Futuristic', emoji: '🚀' },
}

// Alias for backward compatibility
export const FONT_CATEGORIES = REAL_FONT_CATEGORIES

// Get fonts by category
export function getFontsByCategory(category: RealFontCategory): RealFont[] {
  return Object.values(REAL_FONTS).filter((font) => font.category === category)
}

// Get all font IDs
export function getAllFontIds(): string[] {
  return Object.keys(REAL_FONTS)
}

// Build Google Fonts URL for all fonts
export function buildGoogleFontsUrl(): string {
  const families = Object.values(REAL_FONTS).map((font) => font.googleUrl).join('&family=')
  return `https://fonts.googleapis.com/css2?family=${families}&display=swap`
}

// Build Google Fonts URL for specific fonts
export function buildGoogleFontsUrlForFonts(fontIds: string[]): string {
  const families = fontIds
    .filter((id) => REAL_FONTS[id])
    .map((id) => REAL_FONTS[id].googleUrl)
    .join('&family=')
  return `https://fonts.googleapis.com/css2?family=${families}&display=swap`
}
