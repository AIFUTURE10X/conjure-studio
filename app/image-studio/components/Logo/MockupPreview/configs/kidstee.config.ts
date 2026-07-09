/**
 * Kids T-Shirt Mockup Configuration
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { KidsTeeShape, drawKidsTeeToCanvas } from '../shapes/KidsTeeShape'

export const KIDSTEE_COLORS: ProductColor[] = [
  { id: 'white', name: 'White', hex: '#ffffff', textColor: 'dark' },
  { id: 'pink', name: 'Pink', hex: '#f9a8d4', textColor: 'dark' },
  { id: 'babyblue', name: 'Baby Blue', hex: '#93c5fd', textColor: 'dark' },
  { id: 'mint', name: 'Mint', hex: '#6ee7b7', textColor: 'dark' },
  { id: 'yellow', name: 'Yellow', hex: '#fde047', textColor: 'dark' },
  { id: 'orange', name: 'Orange', hex: '#fb923c', textColor: 'dark' },
  { id: 'red', name: 'Red', hex: '#dc2626', textColor: 'light' },
  { id: 'purple', name: 'Purple', hex: '#a855f7', textColor: 'light' },
  { id: 'navy', name: 'Navy', hex: '#1e3a5f', textColor: 'light' },
  { id: 'black', name: 'Black', hex: '#1a1a1a', textColor: 'light' },
  { id: 'gray', name: 'Gray', hex: '#9ca3af', textColor: 'dark' },
  { id: 'forest', name: 'Forest Green', hex: '#166534', textColor: 'light' },
]

export const kidsteeConfig: MockupConfig = {
  id: 'kidstee',
  name: 'Kids Tee',
  category: 'apparel',
  icon: 'Shirt',

  canvasWidth: 360,
  canvasHeight: 295,
  aspectRatio: '360/295',  // Must match canvasWidth/canvasHeight for position consistency

  logoPrintArea: { top: 18, left: 25, width: 50, height: 45 },
  textPrintArea: { top: 10, left: 10, width: 80, height: 80 },

  defaultLogoPosition: { x: 50, y: 35 },
  defaultLogoScale: 0.9,
  defaultTextPosition: { x: 50, y: 78 },
  defaultTextScale: 0.9,

  colors: KIDSTEE_COLORS,
  defaultColorId: 'white',

  shapeComponent: KidsTeeShape,

  exportConfig: {
    drawShape: drawKidsTeeToCanvas as DrawShapeFunction,
    yOffset: 115,
    scale: 2,
  },

  features: {
    supportsRotation: true,
    multipleViews: ['front', 'back'],
  },

  renderMode: 'svg',
}
