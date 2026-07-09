/**
 * Sticker Pack Mockup Configuration
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { StickerPackShape, drawStickerPackToCanvas } from '../shapes/StickerPackShape'

export const STICKERPACK_COLORS: ProductColor[] = [
  { id: 'white', name: 'White', hex: '#ffffff', textColor: 'dark' },
  { id: 'cream', name: 'Cream', hex: '#fef9e7', textColor: 'dark' },
  { id: 'kraft', name: 'Kraft', hex: '#c4a574', textColor: 'dark' },
  { id: 'black', name: 'Black', hex: '#1a1a1a', textColor: 'light' },
  { id: 'clear', name: 'Clear (Gray)', hex: '#e5e5e5', textColor: 'dark' },
  { id: 'pink', name: 'Pink', hex: '#fce7f3', textColor: 'dark' },
  { id: 'blue', name: 'Blue', hex: '#dbeafe', textColor: 'dark' },
  { id: 'mint', name: 'Mint', hex: '#d1fae5', textColor: 'dark' },
  { id: 'yellow', name: 'Yellow', hex: '#fef3c7', textColor: 'dark' },
  { id: 'lavender', name: 'Lavender', hex: '#ede9fe', textColor: 'dark' },
]

export const stickerpackConfig: MockupConfig = {
  id: 'stickerpack',
  name: 'Sticker Pack',
  category: 'accessories',
  icon: 'Sticker',

  canvasWidth: 320,
  canvasHeight: 400,
  aspectRatio: '4/5',

  logoPrintArea: { top: 38, left: 45, width: 40, height: 15 },
  textPrintArea: { top: 35, left: 43, width: 45, height: 20 },

  defaultLogoPosition: { x: 65, y: 45 },
  defaultLogoScale: 0.5,
  defaultTextPosition: { x: 65, y: 45 },
  defaultTextScale: 0.5,

  colors: STICKERPACK_COLORS,
  defaultColorId: 'white',

  shapeComponent: StickerPackShape,

  exportConfig: {
    drawShape: drawStickerPackToCanvas as DrawShapeFunction,
    yOffset: 30,
    scale: 2,
  },

  features: {
    supportsRotation: false,
  },

  renderMode: 'svg',
}
