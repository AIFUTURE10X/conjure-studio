/**
 * Backpack Mockup Configuration
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { BackpackShape, drawBackpackToCanvas } from '../shapes/BackpackShape'

export const BACKPACK_COLORS: ProductColor[] = [
  { id: 'black', name: 'Black', hex: '#1a1a1a', textColor: 'light' },
  { id: 'charcoal', name: 'Charcoal', hex: '#374151', textColor: 'light' },
  { id: 'gray', name: 'Gray', hex: '#6b7280', textColor: 'light' },
  { id: 'navy', name: 'Navy', hex: '#1e3a5f', textColor: 'light' },
  { id: 'royal', name: 'Royal Blue', hex: '#2563eb', textColor: 'light' },
  { id: 'red', name: 'Red', hex: '#dc2626', textColor: 'light' },
  { id: 'burgundy', name: 'Burgundy', hex: '#7f1d1d', textColor: 'light' },
  { id: 'forest', name: 'Forest Green', hex: '#166534', textColor: 'light' },
  { id: 'olive', name: 'Olive', hex: '#65a30d', textColor: 'dark' },
  { id: 'tan', name: 'Tan', hex: '#d4a574', textColor: 'dark' },
  { id: 'pink', name: 'Pink', hex: '#ec4899', textColor: 'light' },
  { id: 'purple', name: 'Purple', hex: '#7c3aed', textColor: 'light' },
]

export const backpackConfig: MockupConfig = {
  id: 'backpack',
  name: 'Backpack',
  category: 'bags',
  icon: 'Backpack',

  canvasWidth: 340,
  canvasHeight: 420,
  aspectRatio: '17/21',

  logoPrintArea: { top: 18, left: 30, width: 40, height: 20 },
  textPrintArea: { top: 15, left: 25, width: 50, height: 25 },

  defaultLogoPosition: { x: 50, y: 28 },
  defaultLogoScale: 0.7,
  defaultTextPosition: { x: 50, y: 75 },
  defaultTextScale: 0.8,

  colors: BACKPACK_COLORS,
  defaultColorId: 'black',

  shapeComponent: BackpackShape,

  exportConfig: {
    drawShape: drawBackpackToCanvas as DrawShapeFunction,
    yOffset: 40,
    scale: 2,
  },

  features: {
    supportsRotation: true,
    multipleViews: ['front', 'back'],
  },

  renderMode: 'svg',
}
