/**
 * Poster / Print Mockup Configuration
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { PosterShape, drawPosterToCanvas } from '../shapes/PosterShape'

export const POSTER_COLORS: ProductColor[] = [
  // Paper whites
  { id: 'white', name: 'White', hex: '#ffffff', textColor: 'dark' },
  { id: 'cream', name: 'Cream', hex: '#fef9e7', textColor: 'dark' },
  { id: 'ivory', name: 'Ivory', hex: '#fffbeb', textColor: 'dark' },
  { id: 'kraft', name: 'Kraft', hex: '#d4a574', textColor: 'dark' },

  // Neutrals
  { id: 'black', name: 'Black', hex: '#1a1a1a', textColor: 'light' },
  { id: 'charcoal', name: 'Charcoal', hex: '#374151', textColor: 'light' },
  { id: 'gray', name: 'Gray', hex: '#9ca3af', textColor: 'dark' },

  // Colors
  { id: 'navy', name: 'Navy', hex: '#1e3a5f', textColor: 'light' },
  { id: 'burgundy', name: 'Burgundy', hex: '#7f1d1d', textColor: 'light' },
  { id: 'forest', name: 'Forest', hex: '#166534', textColor: 'light' },
  { id: 'blush', name: 'Blush', hex: '#fce7f3', textColor: 'dark' },
  { id: 'sage', name: 'Sage', hex: '#d1fae5', textColor: 'dark' },
]

export const posterConfig: MockupConfig = {
  id: 'poster',
  name: 'Poster',
  category: 'home',
  icon: 'FileImage',

  canvasWidth: 360,
  canvasHeight: 480,
  aspectRatio: '3/4',

  logoPrintArea: { top: 8, left: 8, width: 84, height: 84 },
  textPrintArea: { top: 5, left: 5, width: 90, height: 90 },

  defaultLogoPosition: { x: 50, y: 45 },
  defaultLogoScale: 1.0,
  defaultTextPosition: { x: 50, y: 70 },
  defaultTextScale: 1.0,

  colors: POSTER_COLORS,
  defaultColorId: 'white',

  shapeComponent: PosterShape,

  exportConfig: {
    drawShape: drawPosterToCanvas as DrawShapeFunction,
    yOffset: 20,
    scale: 2,
  },

  features: {
    supportsRotation: true,
  },

  renderMode: 'svg',
}
