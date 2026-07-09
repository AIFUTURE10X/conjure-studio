/**
 * Logo Presets - Pre-configured templates for quick, professional logo generation
 *
 * Each preset includes:
 * - Optimized prompt template with {{BRAND_NAME}} placeholder
 * - Recommended concept and render styles
 * - Category for filtering
 * - Visual preview emoji/icon
 */

import { LogoConcept, RenderStyle } from './logo-constants'

export type PresetCategory =
  | 'real-estate'
  | 'tech'
  | 'food'
  | 'finance'
  | 'creative'
  | 'sports'
  | 'luxury'
  | 'nature'
  | 'corporate'

export interface LogoPreset {
  id: string
  name: string
  category: PresetCategory
  icon: string
  description: string
  promptTemplate: string
  negativePrompt?: string
  concept: LogoConcept
  renderStyles: RenderStyle[]
  colorScheme: string // Description of ideal colors
}

export const PRESET_CATEGORIES: Array<{
  value: PresetCategory
  label: string
  icon: string
  color: string
}> = [
  { value: 'real-estate', label: 'Real Estate', icon: '🏠', color: '#10b981' },
  { value: 'tech', label: 'Technology', icon: '💻', color: '#3b82f6' },
  { value: 'food', label: 'Food & Dining', icon: '🍽️', color: '#f97316' },
  { value: 'finance', label: 'Finance', icon: '💰', color: '#eab308' },
  { value: 'creative', label: 'Creative', icon: '🎨', color: '#ec4899' },
  { value: 'sports', label: 'Sports', icon: '⚽', color: '#ef4444' },
  { value: 'luxury', label: 'Luxury', icon: '👑', color: '#d4af37' },
  { value: 'nature', label: 'Nature', icon: '🌿', color: '#22c55e' },
  { value: 'corporate', label: 'Corporate', icon: '🏢', color: '#6366f1' },
]

