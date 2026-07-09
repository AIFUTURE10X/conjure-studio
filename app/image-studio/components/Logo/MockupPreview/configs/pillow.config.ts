/**
 * Pillow Mockup Configuration
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { PillowShape, drawPillowToCanvas } from '../shapes/PillowShape'

export const PILLOW_COLORS: ProductColor[] = [
  // Neutrals
  { id: 'white', name: 'White', hex: '#ffffff', textColor: 'dark' },
  { id: 'cream', name: 'Cream', hex: '#fef3c7', textColor: 'dark' },
  { id: 'beige', name: 'Beige', hex: '#e7e5e4', textColor: 'dark' },
  { id: 'gray', name: 'Gray', hex: '#9ca3af', textColor: 'dark' },
  { id: 'charcoal', name: 'Charcoal', hex: '#374151', textColor: 'light' },
  { id: 'black', name: 'Black', hex: '#1a1a1a', textColor: 'light' },

  // Blues
  { id: 'navy', name: 'Navy', hex: '#1e3a5f', textColor: 'light' },
  { id: 'blue', name: 'Blue', hex: '#3b82f6', textColor: 'light' },
  { id: 'sky', name: 'Light Blue', hex: '#bae6fd', textColor: 'dark' },

  // Greens
  { id: 'sage', name: 'Sage', hex: '#a7f3d0', textColor: 'dark' },
  { id: 'forest', name: 'Forest', hex: '#166534', textColor: 'light' },
  { id: 'olive', name: 'Olive', hex: '#65a30d', textColor: 'dark' },

  // Warm tones
  { id: 'blush', name: 'Blush', hex: '#fecdd3', textColor: 'dark' },
  { id: 'coral', name: 'Coral', hex: '#f97316', textColor: 'light' },
  { id: 'mustard', name: 'Mustard', hex: '#eab308', textColor: 'dark' },
  { id: 'burgundy', name: 'Burgundy', hex: '#7f1d1d', textColor: 'light' },
]

export const pillowConfig: MockupConfig = {
  id: 'pillow',
  name: 'Pillow',
  category: 'home',
  icon: 'Square',

  canvasWidth: 400,
  canvasHeight: 400,
  aspectRatio: '1/1',

  logoPrintArea: { top: 20, left: 20, width: 60, height: 60 },
  textPrintArea: { top: 15, left: 15, width: 70, height: 70 },

  defaultLogoPosition: { x: 50, y: 48 },
  defaultLogoScale: 1.1,
  defaultTextPosition: { x: 50, y: 72 },
  defaultTextScale: 1,

  colors: PILLOW_COLORS,
  defaultColorId: 'white',

  shapeComponent: PillowShape,

  exportConfig: {
    drawShape: drawPillowToCanvas as DrawShapeFunction,
    yOffset: 0,
    scale: 2,
  },

  features: {
    supportsRotation: true,
  },

  photoAssets: {
    baseUrl: '/mockups/pillow/',
    colorMap: {
      'white': 'white.png',
      'cream': 'cream.png',
      'gray': 'gray.png',
    },
    fallbackPhoto: 'white.png',
  },
  renderMode: 'svg',
}
