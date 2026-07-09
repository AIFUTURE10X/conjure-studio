/**
 * Canvas Print Mockup Configuration
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { CanvasShape, drawCanvasToCanvas } from '../shapes/CanvasShape'

export const CANVAS_COLORS: ProductColor[] = [
  { id: 'white', name: 'White', hex: '#ffffff', textColor: 'dark' },
  { id: 'cream', name: 'Cream', hex: '#fef9e7', textColor: 'dark' },
  { id: 'black', name: 'Black', hex: '#1a1a1a', textColor: 'light' },
  { id: 'charcoal', name: 'Charcoal', hex: '#374151', textColor: 'light' },
  { id: 'navy', name: 'Navy', hex: '#1e3a5f', textColor: 'light' },
  { id: 'burgundy', name: 'Burgundy', hex: '#7f1d1d', textColor: 'light' },
  { id: 'forest', name: 'Forest Green', hex: '#166534', textColor: 'light' },
  { id: 'gray', name: 'Gray', hex: '#9ca3af', textColor: 'dark' },
]

export const canvasConfig: MockupConfig = {
  id: 'canvas',
  name: 'Canvas Print',
  category: 'home',
  icon: 'Frame',

  canvasWidth: 360,
  canvasHeight: 280,
  aspectRatio: '9/7',

  logoPrintArea: { top: 20, left: 18, width: 64, height: 70 },
  textPrintArea: { top: 15, left: 15, width: 70, height: 60 },

  defaultLogoPosition: { x: 50, y: 50 },
  defaultLogoScale: 0.8,
  defaultTextPosition: { x: 50, y: 50 },
  defaultTextScale: 0.8,

  colors: CANVAS_COLORS,
  defaultColorId: 'white',

  shapeComponent: CanvasShape,

  exportConfig: {
    drawShape: drawCanvasToCanvas as DrawShapeFunction,
    yOffset: 50,
    scale: 2,
  },

  features: {
    supportsRotation: true,
  },

  renderMode: 'svg',
}
