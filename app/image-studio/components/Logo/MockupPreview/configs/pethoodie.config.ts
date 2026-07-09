/**
 * Pet Hoodie Mockup Configuration
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { PetHoodieShape, drawPetHoodieToCanvas } from '../shapes/PetHoodieShape'

export const PETHOODIE_COLORS: ProductColor[] = [
  { id: 'black', name: 'Black', hex: '#1a1a1a', textColor: 'light' },
  { id: 'gray', name: 'Gray', hex: '#6b7280', textColor: 'light' },
  { id: 'navy', name: 'Navy', hex: '#1e3a5f', textColor: 'light' },
  { id: 'red', name: 'Red', hex: '#dc2626', textColor: 'light' },
  { id: 'pink', name: 'Pink', hex: '#ec4899', textColor: 'light' },
  { id: 'blue', name: 'Blue', hex: '#2563eb', textColor: 'light' },
  { id: 'purple', name: 'Purple', hex: '#7c3aed', textColor: 'light' },
  { id: 'green', name: 'Green', hex: '#16a34a', textColor: 'light' },
  { id: 'orange', name: 'Orange', hex: '#ea580c', textColor: 'light' },
  { id: 'yellow', name: 'Yellow', hex: '#facc15', textColor: 'dark' },
  { id: 'white', name: 'White', hex: '#ffffff', textColor: 'dark' },
  { id: 'camo', name: 'Camo Green', hex: '#4a5d23', textColor: 'light' },
]

export const pethoodieConfig: MockupConfig = {
  id: 'pethoodie',
  name: 'Pet Hoodie',
  category: 'apparel',
  icon: 'Dog',

  canvasWidth: 340,
  canvasHeight: 310,
  aspectRatio: '340/310',  // Must match canvasWidth/canvasHeight for position consistency

  logoPrintArea: { top: 35, left: 25, width: 50, height: 40 },
  textPrintArea: { top: 30, left: 15, width: 70, height: 50 },

  defaultLogoPosition: { x: 50, y: 55 },
  defaultLogoScale: 0.7,
  defaultTextPosition: { x: 50, y: 75 },
  defaultTextScale: 0.7,

  colors: PETHOODIE_COLORS,
  defaultColorId: 'black',

  shapeComponent: PetHoodieShape,

  exportConfig: {
    drawShape: drawPetHoodieToCanvas as DrawShapeFunction,
    yOffset: 50,
    scale: 2,
  },

  features: {
    supportsRotation: true,
    multipleViews: ['front', 'back'],
  },

  renderMode: 'svg',
}
