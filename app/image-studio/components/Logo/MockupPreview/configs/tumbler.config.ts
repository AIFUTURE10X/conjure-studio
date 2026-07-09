/**
 * Tumbler Mockup Configuration
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { TumblerShape, drawTumblerToCanvas } from '../shapes/TumblerShape'

export const TUMBLER_COLORS: ProductColor[] = [
  { id: 'black', name: 'Black', hex: '#1a1a1a', textColor: 'light' },
  { id: 'white', name: 'White', hex: '#f5f5f5', textColor: 'dark' },
  { id: 'silver', name: 'Silver', hex: '#c0c0c0', textColor: 'dark' },
  { id: 'gold', name: 'Gold', hex: '#d4af37', textColor: 'dark' },
  { id: 'navy', name: 'Navy', hex: '#1e3a5f', textColor: 'light' },
  { id: 'red', name: 'Red', hex: '#dc2626', textColor: 'light' },
  { id: 'coral', name: 'Coral', hex: '#ff6b6b', textColor: 'light' },
  { id: 'teal', name: 'Teal', hex: '#0d9488', textColor: 'light' },
  { id: 'mint', name: 'Mint', hex: '#a7f3d0', textColor: 'dark' },
  { id: 'purple', name: 'Purple', hex: '#7c3aed', textColor: 'light' },
  { id: 'pink', name: 'Pink', hex: '#ec4899', textColor: 'light' },
  { id: 'lavender', name: 'Lavender', hex: '#c4b5fd', textColor: 'dark' },
]

export const tumblerConfig: MockupConfig = {
  id: 'tumbler',
  name: 'Tumbler',
  category: 'accessories',
  icon: 'GlassWater',

  canvasWidth: 240,
  canvasHeight: 440,
  aspectRatio: '6/11',

  logoPrintArea: { top: 25, left: 25, width: 50, height: 40 },
  textPrintArea: { top: 20, left: 20, width: 60, height: 50 },

  defaultLogoPosition: { x: 50, y: 45 },
  defaultLogoScale: 0.6,
  defaultTextPosition: { x: 50, y: 55 },
  defaultTextScale: 0.6,

  colors: TUMBLER_COLORS,
  defaultColorId: 'black',

  shapeComponent: TumblerShape,

  exportConfig: {
    drawShape: drawTumblerToCanvas as DrawShapeFunction,
    yOffset: 25,
    scale: 2,
  },

  features: {
    supportsRotation: true,
  },

  renderMode: 'svg',
}
