/**
 * Travel Mug Mockup Configuration
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { TravelMugShape, drawTravelMugToCanvas } from '../shapes/TravelMugShape'

export const TRAVELMUG_COLORS: ProductColor[] = [
  { id: 'black', name: 'Black', hex: '#1a1a1a', textColor: 'light' },
  { id: 'white', name: 'White', hex: '#f5f5f5', textColor: 'dark' },
  { id: 'silver', name: 'Silver', hex: '#c0c0c0', textColor: 'dark' },
  { id: 'navy', name: 'Navy', hex: '#1e3a5f', textColor: 'light' },
  { id: 'red', name: 'Red', hex: '#dc2626', textColor: 'light' },
  { id: 'green', name: 'Green', hex: '#16a34a', textColor: 'light' },
  { id: 'blue', name: 'Blue', hex: '#2563eb', textColor: 'light' },
  { id: 'pink', name: 'Pink', hex: '#ec4899', textColor: 'light' },
  { id: 'purple', name: 'Purple', hex: '#7c3aed', textColor: 'light' },
  { id: 'orange', name: 'Orange', hex: '#ea580c', textColor: 'light' },
]

export const travelmugConfig: MockupConfig = {
  id: 'travelmug',
  name: 'Travel Mug',
  category: 'accessories',
  icon: 'Coffee',

  canvasWidth: 280,
  canvasHeight: 400,
  aspectRatio: '7/10',

  logoPrintArea: { top: 30, left: 20, width: 60, height: 35 },
  textPrintArea: { top: 25, left: 15, width: 70, height: 40 },

  defaultLogoPosition: { x: 50, y: 42 },
  defaultLogoScale: 0.7,
  defaultTextPosition: { x: 50, y: 55 },
  defaultTextScale: 0.7,

  colors: TRAVELMUG_COLORS,
  defaultColorId: 'black',

  shapeComponent: TravelMugShape,

  exportConfig: {
    drawShape: drawTravelMugToCanvas as DrawShapeFunction,
    yOffset: 30,
    scale: 2,
  },

  features: {
    supportsRotation: true,
  },

  renderMode: 'svg',
}
