/**
 * T-Shirt Mockup Configuration
 *
 * Defines all properties for the T-shirt mockup including colors,
 * print areas, default positions, and canvas export settings.
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { TShirtShape, drawTShirtToCanvas } from '../shapes/TShirtShape'

/**
 * T-Shirt color palette
 */
export const TSHIRT_COLORS: ProductColor[] = [
  // Neutrals
  { id: 'black', name: 'Black', hex: '#1a1a1a', textColor: 'light' },
  { id: 'white', name: 'White', hex: '#ffffff', textColor: 'dark' },
  { id: 'charcoal', name: 'Charcoal', hex: '#374151', textColor: 'light' },
  { id: 'gray', name: 'Gray', hex: '#6b7280', textColor: 'light' },
  { id: 'heather', name: 'Heather Gray', hex: '#9ca3af', textColor: 'dark' },

  // Blues
  { id: 'navy', name: 'Navy', hex: '#1e3a5f', textColor: 'light' },
  { id: 'royal', name: 'Royal Blue', hex: '#2563eb', textColor: 'light' },
  { id: 'sky', name: 'Sky Blue', hex: '#38bdf8', textColor: 'dark' },

  // Reds
  { id: 'red', name: 'Red', hex: '#dc2626', textColor: 'light' },
  { id: 'burgundy', name: 'Burgundy', hex: '#7f1d1d', textColor: 'light' },
  { id: 'coral', name: 'Coral', hex: '#f87171', textColor: 'dark' },

  // Greens
  { id: 'forest', name: 'Forest Green', hex: '#166534', textColor: 'light' },
  { id: 'olive', name: 'Olive', hex: '#65a30d', textColor: 'dark' },
  { id: 'teal', name: 'Teal', hex: '#0d9488', textColor: 'light' },

  // Others
  { id: 'purple', name: 'Purple', hex: '#7c3aed', textColor: 'light' },
  { id: 'pink', name: 'Pink', hex: '#ec4899', textColor: 'light' },
  { id: 'orange', name: 'Orange', hex: '#ea580c', textColor: 'light' },
  { id: 'yellow', name: 'Yellow', hex: '#facc15', textColor: 'dark' },
]

/**
 * T-Shirt mockup configuration
 */
export const tshirtConfig: MockupConfig = {
  // Identity
  id: 'tshirt',
  name: 'T-Shirt',
  category: 'apparel',
  icon: 'Shirt',

  // Dimensions for export canvas (matches viewBox "-40 115 480 335")
  canvasWidth: 480,
  canvasHeight: 335,
  aspectRatio: '480/335',  // Must match canvasWidth/canvasHeight for position consistency

  // Print areas (percentage of container)
  logoPrintArea: { top: 18, left: 25, width: 50, height: 45 },
  textPrintArea: { top: 10, left: 10, width: 80, height: 80 },

  // Default positions
  defaultLogoPosition: { x: 50, y: 35 },
  defaultLogoScale: 1,
  defaultTextPosition: { x: 50, y: 78 },
  defaultTextScale: 1,

  // Colors
  colors: TSHIRT_COLORS,
  defaultColorId: 'black',

  // Rendering
  shapeComponent: TShirtShape,

  // Export
  exportConfig: {
    drawShape: drawTShirtToCanvas as DrawShapeFunction,
    yOffset: 100,
    scale: 2,
  },

  // Features
  features: {
    supportsRotation: true,
    multipleViews: ['front', 'back'],
  },

  // Photo-based rendering (when photos are available)
  // Set renderMode to 'photo' after generating photos via /api/generate-mockup-photos
  photoAssets: {
    baseUrl: '/mockups/tshirt/',
    colorMap: {
      // Neutrals
      'black': 'black.png',
      'white': 'white.png',
      'charcoal': 'charcoal.png',
      'gray': 'gray.png',
      'heather': 'heather.png',
      // Blues
      'navy': 'navy.png',
      'royal': 'royal.png',
      'sky': 'sky.png',
      // Reds
      'red': 'red.png',
      'burgundy': 'burgundy.png',
      'coral': 'coral.png',
      // Greens
      'forest': 'forest.png',
      'olive': 'olive.png',
      'teal': 'teal.png',
      // Others
      'purple': 'purple.png',
      'pink': 'pink.png',
      'orange': 'orange.png',
      'yellow': 'yellow.png',
    },
    fallbackPhoto: 'white.png',
  },
  // Switch to 'photo' once photos are generated
  renderMode: 'svg',
}
