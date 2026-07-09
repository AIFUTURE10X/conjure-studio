/**
 * Stickers Mockup Configuration
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { StickerShape, drawStickerToCanvas } from '../shapes/StickerShape'

export const STICKER_COLORS: ProductColor[] = [
  // Classic
  { id: 'white', name: 'White', hex: '#ffffff', textColor: 'dark' },
  { id: 'black', name: 'Black', hex: '#1a1a1a', textColor: 'light' },
  { id: 'kraft', name: 'Kraft', hex: '#c4a77d', textColor: 'dark' },
  { id: 'clear', name: 'Clear/Frost', hex: '#f0f0f0', textColor: 'dark' },

  // Bright colors
  { id: 'red', name: 'Red', hex: '#ef4444', textColor: 'light' },
  { id: 'orange', name: 'Orange', hex: '#f97316', textColor: 'light' },
  { id: 'yellow', name: 'Yellow', hex: '#facc15', textColor: 'dark' },
  { id: 'lime', name: 'Lime', hex: '#84cc16', textColor: 'dark' },
  { id: 'green', name: 'Green', hex: '#22c55e', textColor: 'light' },
  { id: 'cyan', name: 'Cyan', hex: '#06b6d4', textColor: 'light' },
  { id: 'blue', name: 'Blue', hex: '#3b82f6', textColor: 'light' },
  { id: 'purple', name: 'Purple', hex: '#a855f7', textColor: 'light' },
  { id: 'pink', name: 'Pink', hex: '#ec4899', textColor: 'light' },

  // Pastels
  { id: 'blush', name: 'Blush', hex: '#fecdd3', textColor: 'dark' },
  { id: 'mint', name: 'Mint', hex: '#a7f3d0', textColor: 'dark' },
  { id: 'lavender', name: 'Lavender', hex: '#ddd6fe', textColor: 'dark' },
]

export const stickersConfig: MockupConfig = {
  id: 'stickers',
  name: 'Stickers',
  category: 'other',
  icon: 'Sticker',

  canvasWidth: 300,
  canvasHeight: 300,
  aspectRatio: '1/1',

  logoPrintArea: { top: 15, left: 15, width: 70, height: 70 },
  textPrintArea: { top: 12, left: 12, width: 76, height: 76 },

  defaultLogoPosition: { x: 50, y: 48 },
  defaultLogoScale: 1,
  defaultTextPosition: { x: 50, y: 72 },
  defaultTextScale: 0.9,

  colors: STICKER_COLORS,
  defaultColorId: 'white',

  shapeComponent: StickerShape,

  exportConfig: {
    drawShape: drawStickerToCanvas as DrawShapeFunction,
    yOffset: 0,
    scale: 2,
  },

  features: {
    supportsRotation: true,
    shapeVariants: ['rounded-square', 'circle', 'custom'],
  },

  photoAssets: {
    baseUrl: '/mockups/stickers/',
    colorMap: {
      'white': 'white.png',
    },
    fallbackPhoto: 'white.png',
  },
  renderMode: 'svg',
}
