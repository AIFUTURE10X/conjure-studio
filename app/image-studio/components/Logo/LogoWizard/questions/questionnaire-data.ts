/**
 * Questionnaire Data for Logo Wizard
 *
 * Contains all wizard question definitions.
 * NOTE: This file exceeds 300 lines as it's pure configuration data.
 *
 * @see questionnaire-types.ts - Type definitions
 * @see questionnaire-helpers.ts - Helper functions
 */

import { WizardQuestion } from './questionnaire-types'

// Re-export types and helpers for backward compatibility
export * from './questionnaire-types'
export * from './questionnaire-helpers'

// ============================================
// WIZARD MODES
// ============================================

export type WizardMode = 'quick' | 'advanced'

// Quick Mode shows only essential questions (6 questions, ~2 min)
export const QUICK_MODE_QUESTIONS = [
  'brandName',
  'logoType',
  'industry',
  'style',
  'imageColorPicker', // Simplified color selection
  'outputSettings',
]

// Smart defaults applied in Quick Mode when questions are skipped
export const QUICK_MODE_DEFAULTS: Record<string, any> = {
  imageColorScheme: 'tricolor',
  depth: 'medium',
  textPlacement: 'center',
  logoTilt: 'no-tilt',
  textColorChoice: 'match-image',
}

// Style to Font Category mapping for Quick Mode auto-selection
export const STYLE_TO_FONT_CATEGORY: Record<string, string> = {
  modern: 'modern-clean',
  elegant: 'elegant-serif',
  bold: 'bold-display',
  playful: 'script-handwritten',
  organic: 'script-handwritten',
  vintage: 'retro-decorative',
  futuristic: 'tech-futuristic',
  handcrafted: 'script-handwritten',
}

// ============================================
// FONT CATEGORIES (for Quick Mode)
// ============================================

export interface FontCategory {
  id: string
  label: string
  emoji: string
  description: string
  fonts: string[] // Font IDs from the full font list
  defaultFont: string
}

export const FONT_CATEGORIES: FontCategory[] = [
  {
    id: 'elegant-serif',
    label: 'Elegant & Luxury',
    emoji: '👑',
    description: 'Sophisticated, high-end feel',
    fonts: ['didot', 'bodoni', 'playfair', 'cinzel'],
    defaultFont: 'playfair',
  },
  {
    id: 'modern-clean',
    label: 'Modern & Clean',
    emoji: '✨',
    description: 'Minimalist, contemporary',
    fonts: ['montserrat', 'futura', 'raleway'],
    defaultFont: 'montserrat',
  },
  {
    id: 'tech-futuristic',
    label: 'Tech & Futuristic',
    emoji: '🚀',
    description: 'Cutting-edge, innovative',
    fonts: ['orbitron', 'audiowide', 'exo-2'],
    defaultFont: 'orbitron',
  },
  {
    id: 'script-handwritten',
    label: 'Script & Handwritten',
    emoji: '✍️',
    description: 'Personal, artistic touch',
    fonts: ['great-vibes', 'dancing-script', 'allura', 'caveat'],
    defaultFont: 'great-vibes',
  },
  {
    id: 'bold-display',
    label: 'Bold & Impactful',
    emoji: '💪',
    description: 'Strong, attention-grabbing',
    fonts: ['bebas-neue', 'anton', 'black-ops-one'],
    defaultFont: 'bebas-neue',
  },
  {
    id: 'retro-decorative',
    label: 'Retro & Decorative',
    emoji: '🎭',
    description: 'Vintage, nostalgic vibes',
    fonts: ['righteous', 'lobster', 'poiret-one', 'monoton'],
    defaultFont: 'righteous',
  },
]

// Get font category by ID
export function getFontCategory(categoryId: string): FontCategory | undefined {
  return FONT_CATEGORIES.find(cat => cat.id === categoryId)
}

// Get default font for a style
export function getDefaultFontForStyle(styleId: string): string {
  const categoryId = STYLE_TO_FONT_CATEGORY[styleId]
  if (!categoryId) return 'montserrat' // Default fallback
  const category = getFontCategory(categoryId)
  return category?.defaultFont || 'montserrat'
}

// ============================================
// QUESTIONS DEFINITION
// ============================================

