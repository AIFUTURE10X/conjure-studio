/**
 * Fanny Pack / Belt Bag Mockup Configuration
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { FannyPackShape, drawFannyPackToCanvas } from '../shapes/FannyPackShape'

export const FANNYPACK_COLORS: ProductColor[] = [
  { id: 'black', name: 'Black', hex: '#1a1a1a', textColor: 'light' },
  { id: 'charcoal', name: 'Charcoal', hex: '#374151', textColor: 'light' },
  { id: 'gray', name: 'Gray', hex: '#6b7280', textColor: 'light' },
  { id: 'navy', name: 'Navy', hex: '#1e3a5f', textColor: 'light' },
  { id: 'red', name: 'Red', hex: '#dc2626', textColor: 'light' },
  { id: 'forest', name: 'Forest Green', hex: '#166534', textColor: 'light' },
  { id: 'tan', name: 'Tan', hex: '#d4a574', textColor: 'dark' },
  { id: 'pink', name: 'Pink', hex: '#ec4899', textColor: 'light' },
  { id: 'purple', name: 'Purple', hex: '#7c3aed', textColor: 'light' },
  { id: 'teal', name: 'Teal', hex: '#0d9488', textColor: 'light' },
]

export const fannypackConfig: MockupConfig = {
  id: 'fannypack',
  name: 'Fanny Pack',
  category: 'bags',
  icon: 'Package',

  canvasWidth: 360,
  canvasHeight: 200,
  aspectRatio: '9/5',

  logoPrintArea: { top: 35, left: 30, width: 40, height: 30 },
  textPrintArea: { top: 30, left: 25, width: 50, height: 40 },

  defaultLogoPosition: { x: 50, y: 50 },
  defaultLogoScale: 0.6,
  defaultTextPosition: { x: 50, y: 50 },
  defaultTextScale: 0.6,

  colors: FANNYPACK_COLORS,
  defaultColorId: 'black',

  shapeComponent: FannyPackShape,

  exportConfig: {
    drawShape: drawFannyPackToCanvas as DrawShapeFunction,
    yOffset: 40,
    scale: 2,
  },

  features: {
    supportsRotation: true,
  },

  renderMode: 'svg',
}
