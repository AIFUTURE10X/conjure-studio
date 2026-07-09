// ============================================
// MATERIAL TYPES
// ============================================

export type MaterialType =
  | 'metallic-chrome'
  | 'metallic-gold'
  | 'metallic-bronze'
  | 'metallic-copper'
  | 'metallic-rose-gold'
  | 'metallic-platinum'
  | 'rubber-matte'
  | 'rubber-glossy'
  | 'matte-flat'
  | 'glossy-plastic'
  | 'glass-clear'
  | 'glass-frosted'
  | 'velvet-soft'
  | 'brushed-metal'
  | 'neon-glow'
  | 'holographic'
  | 'wood-grain'
  | 'carbon-fiber'
  | 'marble'
  | 'concrete'
  | 'leather'
  | 'crystal'

export type MaterialCategory = 'metallic' | 'rubber' | 'matte' | 'glossy' | 'special' | 'texture'

export interface MaterialOption {
  id: MaterialType
  name: string
  category: MaterialCategory
  description: string
  promptDescription: string
  previewGradient: string
  icon: string
}

// ============================================
// MATERIAL OPTIONS
// ============================================

export const MATERIAL_OPTIONS: MaterialOption[] = [
  // Metallic
  {
    id: 'metallic-chrome',
    name: 'Chrome',
    category: 'metallic',
    description: 'Reflective mirror-like chrome',
    promptDescription: 'shiny reflective chrome metallic finish with mirror highlights',
    previewGradient: 'linear-gradient(135deg, #e8e8e8 0%, #fff 25%, #a0a0a0 50%, #fff 75%, #c0c0c0 100%)',
    icon: '🪞'
  },
  {
    id: 'metallic-gold',
    name: 'Gold',
    category: 'metallic',
    description: 'Luxurious gold metallic',
    promptDescription: 'luxurious gold metallic finish with warm reflections',
    previewGradient: 'linear-gradient(135deg, #bf953f 0%, #fcf6ba 25%, #b38728 50%, #fbf5b7 75%, #aa771c 100%)',
    icon: '🥇'
  },
  {
    id: 'metallic-bronze',
    name: 'Bronze',
    category: 'metallic',
    description: 'Warm antique bronze',
    promptDescription: 'warm antique bronze metallic with aged patina',
    previewGradient: 'linear-gradient(135deg, #804a00 0%, #cd7f32 50%, #9c6630 100%)',
    icon: '🥉'
  },
  {
    id: 'metallic-copper',
    name: 'Copper',
    category: 'metallic',
    description: 'Rich copper tones',
    promptDescription: 'rich copper metallic finish with orange reflections',
    previewGradient: 'linear-gradient(135deg, #8b4513 0%, #b87333 50%, #da8a67 100%)',
    icon: '🔶'
  },
  {
    id: 'metallic-rose-gold',
    name: 'Rose Gold',
    category: 'metallic',
    description: 'Elegant pink gold',
    promptDescription: 'elegant rose gold metallic with pink undertones',
    previewGradient: 'linear-gradient(135deg, #b76e79 0%, #ecc5c0 50%, #d4a5a5 100%)',
    icon: '🌸'
  },
  {
    id: 'metallic-platinum',
    name: 'Platinum',
    category: 'metallic',
    description: 'Premium silvery platinum',
    promptDescription: 'premium platinum metallic with cool silvery sheen',
    previewGradient: 'linear-gradient(135deg, #d0d0d0 0%, #f5f5f5 25%, #b8b8b8 50%, #e8e8e8 100%)',
    icon: '💎'
  },

  // Rubber
  {
    id: 'rubber-matte',
    name: 'Matte Rubber',
    category: 'rubber',
    description: 'Soft matte rubber texture',
    promptDescription: 'soft matte rubber texture with no reflections, tactile feel',
    previewGradient: 'linear-gradient(135deg, #2d2d2d 0%, #404040 100%)',
    icon: '🏀'
  },
  {
    id: 'rubber-glossy',
    name: 'Glossy Rubber',
    category: 'rubber',
    description: 'Shiny latex-like rubber',
    promptDescription: 'glossy shiny rubber finish like polished latex',
    previewGradient: 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 40%, #2a2a2a 60%, #5a5a5a 100%)',
    icon: '🎈'
  },

  // Matte/Glossy
  {
    id: 'matte-flat',
    name: 'Flat Matte',
    category: 'matte',
    description: 'No-shine flat finish',
    promptDescription: 'completely flat matte finish with zero shine or reflections',
    previewGradient: 'linear-gradient(135deg, #3a3a3a 0%, #4a4a4a 100%)',
    icon: '⬛'
  },
  {
    id: 'glossy-plastic',
    name: 'Glossy Plastic',
    category: 'glossy',
    description: 'Shiny plastic surface',
    promptDescription: 'shiny glossy plastic finish with bright highlights',
    previewGradient: 'linear-gradient(135deg, #333 0%, #666 30%, #444 50%, #777 80%, #555 100%)',
    icon: '✨'
  },

  // Glass
  {
    id: 'glass-clear',
    name: 'Clear Glass',
    category: 'special',
    description: 'Transparent glass effect',
    promptDescription: 'transparent clear glass with light refractions and reflections',
    previewGradient: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(200,220,255,0.5) 50%, rgba(255,255,255,0.4) 100%)',
    icon: '🔮'
  },
  {
    id: 'glass-frosted',
    name: 'Frosted Glass',
    category: 'special',
    description: 'Translucent frosted glass',
    promptDescription: 'translucent frosted glass with soft diffused appearance',
    previewGradient: 'linear-gradient(135deg, rgba(200,210,220,0.8) 0%, rgba(230,235,240,0.9) 50%, rgba(200,210,220,0.8) 100%)',
    icon: '🧊'
  },

  // Velvet
  {
    id: 'velvet-soft',
    name: 'Velvet',
    category: 'texture',
    description: 'Soft luxurious velvet',
    promptDescription: 'soft luxurious velvet texture with fabric-like appearance',
    previewGradient: 'linear-gradient(135deg, #2d1f3d 0%, #4a3660 50%, #2d1f3d 100%)',
    icon: '🎭'
  },

  // Brushed Metal
  {
    id: 'brushed-metal',
    name: 'Brushed Metal',
    category: 'metallic',
    description: 'Brushed aluminum texture',
    promptDescription: 'brushed aluminum metal with linear grain texture',
    previewGradient: 'repeating-linear-gradient(90deg, #b8b8b8 0px, #d0d0d0 2px, #a0a0a0 4px)',
    icon: '🔩'
  },

  // Neon
  {
    id: 'neon-glow',
    name: 'Neon Glow',
    category: 'special',
    description: 'Glowing neon light effect',
    promptDescription: 'bright glowing neon light effect with color bloom and glow',
    previewGradient: 'linear-gradient(135deg, #ff00ff 0%, #00ffff 50%, #ff00ff 100%)',
    icon: '💡'
  },

  // Holographic
  {
    id: 'holographic',
    name: 'Holographic',
    category: 'special',
    description: 'Rainbow iridescent effect',
    promptDescription: 'holographic iridescent rainbow shift effect',
    previewGradient: 'linear-gradient(135deg, #ff0000 0%, #ff8800 17%, #ffff00 33%, #00ff00 50%, #00ffff 67%, #0088ff 83%, #ff00ff 100%)',
    icon: '🌈'
  },

  // Textures
  {
    id: 'wood-grain',
    name: 'Wood Grain',
    category: 'texture',
    description: 'Natural wood texture',
    promptDescription: 'natural wood grain texture with realistic wood patterns',
    previewGradient: 'linear-gradient(135deg, #8b4513 0%, #a0522d 25%, #6b3e26 50%, #8b4513 75%, #a0522d 100%)',
    icon: '🪵'
  },
  {
    id: 'carbon-fiber',
    name: 'Carbon Fiber',
    category: 'texture',
    description: 'Woven carbon fiber pattern',
    promptDescription: 'woven carbon fiber texture with technical pattern',
    previewGradient: 'repeating-linear-gradient(45deg, #1a1a1a 0px, #2a2a2a 2px, #1a1a1a 4px)',
    icon: '🏎️'
  },
  {
    id: 'marble',
    name: 'Marble',
    category: 'texture',
    description: 'Elegant marble stone',
    promptDescription: 'elegant marble stone texture with veins and natural patterns',
    previewGradient: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 25%, #f8f8f8 50%, #dcdcdc 75%, #f0f0f0 100%)',
    icon: '🏛️'
  },
  {
    id: 'concrete',
    name: 'Concrete',
    category: 'texture',
    description: 'Industrial concrete',
    promptDescription: 'industrial concrete texture with rough urban feel',
    previewGradient: 'linear-gradient(135deg, #808080 0%, #909090 50%, #707070 100%)',
    icon: '🧱'
  },
  {
    id: 'leather',
    name: 'Leather',
    category: 'texture',
    description: 'Premium leather texture',
    promptDescription: 'premium leather texture with subtle grain',
    previewGradient: 'linear-gradient(135deg, #4a3728 0%, #6b4423 50%, #3d2817 100%)',
    icon: '👜'
  },
  {
    id: 'crystal',
    name: 'Crystal',
    category: 'special',
    description: 'Faceted crystal gem',
    promptDescription: 'faceted crystal gem effect with light refractions and sparkle',
    previewGradient: 'linear-gradient(135deg, #e8f4fc 0%, #a8d8ea 25%, #e0f0ff 50%, #b8e0f0 75%, #d0e8f8 100%)',
    icon: '💠'
  },
]

// ============================================
// CATEGORY CONFIG
// ============================================

export const MATERIAL_CATEGORIES = [
  { id: 'metallic' as const, label: 'Metallic', icon: '✨' },
  { id: 'rubber' as const, label: 'Rubber', icon: '🏀' },
  { id: 'matte' as const, label: 'Matte', icon: '⬛' },
  { id: 'glossy' as const, label: 'Glossy', icon: '💎' },
  { id: 'special' as const, label: 'Special', icon: '🌟' },
  { id: 'texture' as const, label: 'Texture', icon: '🧱' },
]

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getMaterialById(id: MaterialType): MaterialOption | undefined {
  return MATERIAL_OPTIONS.find(m => m.id === id)
}
