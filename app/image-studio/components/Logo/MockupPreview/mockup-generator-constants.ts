/**
 * Constants and types for MockupPhotoGenerator
 */

export interface ProductConfig {
  id: string
  colors: string[]
  hasViews?: boolean
}

export interface GenerationStatus {
  [key: string]: 'idle' | 'generating' | 'success' | 'error' | 'skipped'
}

export interface HatCategory {
  id: string
  name: string
  items: ProductConfig[]
}

// All 18 colors for clothing
export const ALL_CLOTHING_COLORS = [
  'black', 'white', 'charcoal', 'gray', 'heather', 'navy', 'royal', 'sky',
  'red', 'burgundy', 'coral', 'forest', 'olive', 'teal', 'purple', 'pink', 'orange', 'yellow'
]

// Color hex values for visual swatches
export const COLOR_HEX_MAP: Record<string, string> = {
  // Neutrals
  black: '#1a1a1a',
  white: '#ffffff',
  charcoal: '#374151',
  gray: '#6b7280',
  heather: '#9ca3af',
  // Blues
  navy: '#1e3a5f',
  royal: '#2563eb',
  sky: '#38bdf8',
  // Reds
  red: '#dc2626',
  burgundy: '#7f1d1d',
  coral: '#f87171',
  // Greens
  forest: '#166534',
  olive: '#65a30d',
  teal: '#0d9488',
  // Others
  purple: '#7c3aed',
  pink: '#ec4899',
  orange: '#ea580c',
  yellow: '#facc15',
  // Additional colors for other products
  cream: '#f5f5dc',
  silver: '#c0c0c0',
  natural: '#d4c4a8',
  clear: 'transparent',
  blue: '#3b82f6',
  brown: '#92400e',
}

// Light colors that need borders
export const LIGHT_COLORS = ['white', 'cream', 'natural', 'clear', 'yellow', 'coral', 'sky', 'heather']

// Products with multiple views (front, back, side)
export const CLOTHING_WITH_VIEWS: ProductConfig[] = [
  { id: 'tshirt', colors: ALL_CLOTHING_COLORS, hasViews: true },
  { id: 'longsleeve', colors: ALL_CLOTHING_COLORS, hasViews: true },
  { id: 'tanktop', colors: ALL_CLOTHING_COLORS, hasViews: true },
  { id: 'hoodie', colors: ALL_CLOTHING_COLORS, hasViews: true },
  { id: 'ziphoodie', colors: ALL_CLOTHING_COLORS, hasViews: true },
]

// Hats category (caps and beanies)
export const HATS_CATEGORY: HatCategory = {
  id: 'hats',
  name: 'Hats',
  items: [
    { id: 'hat', colors: ALL_CLOTHING_COLORS },
    { id: 'beanie', colors: ALL_CLOTHING_COLORS },
  ]
}

// Other products without multiple views
export const OTHER_PRODUCTS: ProductConfig[] = [
  // Mugs & Drinkware
  { id: 'mug', colors: ['white', 'black', 'cream'] },
  { id: 'travelmug', colors: ['white', 'black', 'silver'] },
  { id: 'tumbler', colors: ['white', 'black', 'silver'] },
  // Wall Art & Decor
  { id: 'wall-art', colors: ['white', 'black'] },
  { id: 'canvas', colors: ['white'] },
  { id: 'poster', colors: ['white'] },
  // Stickers & Decals
  { id: 'stickers', colors: ['white'] },
  { id: 'stickerpack', colors: ['white'] },
  // Bags & Accessories
  { id: 'tote-bag', colors: ['natural', 'black', 'white'] },
  { id: 'backpack', colors: ['black', 'gray', 'navy'] },
  { id: 'fannypack', colors: ['black', 'gray'] },
  // Pillows & Blankets
  { id: 'pillow', colors: ['white', 'cream', 'gray'] },
  // Phone Cases
  { id: 'phone-case', colors: ['black', 'white', 'clear'] },
  // Kids & Baby
  { id: 'babybodysuit', colors: ['white', 'pink', 'blue'] },
  { id: 'kidstee', colors: ['white', 'black', 'pink', 'blue'] },
  // Pet Products
  { id: 'petbandana', colors: ['red', 'blue', 'black'] },
  { id: 'pethoodie', colors: ['black', 'gray', 'pink'] },
  { id: 'petbed', colors: ['gray', 'brown', 'navy'] },
]
