/**
 * Tank Top Mockup Configuration
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { TankTopShape, drawTankTopToCanvas } from '../shapes/TankTopShape'

export const TANKTOP_COLORS: ProductColor[] = [
  { id: 'black', name: 'Black', hex: '#1a1a1a', textColor: 'light' },
  { id: 'white', name: 'White', hex: '#ffffff', textColor: 'dark' },
  { id: 'charcoal', name: 'Charcoal', hex: '#374151', textColor: 'light' },
  { id: 'gray', name: 'Gray', hex: '#6b7280', textColor: 'light' },
  { id: 'heather', name: 'Heather Gray', hex: '#9ca3af', textColor: 'dark' },
  { id: 'navy', name: 'Navy', hex: '#1e3a5f', textColor: 'light' },
  { id: 'royal', name: 'Royal Blue', hex: '#2563eb', textColor: 'light' },
  { id: 'sky', name: 'Sky Blue', hex: '#38bdf8', textColor: 'dark' },
  { id: 'red', name: 'Red', hex: '#dc2626', textColor: 'light' },
  { id: 'burgundy', name: 'Burgundy', hex: '#7f1d1d', textColor: 'light' },
  { id: 'forest', name: 'Forest Green', hex: '#166534', textColor: 'light' },
  { id: 'olive', name: 'Olive', hex: '#65a30d', textColor: 'dark' },
  { id: 'purple', name: 'Purple', hex: '#7c3aed', textColor: 'light' },
  { id: 'pink', name: 'Pink', hex: '#ec4899', textColor: 'light' },
  { id: 'orange', name: 'Orange', hex: '#ea580c', textColor: 'light' },
  { id: 'yellow', name: 'Yellow', hex: '#facc15', textColor: 'dark' },
]

export const tanktopConfig: MockupConfig = {
  id: 'tanktop',
  name: 'Tank Top',
  category: 'apparel',
  icon: 'Shirt',

  canvasWidth: 400,
  canvasHeight: 360,
  aspectRatio: '400/360',  // Must match canvasWidth/canvasHeight for position consistency

  logoPrintArea: { top: 18, left: 25, width: 50, height: 45 },
  textPrintArea: { top: 10, left: 10, width: 80, height: 80 },

  defaultLogoPosition: { x: 50, y: 35 },
  defaultLogoScale: 1,
  defaultTextPosition: { x: 50, y: 78 },
  defaultTextScale: 1,

  colors: TANKTOP_COLORS,
  defaultColorId: 'black',

  shapeComponent: TankTopShape,

  exportConfig: {
    drawShape: drawTankTopToCanvas as DrawShapeFunction,
    yOffset: 100,
    scale: 2,
  },

  features: {
    supportsRotation: true,
    multipleViews: ['front', 'back'],
  },

  renderMode: 'svg',
}
