/**
 * Phone Case Mockup Configuration
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { PhoneCaseShape, drawPhoneCaseToCanvas } from '../shapes/PhoneCaseShape'

export const PHONE_CASE_COLORS: ProductColor[] = [
  // Neutrals
  { id: 'black', name: 'Black', hex: '#1a1a1a', textColor: 'light' },
  { id: 'white', name: 'White', hex: '#ffffff', textColor: 'dark' },
  { id: 'gray', name: 'Space Gray', hex: '#4b5563', textColor: 'light' },
  { id: 'clear', name: 'Clear/Frost', hex: '#e5e7eb', textColor: 'dark' },

  // Blues
  { id: 'navy', name: 'Navy', hex: '#1e3a5f', textColor: 'light' },
  { id: 'blue', name: 'Pacific Blue', hex: '#0ea5e9', textColor: 'light' },
  { id: 'midnight', name: 'Midnight', hex: '#1e293b', textColor: 'light' },

  // Reds/Pinks
  { id: 'red', name: 'Product Red', hex: '#dc2626', textColor: 'light' },
  { id: 'pink', name: 'Pink', hex: '#ec4899', textColor: 'light' },
  { id: 'coral', name: 'Coral', hex: '#f97316', textColor: 'light' },

  // Greens
  { id: 'green', name: 'Alpine Green', hex: '#166534', textColor: 'light' },
  { id: 'mint', name: 'Mint', hex: '#6ee7b7', textColor: 'dark' },

  // Others
  { id: 'purple', name: 'Deep Purple', hex: '#7c3aed', textColor: 'light' },
  { id: 'gold', name: 'Gold', hex: '#d4a574', textColor: 'dark' },
  { id: 'silver', name: 'Silver', hex: '#cbd5e1', textColor: 'dark' },
]

export const phoneCaseConfig: MockupConfig = {
  id: 'phone-case',
  name: 'Phone Case',
  category: 'accessories',
  icon: 'Smartphone',

  canvasWidth: 250,
  canvasHeight: 500,
  aspectRatio: '1/2',

  // Print area below camera module
  logoPrintArea: { top: 35, left: 15, width: 70, height: 45 },
  textPrintArea: { top: 30, left: 10, width: 80, height: 55 },

  defaultLogoPosition: { x: 50, y: 55 },
  defaultLogoScale: 0.8,
  defaultTextPosition: { x: 50, y: 75 },
  defaultTextScale: 0.8,

  colors: PHONE_CASE_COLORS,
  defaultColorId: 'black',

  shapeComponent: PhoneCaseShape,

  exportConfig: {
    drawShape: drawPhoneCaseToCanvas as DrawShapeFunction,
    yOffset: 0,
    scale: 2,
  },

  features: {
    supportsRotation: true,
    supportsPerspective: true,
  },

  photoAssets: {
    baseUrl: '/mockups/phone-case/',
    colorMap: {
      'black': 'black.png',
      'white': 'white.png',
      'clear': 'clear.png',
    },
    fallbackPhoto: 'black.png',
  },
  renderMode: 'svg',
}
