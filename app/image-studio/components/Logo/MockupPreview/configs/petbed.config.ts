/**
 * Pet Bed Mockup Configuration
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { PetBedShape, drawPetBedToCanvas } from '../shapes/PetBedShape'

export const PETBED_COLORS: ProductColor[] = [
  { id: 'gray', name: 'Gray', hex: '#6b7280', textColor: 'light' },
  { id: 'brown', name: 'Brown', hex: '#78350f', textColor: 'light' },
  { id: 'beige', name: 'Beige', hex: '#d4c4a8', textColor: 'dark' },
  { id: 'navy', name: 'Navy', hex: '#1e3a5f', textColor: 'light' },
  { id: 'burgundy', name: 'Burgundy', hex: '#7f1d1d', textColor: 'light' },
  { id: 'forest', name: 'Forest Green', hex: '#166534', textColor: 'light' },
  { id: 'pink', name: 'Pink', hex: '#f9a8d4', textColor: 'dark' },
  { id: 'blue', name: 'Blue', hex: '#93c5fd', textColor: 'dark' },
]

export const petbedConfig: MockupConfig = {
  id: 'petbed',
  name: 'Pet Bed',
  category: 'home',
  icon: 'Dog',

  canvasWidth: 340,
  canvasHeight: 280,
  aspectRatio: '340/280',  // Must match canvasWidth/canvasHeight for position consistency

  logoPrintArea: { top: 30, left: 25, width: 50, height: 40 },
  textPrintArea: { top: 25, left: 20, width: 60, height: 50 },

  defaultLogoPosition: { x: 50, y: 50 },
  defaultLogoScale: 0.6,
  defaultTextPosition: { x: 50, y: 70 },
  defaultTextScale: 0.6,

  colors: PETBED_COLORS,
  defaultColorId: 'gray',

  shapeComponent: PetBedShape,

  exportConfig: {
    drawShape: drawPetBedToCanvas as DrawShapeFunction,
    yOffset: 60,
    scale: 2,
  },

  features: {
    supportsRotation: true,
    // No multipleViews - single view only
  },

  renderMode: 'svg',
}
