/**
 * Custom Upload Mockup Configuration
 *
 * Allows users to upload their own product photo and place logos on it.
 * Full canvas is available for logo placement.
 */

import type { MockupConfig, ProductColor, DrawShapeFunction } from '../generic/mockup-types'
import { CustomUploadShape, drawCustomUploadToCanvas } from '../shapes/CustomUploadShape'

export const CUSTOM_UPLOAD_COLORS: ProductColor[] = [
  { id: 'default', name: 'Default', hex: '#374151', textColor: 'light' },
]

export const customUploadConfig: MockupConfig = {
  id: 'custom-upload',
  name: 'Custom Upload',
  category: 'other',
  icon: 'Upload',

  canvasWidth: 400,
  canvasHeight: 400,
  aspectRatio: '1/1',

  // Full canvas is available for logo placement
  logoPrintArea: { top: 5, left: 5, width: 90, height: 90 },
  textPrintArea: { top: 5, left: 5, width: 90, height: 90 },

  defaultLogoPosition: { x: 50, y: 50 },
  defaultLogoScale: 1,
  defaultTextPosition: { x: 50, y: 80 },
  defaultTextScale: 1,

  colors: CUSTOM_UPLOAD_COLORS,
  defaultColorId: 'default',

  shapeComponent: CustomUploadShape,

  exportConfig: {
    drawShape: drawCustomUploadToCanvas as DrawShapeFunction,
    scale: 2,
  },

  features: {
    supportsRotation: true,
  },

  // Custom upload uses uploaded images, not photo assets
  renderMode: 'svg',
}
