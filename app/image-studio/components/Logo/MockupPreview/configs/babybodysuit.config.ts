/**
 * Baby Bodysuit (Onesie) Mockup Configuration
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { BabyBodysuitShape, drawBabyBodysuitToCanvas } from '../shapes/BabyBodysuitShape'

export const BABYBODYSUIT_COLORS: ProductColor[] = [
  { id: 'white', name: 'White', hex: '#ffffff', textColor: 'dark' },
  { id: 'pink', name: 'Pink', hex: '#fce7f3', textColor: 'dark' },
  { id: 'babyblue', name: 'Baby Blue', hex: '#dbeafe', textColor: 'dark' },
  { id: 'mint', name: 'Mint', hex: '#d1fae5', textColor: 'dark' },
  { id: 'lavender', name: 'Lavender', hex: '#ede9fe', textColor: 'dark' },
  { id: 'yellow', name: 'Yellow', hex: '#fef3c7', textColor: 'dark' },
  { id: 'peach', name: 'Peach', hex: '#fed7aa', textColor: 'dark' },
  { id: 'gray', name: 'Gray', hex: '#e5e7eb', textColor: 'dark' },
  { id: 'black', name: 'Black', hex: '#1a1a1a', textColor: 'light' },
  { id: 'navy', name: 'Navy', hex: '#1e3a5f', textColor: 'light' },
  { id: 'red', name: 'Red', hex: '#dc2626', textColor: 'light' },
  { id: 'forest', name: 'Forest Green', hex: '#166534', textColor: 'light' },
]

export const babybodysuitConfig: MockupConfig = {
  id: 'babybodysuit',
  name: 'Baby Bodysuit',
  category: 'apparel',
  icon: 'Baby',

  canvasWidth: 340,
  canvasHeight: 340,
  aspectRatio: '1/1',

  logoPrintArea: { top: 15, left: 25, width: 50, height: 40 },
  textPrintArea: { top: 10, left: 10, width: 80, height: 70 },

  defaultLogoPosition: { x: 50, y: 35 },
  defaultLogoScale: 0.8,
  defaultTextPosition: { x: 50, y: 70 },
  defaultTextScale: 0.8,

  colors: BABYBODYSUIT_COLORS,
  defaultColorId: 'white',

  shapeComponent: BabyBodysuitShape,

  exportConfig: {
    drawShape: drawBabyBodysuitToCanvas as DrawShapeFunction,
    yOffset: 90,
    scale: 2,
  },

  features: {
    supportsRotation: true,
    multipleViews: ['front', 'back'],
  },

  renderMode: 'svg',
}
