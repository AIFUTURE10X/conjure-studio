/**
 * Wall Art / Poster Mockup Configuration
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { WallArtShape, drawWallArtToCanvas } from '../shapes/WallArtShape'

export const WALLART_COLORS: ProductColor[] = [
  // Canvas backgrounds
  { id: 'white', name: 'White', hex: '#ffffff', textColor: 'dark' },
  { id: 'cream', name: 'Cream', hex: '#fef9c3', textColor: 'dark' },
  { id: 'ivory', name: 'Ivory', hex: '#fffbeb', textColor: 'dark' },

  // Neutrals
  { id: 'black', name: 'Black', hex: '#1a1a1a', textColor: 'light' },
  { id: 'charcoal', name: 'Charcoal', hex: '#374151', textColor: 'light' },
  { id: 'gray', name: 'Gray', hex: '#6b7280', textColor: 'light' },

  // Warm tones
  { id: 'tan', name: 'Tan', hex: '#d4a574', textColor: 'dark' },
  { id: 'terracotta', name: 'Terracotta', hex: '#c2410c', textColor: 'light' },
  { id: 'blush', name: 'Blush', hex: '#fecdd3', textColor: 'dark' },

  // Cool tones
  { id: 'navy', name: 'Navy', hex: '#1e3a5f', textColor: 'light' },
  { id: 'sage', name: 'Sage', hex: '#a7f3d0', textColor: 'dark' },
  { id: 'dusty-blue', name: 'Dusty Blue', hex: '#93c5fd', textColor: 'dark' },

  // Bold
  { id: 'red', name: 'Red', hex: '#dc2626', textColor: 'light' },
  { id: 'forest', name: 'Forest', hex: '#166534', textColor: 'light' },
  { id: 'gold', name: 'Gold', hex: '#ca8a04', textColor: 'dark' },
]

export const wallArtConfig: MockupConfig = {
  id: 'wall-art',
  name: 'Wall Art',
  category: 'home',
  icon: 'Frame',

  canvasWidth: 400,
  canvasHeight: 500,
  aspectRatio: '4/5',

  // Print area within the canvas (excluding frame)
  logoPrintArea: { top: 15, left: 18, width: 64, height: 65 },
  textPrintArea: { top: 12, left: 15, width: 70, height: 72 },

  defaultLogoPosition: { x: 50, y: 45 },
  defaultLogoScale: 1.2,
  defaultTextPosition: { x: 50, y: 72 },
  defaultTextScale: 1,

  colors: WALLART_COLORS,
  defaultColorId: 'white',

  shapeComponent: WallArtShape,

  exportConfig: {
    drawShape: drawWallArtToCanvas as DrawShapeFunction,
    yOffset: 0,
    scale: 2,
  },

  features: {
    supportsRotation: true,
  },

  photoAssets: {
    baseUrl: '/mockups/wall-art/',
    colorMap: {
      'white': 'white.png',
      'black': 'black.png',
    },
    fallbackPhoto: 'white.png',
  },
  renderMode: 'svg',
}
