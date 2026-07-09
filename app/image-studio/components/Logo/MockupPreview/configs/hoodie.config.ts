/**
 * Hoodie Mockup Configuration
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { HoodieShape, drawHoodieToCanvas } from '../shapes/HoodieShape'

export const HOODIE_COLORS: ProductColor[] = [
  // Neutrals
  { id: 'black', name: 'Black', hex: '#1a1a1a', textColor: 'light' },
  { id: 'white', name: 'White', hex: '#ffffff', textColor: 'dark' },
  { id: 'charcoal', name: 'Charcoal', hex: '#374151', textColor: 'light' },
  { id: 'heather', name: 'Heather Gray', hex: '#9ca3af', textColor: 'dark' },
  { id: 'cream', name: 'Cream', hex: '#fef3c7', textColor: 'dark' },

  // Blues
  { id: 'navy', name: 'Navy', hex: '#1e3a5f', textColor: 'light' },
  { id: 'royal', name: 'Royal Blue', hex: '#2563eb', textColor: 'light' },
  { id: 'slate', name: 'Slate Blue', hex: '#475569', textColor: 'light' },

  // Reds/Pinks
  { id: 'burgundy', name: 'Burgundy', hex: '#7f1d1d', textColor: 'light' },
  { id: 'rust', name: 'Rust', hex: '#b45309', textColor: 'light' },
  { id: 'rose', name: 'Dusty Rose', hex: '#be185d', textColor: 'light' },

  // Greens
  { id: 'forest', name: 'Forest Green', hex: '#166534', textColor: 'light' },
  { id: 'sage', name: 'Sage', hex: '#84cc16', textColor: 'dark' },
  { id: 'olive', name: 'Olive', hex: '#65a30d', textColor: 'dark' },

  // Others
  { id: 'purple', name: 'Purple', hex: '#7c3aed', textColor: 'light' },
  { id: 'tan', name: 'Tan', hex: '#d4a574', textColor: 'dark' },
]

export const hoodieConfig: MockupConfig = {
  id: 'hoodie',
  name: 'Hoodie',
  category: 'apparel',
  icon: 'Shirt',

  canvasWidth: 400,
  canvasHeight: 400,
  aspectRatio: '1/1',

  logoPrintArea: { top: 22, left: 20, width: 60, height: 35 },
  textPrintArea: { top: 15, left: 10, width: 80, height: 75 },

  defaultLogoPosition: { x: 50, y: 38 },
  defaultLogoScale: 0.9,
  defaultTextPosition: { x: 50, y: 68 },
  defaultTextScale: 1,

  colors: HOODIE_COLORS,
  defaultColorId: 'black',

  shapeComponent: HoodieShape,

  exportConfig: {
    drawShape: drawHoodieToCanvas as DrawShapeFunction,
    yOffset: 80,
    scale: 2,
  },

  features: {
    supportsRotation: true,
    multipleViews: ['front', 'back'],
  },

  photoAssets: {
    baseUrl: '/mockups/hoodie/',
    colorMap: {
      'black': 'black.png',
      'white': 'white.png',
      'navy': 'navy.png',
      'gray': 'gray.png',
    },
    fallbackPhoto: 'black.png',
  },
  renderMode: 'svg',
}
