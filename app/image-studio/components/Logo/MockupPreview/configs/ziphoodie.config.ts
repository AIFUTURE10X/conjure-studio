/**
 * Zip Hoodie Mockup Configuration
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { ZipHoodieShape, drawZipHoodieToCanvas } from '../shapes/ZipHoodieShape'

export const ZIPHOODIE_COLORS: ProductColor[] = [
  { id: 'black', name: 'Black', hex: '#1a1a1a', textColor: 'light' },
  { id: 'charcoal', name: 'Charcoal', hex: '#374151', textColor: 'light' },
  { id: 'gray', name: 'Gray', hex: '#6b7280', textColor: 'light' },
  { id: 'heather', name: 'Heather Gray', hex: '#9ca3af', textColor: 'dark' },
  { id: 'white', name: 'White', hex: '#ffffff', textColor: 'dark' },
  { id: 'navy', name: 'Navy', hex: '#1e3a5f', textColor: 'light' },
  { id: 'royal', name: 'Royal Blue', hex: '#2563eb', textColor: 'light' },
  { id: 'red', name: 'Red', hex: '#dc2626', textColor: 'light' },
  { id: 'burgundy', name: 'Burgundy', hex: '#7f1d1d', textColor: 'light' },
  { id: 'forest', name: 'Forest Green', hex: '#166534', textColor: 'light' },
  { id: 'olive', name: 'Olive', hex: '#65a30d', textColor: 'dark' },
  { id: 'purple', name: 'Purple', hex: '#7c3aed', textColor: 'light' },
  { id: 'pink', name: 'Pink', hex: '#ec4899', textColor: 'light' },
  { id: 'orange', name: 'Orange', hex: '#ea580c', textColor: 'light' },
]

export const ziphoodieConfig: MockupConfig = {
  id: 'ziphoodie',
  name: 'Zip Hoodie',
  category: 'apparel',
  icon: 'Shirt',

  canvasWidth: 440,
  canvasHeight: 420,
  aspectRatio: '440/420',  // Must match canvasWidth/canvasHeight for position consistency

  logoPrintArea: { top: 25, left: 12, width: 35, height: 35 },
  textPrintArea: { top: 20, left: 10, width: 80, height: 50 },

  defaultLogoPosition: { x: 30, y: 45 },
  defaultLogoScale: 0.8,
  defaultTextPosition: { x: 50, y: 75 },
  defaultTextScale: 0.9,

  colors: ZIPHOODIE_COLORS,
  defaultColorId: 'black',

  shapeComponent: ZipHoodieShape,

  exportConfig: {
    drawShape: drawZipHoodieToCanvas as DrawShapeFunction,
    yOffset: 40,
    scale: 2,
  },

  features: {
    supportsRotation: true,
    multipleViews: ['front', 'back'],
  },

  renderMode: 'svg',
}
