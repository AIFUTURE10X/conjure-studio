/**
 * Mug/Tumbler Mockup Configuration
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { MugShape, drawMugToCanvas } from '../shapes/MugShape'

export const MUG_COLORS: ProductColor[] = [
  // Classic
  { id: 'white', name: 'White', hex: '#ffffff', textColor: 'dark' },
  { id: 'black', name: 'Black', hex: '#1a1a1a', textColor: 'light' },
  { id: 'cream', name: 'Cream', hex: '#fef3c7', textColor: 'dark' },

  // Blues
  { id: 'navy', name: 'Navy', hex: '#1e3a5f', textColor: 'light' },
  { id: 'blue', name: 'Blue', hex: '#3b82f6', textColor: 'light' },
  { id: 'sky', name: 'Sky Blue', hex: '#7dd3fc', textColor: 'dark' },

  // Reds
  { id: 'red', name: 'Red', hex: '#dc2626', textColor: 'light' },
  { id: 'maroon', name: 'Maroon', hex: '#7f1d1d', textColor: 'light' },
  { id: 'pink', name: 'Pink', hex: '#f9a8d4', textColor: 'dark' },

  // Greens
  { id: 'green', name: 'Green', hex: '#22c55e', textColor: 'light' },
  { id: 'forest', name: 'Forest', hex: '#166534', textColor: 'light' },
  { id: 'mint', name: 'Mint', hex: '#a7f3d0', textColor: 'dark' },

  // Others
  { id: 'orange', name: 'Orange', hex: '#f97316', textColor: 'light' },
  { id: 'yellow', name: 'Yellow', hex: '#fde047', textColor: 'dark' },
  { id: 'purple', name: 'Purple', hex: '#a855f7', textColor: 'light' },
  { id: 'gray', name: 'Gray', hex: '#9ca3af', textColor: 'dark' },
]

export const mugConfig: MockupConfig = {
  id: 'mug',
  name: 'Mug',
  category: 'accessories',
  icon: 'Coffee',

  canvasWidth: 400,
  canvasHeight: 350,
  aspectRatio: '8/7',

  // Print area on front of mug body
  logoPrintArea: { top: 25, left: 22, width: 45, height: 50 },
  textPrintArea: { top: 20, left: 18, width: 50, height: 60 },

  defaultLogoPosition: { x: 42, y: 50 },
  defaultLogoScale: 0.9,
  defaultTextPosition: { x: 42, y: 75 },
  defaultTextScale: 1,

  colors: MUG_COLORS,
  defaultColorId: 'white',

  shapeComponent: MugShape,

  exportConfig: {
    drawShape: drawMugToCanvas as DrawShapeFunction,
    yOffset: 0,
    scale: 2,
  },

  features: {
    supportsRotation: true,
    supportsCurvedPrint: true,
  },

  photoAssets: {
    baseUrl: '/mockups/mug/',
    colorMap: {
      'white': 'white.png',
      'black': 'black.png',
      'cream': 'cream.png',
    },
    fallbackPhoto: 'white.png',
  },
  renderMode: 'photo',
}