export const LOGO_PRESETS: LogoPreset[] = [
  // Real Estate
  {
    id: 'real-estate-house',
    name: 'Modern House',
    category: 'real-estate',
    icon: '🏠',
    description: 'Clean house icon with modern typography',
    promptTemplate: '{{BRAND_NAME}} real estate company logo with sleek modern house icon, roofline design, property business, professional',
    negativePrompt: 'text only, no icon, cartoon, childish',
    concept: 'modern',
    renderStyles: ['3d-metallic'],
    colorScheme: 'Gold, navy blue, or slate gray'
  },
  {
    id: 'real-estate-key',
    name: 'Luxury Key',
    category: 'real-estate',
    icon: '🔑',
    description: 'Elegant key design for premium properties',
    promptTemplate: '{{BRAND_NAME}} luxury real estate logo with ornate golden key icon, premium property agency, elegant serif typography',
    negativePrompt: 'cheap, basic, cartoon',
    concept: 'elegant',
    renderStyles: ['3d-metallic'],
    colorScheme: 'Gold and black'
  },

  // Technology
  {
    id: 'tech-circuit',
    name: 'Tech Circuit',
    category: 'tech',
    icon: '⚡',
    description: 'Futuristic circuit/tech aesthetic',
    promptTemplate: '{{BRAND_NAME}} technology company logo with circuit board pattern, digital innovation, modern tech startup, silicon valley aesthetic',
    negativePrompt: 'organic, nature, vintage, old',
    concept: 'modern',
    renderStyles: ['neon', '3d-gradient'],
    colorScheme: 'Electric blue, cyan, purple'
  },
  {
    id: 'tech-ai',
    name: 'AI Brain',
    category: 'tech',
    icon: '🧠',
    description: 'Neural network / AI themed',
    promptTemplate: '{{BRAND_NAME}} artificial intelligence company logo with neural network brain icon, machine learning, deep tech, futuristic',
    negativePrompt: 'cartoon, childish, simple',
    concept: 'modern',
    renderStyles: ['3d-gradient', 'neon'],
    colorScheme: 'Purple, cyan gradient'
  },
  {
    id: 'tech-cube',
    name: 'Tech Cube',
    category: 'tech',
    icon: '🔲',
    description: '3D geometric cube design',
    promptTemplate: '{{BRAND_NAME}} tech startup logo with 3D isometric cube, geometric shapes, blockchain/data company aesthetic',
    negativePrompt: 'flat, 2d, organic shapes',
    concept: 'modern',
    renderStyles: ['3d-crystal', '3d-gradient'],
    colorScheme: 'Blue, purple, teal'
  },

  // Food & Dining
  {
    id: 'food-restaurant',
    name: 'Fine Dining',
    category: 'food',
    icon: '🍽️',
    description: 'Elegant restaurant branding',
    promptTemplate: '{{BRAND_NAME}} upscale restaurant logo with elegant fork and knife icon, fine dining, culinary excellence, gourmet',
    negativePrompt: 'fast food, cheap, cartoon',
    concept: 'elegant',
    renderStyles: ['3d-metallic'],
    colorScheme: 'Gold, burgundy, black'
  },
  {
    id: 'food-coffee',
    name: 'Coffee Shop',
    category: 'food',
    icon: '☕',
    description: 'Cozy coffee house aesthetic',
    promptTemplate: '{{BRAND_NAME}} artisan coffee shop logo with steaming coffee cup icon, cafe, barista, warm and inviting',
    negativePrompt: 'corporate, cold, tech',
    concept: 'vintage',
    renderStyles: ['3d', 'flat'],
    colorScheme: 'Brown, cream, warm tones'
  },

  // Finance
  {
    id: 'finance-growth',
    name: 'Growth Chart',
    category: 'finance',
    icon: '📈',
    description: 'Investment and growth themed',
    promptTemplate: '{{BRAND_NAME}} investment firm logo with upward growth arrow chart, financial success, wealth management, professional',
    negativePrompt: 'down arrow, loss, decline, cartoon',
    concept: 'modern',
    renderStyles: ['3d-metallic', '3d-gradient'],
    colorScheme: 'Green, gold, navy'
  },
  {
    id: 'finance-shield',
    name: 'Secure Shield',
    category: 'finance',
    icon: '🛡️',
    description: 'Trust and security focused',
    promptTemplate: '{{BRAND_NAME}} financial security company logo with shield icon, trust, protection, banking, institutional',
    negativePrompt: 'broken, weak, cartoon',
    concept: 'bold',
    renderStyles: ['3d-metallic'],
    colorScheme: 'Navy blue, gold, silver'
  },

  // Creative
  {
    id: 'creative-studio',
    name: 'Design Studio',
    category: 'creative',
    icon: '🎨',
    description: 'Creative agency branding',
    promptTemplate: '{{BRAND_NAME}} creative design studio logo with abstract artistic brush stroke, innovation, creative agency',
    negativePrompt: 'corporate, boring, generic',
    concept: 'playful',
    renderStyles: ['3d-gradient', 'neon'],
    colorScheme: 'Vibrant rainbow or signature colors'
  },
  {
    id: 'creative-camera',
    name: 'Photography',
    category: 'creative',
    icon: '📷',
    description: 'Photography studio aesthetic',
    promptTemplate: '{{BRAND_NAME}} professional photography studio logo with camera lens aperture icon, visual arts, creative',
    negativePrompt: 'amateur, cheap, clip art',
    concept: 'modern',
    renderStyles: ['3d-metallic', '3d-crystal'],
    colorScheme: 'Black, silver, accent color'
  },

  // Sports
  {
    id: 'sports-fitness',
    name: 'Fitness Club',
    category: 'sports',
    icon: '💪',
    description: 'Gym and fitness branding',
    promptTemplate: '{{BRAND_NAME}} fitness gym logo with powerful athletic icon, strength training, sports club, dynamic energy',
    negativePrompt: 'weak, sedentary, lazy',
    concept: 'bold',
    renderStyles: ['3d-metallic', '3d'],
    colorScheme: 'Red, black, orange'
  },

  // Luxury
  {
    id: 'luxury-crown',
    name: 'Royal Crown',
    category: 'luxury',
    icon: '👑',
    description: 'Premium luxury branding',
    promptTemplate: '{{BRAND_NAME}} luxury premium brand logo with elegant crown icon, royal, exclusive, high-end fashion or jewelry',
    negativePrompt: 'cheap, basic, mass market',
    concept: 'elegant',
    renderStyles: ['3d-metallic', '3d-crystal'],
    colorScheme: 'Gold, black, deep purple'
  },
  {
    id: 'luxury-diamond',
    name: 'Diamond',
    category: 'luxury',
    icon: '💎',
    description: 'Precious gem aesthetic',
    promptTemplate: '{{BRAND_NAME}} luxury jewelry brand logo with brilliant cut diamond icon, precious, exclusive, high fashion',
    negativePrompt: 'fake, cheap, plastic',
    concept: 'elegant',
    renderStyles: ['3d-crystal', '3d-metallic'],
    colorScheme: 'Crystal clear, platinum, blue'
  },

  // Nature
  {
    id: 'nature-leaf',
    name: 'Eco Leaf',
    category: 'nature',
    icon: '🌿',
    description: 'Eco-friendly organic branding',
    promptTemplate: '{{BRAND_NAME}} eco-friendly sustainable brand logo with elegant leaf icon, organic, natural, green business',
    negativePrompt: 'industrial, polluted, toxic',
    concept: 'modern',
    renderStyles: ['3d-gradient', '3d'],
    colorScheme: 'Green, teal, earth tones'
  },

  // Corporate
  {
    id: 'corporate-dotmatrix',
    name: 'Dot Matrix 3D',
    category: 'corporate',
    icon: '⚫',
    description: 'Halftone dots with metallic swoosh',
    promptTemplate: '{{BRAND_NAME}} corporate logo with 3D letters filled with DOT MATRIX halftone pattern texture, metallic chrome and purple gradient, circular swoosh arc element wrapping around letters, dramatic studio lighting, dark gradient background, professional recruitment or consulting company style',
    negativePrompt: 'solid fill, flat colors, no texture, simple, cartoon, 2D',
    concept: 'modern',
    renderStyles: ['3d-metallic'],
    colorScheme: 'Chrome, purple, dark blue'
  },
  {
    id: 'corporate-swoosh',
    name: 'Chrome Swoosh',
    category: 'corporate',
    icon: '🌀',
    description: 'Dynamic arc with metallic text',
    promptTemplate: '{{BRAND_NAME}} corporate logo with elegant 3D chrome metallic letters, dynamic swoosh arc element circling the design, sparkle accent, premium business branding, dark professional background',
    negativePrompt: 'flat, 2D, cartoon, cheap',
    concept: 'modern',
    renderStyles: ['3d-metallic', '3d-crystal'],
    colorScheme: 'Silver, purple, blue'
  },
  {
    id: 'corporate-globe',
    name: 'Global Network',
    category: 'corporate',
    icon: '🌐',
    description: 'International business aesthetic',
    promptTemplate: '{{BRAND_NAME}} global corporation logo with 3D globe or network icon, connected dots and lines, international business, worldwide reach, professional',
    negativePrompt: 'local, small, cartoon',
    concept: 'modern',
    renderStyles: ['3d-metallic', '3d-gradient'],
    colorScheme: 'Blue, silver, teal'
  },
]

/**
 * Get presets filtered by category
 */
export function getPresetsByCategory(category: PresetCategory): LogoPreset[] {
  return LOGO_PRESETS.filter(preset => preset.category === category)
}

/**
 * Apply brand name to a preset's prompt template
 */
export function applyPresetTemplate(preset: LogoPreset, brandName: string): string {
  return preset.promptTemplate.replace('{{BRAND_NAME}}', brandName.trim())
}
