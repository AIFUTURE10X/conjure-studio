/**
 * Tote Bag Mockup Configuration
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { ToteBagShape, drawToteBagToCanvas } from '../shapes/ToteBagShape'

export const TOTE_BAG_COLORS: ProductColor[] = [
  // Natural/Canvas
  { id: 'natural', name: 'Natural', hex: '#f5f0e6', textColor: 'dark' },
  { id: 'cream', name: 'Cream', hex: '#fef3c7', textColor: 'dark' },
  { id: 'white', name: 'White', hex: '#ffffff', textColor: 'dark' },

  // Neutrals
  { id: 'black', name: 'Black', hex: '#1a1a1a', textColor: 'light' },
  { id: 'gray', name: 'Gray', hex: '#6b7280', textColor: 'light' },
  { id: 'charcoal', name: 'Charcoal', hex: '#374151', textColor: 'light' },

  // Blues
  { id: 'navy', name: 'Navy', hex: '#1e3a5f', textColor: 'light' },
  { id: 'denim', name: 'Denim Blue', hex: '#3b82f6', textColor: 'light' },
  { id: 'sky', name: 'Sky Blue', hex: '#7dd3fc', textColor: 'dark' },

  // Earth tones
  { id: 'olive', name: 'Olive', hex: '#65a30d', textColor: 'dark' },
  { id: 'rust', name: 'Rust', hex: '#b45309', textColor: 'light' },
  { id: 'burgundy', name: 'Burgundy', hex: '#7f1d1d', textColor: 'light' },

  // Others
  { id: 'red', name: 'Red', hex: '#dc2626', textColor: 'light' },
  { id: 'pink', name: 'Pink', hex: '#f9a8d4', textColor: 'dark' },
  { id: 'forest', name: 'Forest', hex: '#166534', textColor: 'light' },
]

export const toteBagConfig: MockupConfig = {
  id: 'tote-bag',
  name: 'Tote Bag',
  category: 'bags',
  icon: 'ShoppingBag',

  canvasWidth: 350,
  canvasHeight: 450,
  aspectRatio: '7/9',

  logoPrintArea: { top: 18, left: 18, width: 64, height: 50 },
  textPrintArea: { top: 15, left: 12, width: 76, height: 65 },

  defaultLogoPosition: { x: 50, y: 42 },
  defaultLogoScale: 1,
  defaultTextPosition: { x: 50, y: 70 },
  defaultTextScale: 1,

  colors: TOTE_BAG_COLORS,
  defaultColorId: 'natural',

  shapeComponent: ToteBagShape,

  exportConfig: {
    drawShape: drawToteBagToCanvas as DrawShapeFunction,
    yOffset: 0,
    scale: 2,
  },

  features: {
    supportsRotation: true,
  },

  photoAssets: {
    baseUrl: '/mockups/tote-bag/',
    colorMap: {
      'natural': 'natural.png',
      'black': 'black.png',
      'white': 'white.png',
    },
    fallbackPhoto: 'natural.png',
  },
  renderMode: 'svg',
}
