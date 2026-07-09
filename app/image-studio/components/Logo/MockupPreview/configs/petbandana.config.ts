/**
 * Pet Bandana Mockup Configuration
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { PetBandanaShape, drawPetBandanaToCanvas } from '../shapes/PetBandanaShape'

export const PETBANDANA_COLORS: ProductColor[] = [
  { id: 'red', name: 'Red', hex: '#dc2626', textColor: 'light' },
  { id: 'blue', name: 'Blue', hex: '#2563eb', textColor: 'light' },
  { id: 'black', name: 'Black', hex: '#1a1a1a', textColor: 'light' },
  { id: 'navy', name: 'Navy', hex: '#1e3a5f', textColor: 'light' },
  { id: 'pink', name: 'Pink', hex: '#ec4899', textColor: 'light' },
  { id: 'orange', name: 'Orange', hex: '#ea580c', textColor: 'light' },
  { id: 'yellow', name: 'Yellow', hex: '#facc15', textColor: 'dark' },
  { id: 'green', name: 'Green', hex: '#16a34a', textColor: 'light' },
  { id: 'purple', name: 'Purple', hex: '#7c3aed', textColor: 'light' },
  { id: 'teal', name: 'Teal', hex: '#0d9488', textColor: 'light' },
  { id: 'white', name: 'White', hex: '#ffffff', textColor: 'dark' },
  { id: 'gray', name: 'Gray', hex: '#6b7280', textColor: 'light' },
]

export const petbandanaConfig: MockupConfig = {
  id: 'petbandana',
  name: 'Pet Bandana',
  category: 'accessories',
  icon: 'Dog',

  canvasWidth: 300,
  canvasHeight: 290,
  aspectRatio: '300/290',  // Must match canvasWidth/canvasHeight for position consistency

  logoPrintArea: { top: 20, left: 25, width: 50, height: 50 },
  textPrintArea: { top: 15, left: 15, width: 70, height: 60 },

  defaultLogoPosition: { x: 50, y: 45 },
  defaultLogoScale: 0.7,
  defaultTextPosition: { x: 50, y: 65 },
  defaultTextScale: 0.8,

  colors: PETBANDANA_COLORS,
  defaultColorId: 'red',

  shapeComponent: PetBandanaShape,

  exportConfig: {
    drawShape: drawPetBandanaToCanvas as DrawShapeFunction,
    yOffset: 80,
    scale: 2,
  },

  features: {
    supportsRotation: true,
    // No multipleViews - single view only
  },

  renderMode: 'svg',
}