export const WIZARD_QUESTIONS: WizardQuestion[] = [
  {
    id: 'logoType',
    title: 'What type of logo do you want?',
    subtitle: 'Choose the composition of your logo',
    type: 'single',
    required: true,
    options: [
      {
        id: 'text-only',
        label: 'Text Only',
        emoji: '🔤',
        description: 'Just your brand name, stylized typography',
        configValues: { logoType: 'text-only', hasIcon: false },
      },
      {
        id: 'icon-text',
        label: 'Icon + Text',
        emoji: '🎨',
        description: 'Symbol/icon combined with brand name',
        configValues: { logoType: 'icon-text', hasIcon: true },
      },
      {
        id: 'icon-only',
        label: 'Icon Only',
        emoji: '⭐',
        description: 'Just a symbol or icon, no text',
        configValues: { logoType: 'icon-only', hasIcon: true, textOnly: false },
      },
      {
        id: 'monogram',
        label: 'Monogram',
        emoji: '🅰️',
        description: 'Initials or letter-based design',
        configValues: { logoType: 'monogram', hasIcon: false, isMonogram: true },
      },
    ],
  },
  {
    id: 'industry',
    title: 'What industry is your logo for?',
    subtitle: 'Select the category that best fits your business',
    type: 'single',
    required: true,
    options: [
      {
        id: 'tech',
        label: 'Technology',
        emoji: '💻',
        description: 'Software, apps, startups, AI',
        presetScores: {
          'tech-circuit': 10,
          'tech-ai': 10,
          'tech-cube': 8,
          'corporate-swoosh': 5,
          'corporate-dots': 5,
        },
      },
      {
        id: 'finance',
        label: 'Finance',
        emoji: '💰',
        description: 'Banking, investment, insurance',
        presetScores: {
          'finance-growth': 10,
          'finance-shield': 10,
          'corporate-swoosh': 6,
          'luxury-crown': 5,
        },
      },
      {
        id: 'food',
        label: 'Food & Dining',
        emoji: '🍽️',
        description: 'Restaurants, cafes, food brands',
        presetScores: {
          'food-restaurant': 10,
          'food-coffee': 10,
          'nature-leaf': 5,
        },
      },
      {
        id: 'realestate',
        label: 'Real Estate',
        emoji: '🏠',
        description: 'Property, housing, construction',
        presetScores: {
          'real-estate-house': 10,
          'real-estate-key': 10,
          'finance-growth': 4,
        },
      },
      {
        id: 'creative',
        label: 'Creative',
        emoji: '🎨',
        description: 'Design, photography, media',
        presetScores: {
          'creative-studio': 10,
          'creative-camera': 10,
          'corporate-dots': 4,
        },
      },
      {
        id: 'luxury',
        label: 'Luxury',
        emoji: '👑',
        description: 'Premium brands, jewelry, fashion',
        presetScores: {
          'luxury-crown': 10,
          'luxury-diamond': 10,
          'creative-studio': 4,
        },
      },
      {
        id: 'nature',
        label: 'Nature & Eco',
        emoji: '🌿',
        description: 'Environmental, organic, wellness',
        presetScores: {
          'nature-leaf': 10,
          'food-coffee': 4,
        },
      },
      {
        id: 'sports',
        label: 'Sports & Fitness',
        emoji: '💪',
        description: 'Gyms, teams, athletic brands',
        presetScores: {
          'sports-fitness': 10,
          'corporate-swoosh': 5,
        },
      },
    ],
  },
  {
    id: 'style',
    title: 'What style resonates with your brand?',
    subtitle: 'Choose the overall aesthetic you want',
    type: 'single',
    required: true,
    options: [
      {
        id: 'modern',
        label: 'Modern & Clean',
        emoji: '✨',
        description: 'Minimalist, contemporary design',
        presetScores: {
          'tech-cube': 8,
          'corporate-dots': 8,
          'creative-studio': 6,
          'finance-growth': 6,
        },
        configValues: {
          fontStyle: 'modern-geometric',
        },
      },
      {
        id: 'elegant',
        label: 'Elegant & Premium',
        emoji: '💎',
        description: 'Sophisticated, luxurious feel',
        presetScores: {
          'luxury-crown': 10,
          'luxury-diamond': 10,
          'finance-shield': 6,
        },
        configValues: {
          fontStyle: 'serif-elegant',
          metallicFinish: 'gold',
        },
      },
      {
        id: 'bold',
        label: 'Bold & Powerful',
        emoji: '⚡',
        description: 'Strong, impactful presence',
        presetScores: {
          'sports-fitness': 10,
          'corporate-swoosh': 8,
          'tech-circuit': 6,
        },
        configValues: {
          textWeight: 'extra-bold',
        },
      },
      {
        id: 'playful',
        label: 'Playful & Creative',
        emoji: '🎨',
        description: 'Fun, approachable, artistic',
        presetScores: {
          'creative-studio': 10,
          'creative-camera': 8,
          'food-coffee': 6,
        },
        configValues: {
          colorVibrancy: 'vibrant',
        },
      },
      {
        id: 'organic',
        label: 'Natural & Organic',
        emoji: '🌱',
        description: 'Eco-friendly, earthy tones',
        presetScores: {
          'nature-leaf': 10,
          'food-restaurant': 6,
        },
        configValues: {
          ecoColorPalette: 'forest',
        },
      },
      {
        id: 'vintage',
        label: 'Vintage & Retro',
        emoji: '📺',
        description: 'Classic, nostalgic, timeless',
        presetScores: {
          'creative-studio': 8,
          'food-coffee': 8,
          'food-restaurant': 6,
        },
        configValues: {
          fontStyle: 'retro',
          colorVibrancy: 'muted',
        },
      },
      {
        id: 'futuristic',
        label: 'Futuristic & Tech',
        emoji: '🚀',
        description: 'Cutting-edge, innovative, sci-fi',
        presetScores: {
          'tech-circuit': 10,
          'tech-ai': 10,
          'tech-cube': 8,
        },
        configValues: {
          fontStyle: 'tech',
          glowEnabled: true,
        },
      },
      {
        id: 'handcrafted',
        label: 'Handcrafted & Artisan',
        emoji: '✋',
        description: 'Hand-drawn, authentic, personal',
        presetScores: {
          'creative-studio': 10,
          'food-coffee': 8,
          'nature-leaf': 6,
        },
        configValues: {
          fontStyle: 'script',
          textureStyle: 'textured',
        },
      },
    ],
  },
  {
    id: 'fontStyle',
    title: 'Choose your typography style',
    subtitle: 'Select a font style that matches your brand personality',
    type: 'single',
    required: true,
    options: [
      // LUXURY & ELEGANT
      {
        id: 'didot',
        label: 'Didot',
        emoji: '👑',
        description: 'High-fashion luxury serif',
        googleFont: 'Cormorant Garamond',
        configValues: { fontStyle: 'didot', fontPrompt: 'elegant Didot high-contrast luxury serif typography with thin serifs' },
      },
      {
        id: 'bodoni',
        label: 'Bodoni',
        emoji: '💎',
        description: 'Dramatic thick-thin contrast',
        googleFont: 'Bodoni Moda',
        configValues: { fontStyle: 'bodoni', fontPrompt: 'sophisticated Bodoni serif typography with dramatic thick-thin contrast' },
      },
      {
        id: 'playfair',
        label: 'Playfair Display',
        emoji: '✨',
        description: 'Sophisticated transitional',
        googleFont: 'Playfair Display',
        configValues: { fontStyle: 'playfair', fontPrompt: 'refined Playfair Display elegant serif with subtle curves' },
      },
      {
        id: 'cinzel',
        label: 'Cinzel',
        emoji: '🏛️',
        description: 'Ancient Roman capitals',
        googleFont: 'Cinzel',
        configValues: { fontStyle: 'cinzel', fontPrompt: 'majestic Cinzel Roman-inspired capital letters with elegant serifs' },
      },
      // SCRIPT & CALLIGRAPHY
      {
        id: 'great-vibes',
        label: 'Great Vibes',
        emoji: '✍️',
        description: 'Flowing elegant script',
        googleFont: 'Great Vibes',
        configValues: { fontStyle: 'great-vibes', fontPrompt: 'flowing Great Vibes elegant cursive script with dramatic flourishes' },
      },
      {
        id: 'dancing-script',
        label: 'Dancing Script',
        emoji: '💃',
        description: 'Lively bouncy cursive',
        googleFont: 'Dancing Script',
        configValues: { fontStyle: 'dancing-script', fontPrompt: 'lively Dancing Script bouncy cursive with playful baseline' },
      },
      {
        id: 'allura',
        label: 'Allura',
        emoji: '💒',
        description: 'Wedding-style formal',
        googleFont: 'Allura',
        configValues: { fontStyle: 'allura', fontPrompt: 'formal Allura wedding invitation calligraphy script' },
      },
      // MODERN & CLEAN
      {
        id: 'montserrat',
        label: 'Montserrat',
        emoji: '◼️',
        description: 'Clean geometric sans',
        googleFont: 'Montserrat',
        configValues: { fontStyle: 'montserrat', fontPrompt: 'clean Montserrat geometric sans-serif with urban modern feel' },
      },
      {
        id: 'futura',
        label: 'Futura',
        emoji: '🔷',
        description: 'Classic Bauhaus geometric',
        googleFont: 'Questrial',
        configValues: { fontStyle: 'futura', fontPrompt: 'classic Futura Bauhaus geometric sans-serif with perfect shapes' },
      },
      {
        id: 'raleway',
        label: 'Raleway',
        emoji: '〰️',
        description: 'Elegant thin modern',
        googleFont: 'Raleway',
        configValues: { fontStyle: 'raleway', fontPrompt: 'elegant Raleway thin weight modern sans-serif' },
      },
      // TECH & FUTURISTIC
      {
        id: 'orbitron',
        label: 'Orbitron',
        emoji: '🚀',
        description: 'Sci-fi geometric',
        googleFont: 'Orbitron',
        configValues: { fontStyle: 'orbitron', fontPrompt: 'futuristic Orbitron sci-fi geometric display with sharp edges' },
      },
      {
        id: 'audiowide',
        label: 'Audiowide',
        emoji: '🏎️',
        description: 'Wide tech racing',
        googleFont: 'Audiowide',
        configValues: { fontStyle: 'audiowide', fontPrompt: 'wide Audiowide tech racing typography with speed lines feel' },
      },
      {
        id: 'exo-2',
        label: 'Exo 2',
        emoji: '⚡',
        description: 'Modern technological',
        googleFont: 'Exo 2',
        configValues: { fontStyle: 'exo-2', fontPrompt: 'modern Exo 2 technological geometric sans-serif' },
      },
      // RETRO & DISPLAY
      {
        id: 'bebas-neue',
        label: 'Bebas Neue',
        emoji: '📰',
        description: 'Tall condensed impact',
        googleFont: 'Bebas Neue',
        configValues: { fontStyle: 'bebas-neue', fontPrompt: 'tall Bebas Neue condensed all-caps headline typography' },
      },
      {
        id: 'righteous',
        label: 'Righteous',
        emoji: '🪩',
        description: '70s groovy rounded',
        googleFont: 'Righteous',
        configValues: { fontStyle: 'righteous', fontPrompt: 'groovy Righteous 1970s rounded retro display typography' },
      },
      {
        id: 'lobster',
        label: 'Lobster',
        emoji: '🎨',
        description: 'Bold connected script',
        googleFont: 'Lobster',
        configValues: { fontStyle: 'lobster', fontPrompt: 'bold Lobster connected script display with retro charm' },
      },
      // ART DECO
      {
        id: 'poiret-one',
        label: 'Poiret One',
        emoji: '🎭',
        description: '1920s art deco thin',
        googleFont: 'Poiret One',
        configValues: { fontStyle: 'poiret-one', fontPrompt: 'thin Poiret One 1920s art deco geometric display' },
      },
      {
        id: 'josefin-sans',
        label: 'Josefin Sans',
        emoji: '🥂',
        description: 'Elegant 1920s geometric',
        googleFont: 'Josefin Sans',
        configValues: { fontStyle: 'josefin-sans', fontPrompt: 'elegant Josefin Sans vintage 1920s geometric sans-serif' },
      },
      // BOLD & IMPACT
      {
        id: 'anton',
        label: 'Anton',
        emoji: '💪',
        description: 'Ultra condensed impact',
        googleFont: 'Anton',
        configValues: { fontStyle: 'anton', fontPrompt: 'ultra Anton condensed impact headline typography' },
      },
      {
        id: 'black-ops-one',
        label: 'Black Ops One',
        emoji: '🎖️',
        description: 'Military stencil',
        googleFont: 'Black Ops One',
        configValues: { fontStyle: 'black-ops-one', fontPrompt: 'military Black Ops One stencil display typography' },
      },
      // DECORATIVE
      {
        id: 'abril-fatface',
        label: 'Abril Fatface',
        emoji: '📚',
        description: 'Bold vintage display',
        googleFont: 'Abril Fatface',
        configValues: { fontStyle: 'abril-fatface', fontPrompt: 'elegant Abril Fatface high-contrast decorative display serif' },
      },
      {
        id: 'monoton',
        label: 'Monoton',
        emoji: '🔮',
        description: 'Neon outline style',
        googleFont: 'Monoton',
        configValues: { fontStyle: 'monoton', fontPrompt: 'retro Monoton inline neon-style decorative typography' },
      },
      {
        id: 'press-start-2p',
        label: 'Press Start 2P',
        emoji: '🎮',
        description: 'Pixel retro gaming',
        googleFont: 'Press Start 2P',
        configValues: { fontStyle: 'press-start-2p', fontPrompt: 'pixelated Press Start 2P retro video game typography' },
      },
      // HANDWRITTEN
      {
        id: 'caveat',
        label: 'Caveat',
        emoji: '📝',
        description: 'Casual handwriting',
        googleFont: 'Caveat',
        configValues: { fontStyle: 'caveat', fontPrompt: 'casual Caveat natural handwriting typography' },
      },
      {
        id: 'indie-flower',
        label: 'Indie Flower',
        emoji: '🌸',
        description: 'Playful whimsical',
        googleFont: 'Indie Flower',
        configValues: { fontStyle: 'indie-flower', fontPrompt: 'playful Indie Flower whimsical handwriting style' },
      },
      {
        id: 'permanent-marker',
        label: 'Permanent Marker',
        emoji: '🖊️',
        description: 'Hand-drawn marker',
        googleFont: 'Permanent Marker',
        configValues: { fontStyle: 'permanent-marker', fontPrompt: 'hand-drawn Permanent Marker casual handwriting style' },
      },
      // GOTHIC
      {
        id: 'cinzel-decorative',
        label: 'Cinzel Decorative',
        emoji: '⚔️',
        description: 'Ornate ancient display',
        googleFont: 'Cinzel Decorative',
        configValues: { fontStyle: 'cinzel-decorative', fontPrompt: 'ornate Cinzel Decorative ancient Roman capitals with flourishes' },
      },
      {
        id: 'unifraktur',
        label: 'Fraktur',
        emoji: '🏰',
        description: 'Traditional blackletter',
        googleFont: 'UnifrakturMaguntia',
        configValues: { fontStyle: 'unifraktur', fontPrompt: 'traditional Fraktur blackletter gothic calligraphy' },
      },
    ],
  },
  // ============================================
  // IMAGE COLOR QUESTIONS
  // ============================================
  {
    id: 'imageColorScheme',
    title: 'Choose your logo image color style',
    subtitle: 'How many colors for your logo graphic?',
    type: 'single',
    required: true,
    options: [
      {
        id: 'monochrome',
        label: 'Single Color',
        emoji: '⬛',
        description: 'Clean, minimal look',
        configValues: { imageColorScheme: 'monochrome' },
      },
      {
        id: 'duotone',
        label: 'Two Colors',
        emoji: '🎭',
        description: 'Primary + accent',
        configValues: { imageColorScheme: 'duotone' },
      },
      {
        id: 'tricolor',
        label: 'Three Colors',
        emoji: '🔺',
        description: 'Rich color palette',
        configValues: { imageColorScheme: 'tricolor' },
      },
      {
        id: 'multicolor',
        label: 'Multicolor',
        emoji: '🌈',
        description: 'Vibrant, AI picks colors',
        configValues: { imageColorScheme: 'multicolor' },
      },
      {
        id: 'gradient',
        label: 'Gradient',
        emoji: '🎨',
        description: 'Smooth transitions',
        configValues: { imageColorScheme: 'gradient' },
      },
    ],
  },
  {
    id: 'imageColorPicker',
    title: 'Select your image colors',
    subtitle: 'Pick colors for your logo graphic',
    type: 'multi',
    maxSelections: 4,
    required: false,
    skipIf: (answers) => answers.imageColorScheme === 'multicolor',
    options: [
      { id: 'blue', label: 'Blue', emoji: '🔵', description: 'Trust, professional', configValues: { imageColor: 'blue' } },
      { id: 'purple', label: 'Purple', emoji: '🟣', description: 'Creative, luxury', configValues: { imageColor: 'purple' } },
      { id: 'gold', label: 'Gold', emoji: '🟡', description: 'Premium, success', configValues: { imageColor: 'gold' } },
      { id: 'green', label: 'Green', emoji: '🟢', description: 'Growth, nature', configValues: { imageColor: 'green' } },
      { id: 'red', label: 'Red', emoji: '🔴', description: 'Energy, passion', configValues: { imageColor: 'red' } },
      { id: 'black', label: 'Black', emoji: '⬛', description: 'Elegance, power', configValues: { imageColor: 'black' } },
      { id: 'cyan', label: 'Cyan', emoji: '🩵', description: 'Tech, innovation', configValues: { imageColor: 'cyan' } },
      { id: 'pink', label: 'Pink', emoji: '🩷', description: 'Modern, creative', configValues: { imageColor: 'pink' } },
      { id: 'orange', label: 'Orange', emoji: '🟠', description: 'Energetic, warm', configValues: { imageColor: 'orange' } },
      { id: 'teal', label: 'Teal', emoji: '🩵', description: 'Calm, professional', configValues: { imageColor: 'teal' } },
      { id: 'silver', label: 'Silver', emoji: '⚪', description: 'Sleek, modern', configValues: { imageColor: 'silver' } },
      { id: 'bronze', label: 'Bronze', emoji: '🥉', description: 'Warm, traditional', configValues: { imageColor: 'bronze' } },
      { id: 'navy', label: 'Navy', emoji: '🔵', description: 'Corporate, trust', configValues: { imageColor: 'navy' } },
      { id: 'white', label: 'White', emoji: '⬜', description: 'Clean, minimal', configValues: { imageColor: 'white' } },
    ],
  },
  // ============================================
  // TEXT COLOR QUESTIONS
  // ============================================
  {
    id: 'textColorChoice',
    title: 'Choose your text color',
    subtitle: 'Select the color for your brand name',
    type: 'single',
    required: true,
    options: [
      { id: 'match-image', label: 'Match Image', emoji: '🔗', description: 'Same as logo colors', configValues: { textColorChoice: 'match-image' } },
      { id: 'white', label: 'White', emoji: '⬜', description: 'Clean on dark backgrounds', configValues: { textColorChoice: 'white' } },
      { id: 'black', label: 'Black', emoji: '⬛', description: 'Classic, readable', configValues: { textColorChoice: 'black' } },
      { id: 'gold', label: 'Gold', emoji: '🟡', description: 'Premium, luxurious', configValues: { textColorChoice: 'gold' } },
      { id: 'silver', label: 'Silver', emoji: '⚪', description: 'Modern, sleek', configValues: { textColorChoice: 'silver' } },
      { id: 'custom', label: 'Custom Color', emoji: '🎨', description: 'Pick from palette', configValues: { textColorChoice: 'custom' } },
    ],
  },
  {
    id: 'textColorPicker',
    title: 'Pick your text color',
    subtitle: 'Choose a specific color for your brand name',
    type: 'single',
    required: false,
    skipIf: (answers) => answers.textColorChoice !== 'custom',
    options: [
      { id: 'blue', label: 'Blue', emoji: '🔵', description: 'Trust, professional', configValues: { customTextColor: 'blue' } },
      { id: 'purple', label: 'Purple', emoji: '🟣', description: 'Creative, luxury', configValues: { customTextColor: 'purple' } },
      { id: 'gold', label: 'Gold', emoji: '🟡', description: 'Premium, success', configValues: { customTextColor: 'gold' } },
      { id: 'green', label: 'Green', emoji: '🟢', description: 'Growth, nature', configValues: { customTextColor: 'green' } },
      { id: 'red', label: 'Red', emoji: '🔴', description: 'Energy, passion', configValues: { customTextColor: 'red' } },
      { id: 'cyan', label: 'Cyan', emoji: '🩵', description: 'Tech, innovation', configValues: { customTextColor: 'cyan' } },
      { id: 'pink', label: 'Pink', emoji: '🩷', description: 'Modern, creative', configValues: { customTextColor: 'pink' } },
      { id: 'orange', label: 'Orange', emoji: '🟠', description: 'Energetic, warm', configValues: { customTextColor: 'orange' } },
      { id: 'teal', label: 'Teal', emoji: '🩵', description: 'Calm, professional', configValues: { customTextColor: 'teal' } },
      { id: 'bronze', label: 'Bronze', emoji: '🥉', description: 'Warm, traditional', configValues: { customTextColor: 'bronze' } },
      { id: 'navy', label: 'Navy', emoji: '🔵', description: 'Corporate, trust', configValues: { customTextColor: 'navy' } },
      { id: 'coral', label: 'Coral', emoji: '🪸', description: 'Vibrant, friendly', configValues: { customTextColor: 'coral' } },
    ],
  },
  {
    id: 'depth',
    title: 'How much 3D depth do you want?',
    subtitle: 'Choose the dimensionality of your logo',
    type: 'single',
    required: true,
    options: [
      {
        id: 'flat',
        label: 'Flat 2D (0%)',
        emoji: '📄',
        description: 'Clean, simple, no depth',
        configValues: { depthLevel: 'flat' },
      },
      {
        id: 'subtle',
        label: 'Subtle (35%)',
        emoji: '📊',
        description: 'Slight depth, shadows',
        configValues: { depthLevel: 'subtle' },
      },
      {
        id: 'medium',
        label: 'Medium (65%)',
        emoji: '📦',
        description: 'Noticeable extrusion',
        configValues: { depthLevel: 'medium' },
      },
      {
        id: 'dramatic',
        label: 'Dramatic (100%)',
        emoji: '🎲',
        description: 'Bold, eye-catching depth',
        configValues: { depthLevel: 'deep' },
      },
    ],
  },
  {
    id: 'depthStyle',
    title: 'What type of 3D effect?',
    subtitle: 'Choose how your logo appears in 3D space',
    type: 'single',
    required: false,
    skipIf: (answers) => answers.depth === 'flat',
    options: [
      {
        id: 'extruded',
        label: 'Extruded',
        emoji: '📦',
        description: 'Depth going back like a 3D block',
        configValues: { depthStyle: 'extruded', depthStylePrompt: '3D extruded depth going backwards with solid sides' },
      },
      {
        id: 'embossed',
        label: 'Embossed',
        emoji: '🔘',
        description: 'Raised relief popping forward',
        configValues: { depthStyle: 'embossed', depthStylePrompt: 'embossed raised relief effect popping forward from the surface' },
      },
      {
        id: 'floating',
        label: 'Floating',
        emoji: '🎈',
        description: 'Hovering above with shadow',
        configValues: { depthStyle: 'floating', depthStylePrompt: 'floating levitating above the background with soft drop shadow underneath' },
      },
      {
        id: 'debossed',
        label: 'Debossed',
        emoji: '⬇️',
        description: 'Pressed into the surface',
        configValues: { depthStyle: 'debossed', depthStylePrompt: 'debossed pressed into the surface with inset shadows' },
      },
    ],
  },
  {
    id: 'logoImagePrompt',
    title: 'Describe your logo image',
    subtitle: 'Describe your logo image that you want in detail. This adds this to your logo.',
    type: 'text',
    placeholder: 'e.g., A fierce lion head facing right, geometric style with sharp angles...',
    required: false,
    hasAIEnhance: true,
  },
  {
    id: 'icon',
    title: 'Would you like an icon or symbol?',
    subtitle: 'Optional decorative element for your logo',
    type: 'single',
    required: false,
    skipIf: (answers) => Boolean(answers.logoImagePrompt && String(answers.logoImagePrompt).trim().length > 0),
    options: [
      {
        id: 'none',
        label: 'Text Only',
        emoji: '🔤',
        description: 'Just the brand name',
        configValues: { selectedIcon: null },
      },
      {
        id: 'abstract',
        label: 'Abstract Shape',
        emoji: '🔷',
        description: 'Geometric, modern symbol',
        configValues: { iconCategory: 'abstract' },
      },
      {
        id: 'industry',
        label: 'Industry Icon',
        emoji: '🏢',
        description: 'Relevant to your field',
        configValues: { iconCategory: 'business' },
      },
      {
        id: 'nature',
        label: 'Nature Element',
        emoji: '🌿',
        description: 'Leaf, tree, organic shape',
        configValues: { iconCategory: 'nature' },
      },
      {
        id: 'tech',
        label: 'Tech Symbol',
        emoji: '⚙️',
        description: 'Circuit, code, digital',
        configValues: { iconCategory: 'tech' },
      },
      {
        id: 'health',
        label: 'Health Symbol',
        emoji: '🏥',
        description: 'Medical, wellness, care',
        configValues: { iconCategory: 'health' },
      },
      {
        id: 'education',
        label: 'Education Symbol',
        emoji: '🎓',
        description: 'Learning, academic, knowledge',
        configValues: { iconCategory: 'education' },
      },
      {
        id: 'entertainment',
        label: 'Fun Symbol',
        emoji: '🎮',
        description: 'Gaming, entertainment, play',
        configValues: { iconCategory: 'entertainment' },
      },
    ],
  },
  {
    id: 'textPlacement',
    title: 'Where should the text be placed?',
    subtitle: 'Position of logo text relative to icon (if any)',
    type: 'single',
    required: true,
    options: [
      {
        id: 'center',
        label: 'Centered',
        emoji: '⊡',
        description: 'Text centered, icon as accent',
        configValues: { textPlacement: 'center' },
      },
      {
        id: 'left-aligned',
        label: 'Left Aligned',
        emoji: '◀',
        description: 'Text aligned to the left',
        configValues: { textPlacement: 'left' },
      },
      {
        id: 'right-aligned',
        label: 'Right Aligned',
        emoji: '▶',
        description: 'Text aligned to the right',
        configValues: { textPlacement: 'right' },
      },
      {
        id: 'stacked',
        label: 'Stacked',
        emoji: '▼',
        description: 'Icon above, text below',
        configValues: { textPlacement: 'stacked' },
      },
      {
        id: 'inline',
        label: 'Inline',
        emoji: '↔',
        description: 'Icon and text side by side',
        configValues: { textPlacement: 'inline' },
      },
    ],
  },
  {
    id: 'brandName',
    title: 'What is your brand name?',
    subtitle: 'Enter the text for your logo',
    type: 'text',
    placeholder: 'e.g., Acme Corp',
    required: true,
  },
  {
    id: 'tagline',
    title: 'Add a tagline (optional)',
    subtitle: 'A short phrase that describes your brand',
    type: 'text',
    placeholder: 'e.g., Innovation Starts Here',
    required: false,
  },
  {
    id: 'taglinePlacement',
    title: 'Where should the tagline appear?',
    subtitle: 'Position relative to the main logo',
    type: 'single',
    required: false,
    options: [
      {
        id: 'below',
        label: 'Below Logo',
        emoji: '⬇️',
        description: 'Tagline underneath the logo',
        configValues: { taglinePlacement: 'below' },
      },
      {
        id: 'above',
        label: 'Above Logo',
        emoji: '⬆️',
        description: 'Tagline above the logo',
        configValues: { taglinePlacement: 'above' },
      },
      {
        id: 'right',
        label: 'Right Side',
        emoji: '➡️',
        description: 'Tagline to the right of logo',
        configValues: { taglinePlacement: 'right' },
      },
      {
        id: 'left',
        label: 'Left Side',
        emoji: '⬅️',
        description: 'Tagline to the left of logo',
        configValues: { taglinePlacement: 'left' },
      },
      {
        id: 'integrated',
        label: 'Integrated',
        emoji: '🔗',
        description: 'Tagline blended into design',
        configValues: { taglinePlacement: 'integrated' },
      },
    ],
  },
  {
    id: 'logoTilt',
    title: 'Add a tilt angle to your logo?',
    subtitle: 'Rotate the entire logo for a dynamic look',
    type: 'single',
    required: true,
    options: [
      {
        id: 'no-tilt',
        label: 'No Tilt (0°)',
        emoji: '➖',
        description: 'Keep logo straight',
        configValues: { tiltAngle: 0, hasTilt: false },
      },
      {
        id: 'slight-left',
        label: 'Left (-10°)',
        emoji: '↖️',
        description: 'Slight counter-clockwise rotation',
        configValues: { tiltAngle: -10, hasTilt: true },
      },
      {
        id: 'slight-right',
        label: 'Right (+10°)',
        emoji: '↗️',
        description: 'Slight clockwise rotation',
        configValues: { tiltAngle: 10, hasTilt: true },
      },
      {
        id: 'dynamic-left',
        label: 'Dynamic Left (-20°)',
        emoji: '⤴️',
        description: 'Strong counter-clockwise rotation',
        configValues: { tiltAngle: -20, hasTilt: true },
      },
      {
        id: 'dynamic-right',
        label: 'Dynamic Right (+20°)',
        emoji: '⤵️',
        description: 'Strong clockwise rotation',
        configValues: { tiltAngle: 20, hasTilt: true },
      },
    ],
  },
  {
    id: 'textVerticalAlign',
    title: 'Vertical text alignment',
    subtitle: 'Adjust vertical position of text relative to icon',
    type: 'single',
    required: false,
    skipIf: (answers) => answers.textPlacement === 'center' || answers.textPlacement === 'stacked',
    options: [
      {
        id: 'align-center',
        label: 'Center',
        emoji: '⬌',
        description: 'Text vertically centered',
        configValues: { textVerticalAlign: 'center' },
      },
      {
        id: 'align-top',
        label: 'Raised',
        emoji: '⬆️',
        description: 'Text positioned higher',
        configValues: { textVerticalAlign: 'top' },
      },
      {
        id: 'align-bottom',
        label: 'Lowered',
        emoji: '⬇️',
        description: 'Text positioned lower',
        configValues: { textVerticalAlign: 'bottom' },
      },
    ],
  },
  {
    id: 'outputSettings',
    title: 'Output Settings',
    subtitle: 'Configure your logo output format',
    type: 'single',
    required: true,
    options: [
      {
        id: 'with-background',
        label: 'Keep Background',
        emoji: '🖼️',
        description: 'Standard PNG with background intact',
        configValues: { removeBackground: false },
      },
      {
        id: 'remove-background',
        label: 'Remove Background',
        emoji: '✂️',
        description: 'True PNG with transparent background',
        configValues: { removeBackground: true },
      },
    ],
  },
]
