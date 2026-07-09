/**
 * Hat/Cap Mockup Configuration
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { HatShape, drawHatToCanvas } from '../shapes/HatShape'

export const HAT_COLORS: ProductColor[] = [
  // Neutrals
  { id: 'black', name: 'Black', hex: '#1a1a1a', textColor: 'light' },
  { id: 'white', name: 'White', hex: '#ffffff', textColor: 'dark' },
  { id: 'gray', name: 'Gray', hex: '#6b7280', textColor: 'light' },
  { id: 'khaki', name: 'Khaki', hex: '#d4b896', textColor: 'dark' },
  { id: 'stone', name: 'Stone', hex: '#a8a29e', textColor: 'dark' },

  // Blues
  { id: 'navy', name: 'Navy', hex: '#1e3a5f', textColor: 'light' },
  { id: 'royal', name: 'Royal Blue', hex: '#2563eb', textColor: 'light' },
  { id: 'denim', name: 'Denim', hex: '#3b82f6', textColor: 'light' },

  // Reds
  { id: 'red', name: 'Red', hex: '#dc2626', textColor: 'light' },
  { id: 'maroon', name: 'Maroon', hex: '#7f1d1d', textColor: 'light' },
  { id: 'coral', name: 'Coral', hex: '#f87171', textColor: 'dark' },

  // Greens
  { id: 'forest', name: 'Forest', hex: '#166534', textColor: 'light' },
  { id: 'olive', name: 'Olive', hex: '#65a30d', textColor: 'dark' },
  { id: 'camo', name: 'Camo Green', hex: '#4d5c3f', textColor: 'light' },

  // Others
  { id: 'orange', name: 'Orange', hex: '#ea580c', textColor: 'light' },
  { id: 'pink', name: 'Pink', hex: '#ec4899', textColor: 'light' },
]

export const hatConfig: MockupConfig = {
  id: 'hat',
  name: 'Hat',
  category: 'apparel',
  icon: 'Crown',

  canvasWidth: 400,
  canvasHeight: 300,
  aspectRatio: '4/3',

  // Front panel area for logo
  logoPrintArea: { top: 18, left: 30, width: 40, height: 35 },
  textPrintArea: { top: 15, left: 20, width: 60, height: 45 },

  defaultLogoPosition: { x: 50, y: 38 },
  defaultLogoScale: 0.7,
  defaultTextPosition: { x: 50, y: 55 },
  defaultTextScale: 0.8,

  colors: HAT_COLORS,
  defaultColorId: 'navy',

  shapeComponent: HatShape,

  exportConfig: {
    drawShape: drawHatToCanvas as DrawShapeFunction,
    yOffset: 0,
    scale: 2,
  },

  features: {
    supportsRotation: true,
    multipleViews: ['front'],
  },

  photoAssets: {
    baseUrl: '/mockups/hat/',
    colorMap: {
      'black': 'black.png',
      'white': 'white.png',
      'navy': 'navy.png',
    },
    fallbackPhoto: 'navy.png',
  },
  renderMode: 'svg',
}
