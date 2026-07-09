/**
 * Color Utility Functions
 *
 * Helper functions for color conversion between hex, RGB, and RGBA formats.
 * Used by sidebar color pickers.
 */

import type { RgbaColor } from 'react-colorful'

/**
 * Convert hex color string to RGBA object
 */
export function hexToRgba(hex: string): RgbaColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: 1
  } : { r: 255, g: 255, b: 255, a: 1 }
}

/**
 * Convert RGBA object to hex color string
 */
export function rgbaToHex(rgba: RgbaColor): string {
  return '#' + [rgba.r, rgba.g, rgba.b].map(x => {
    const hex = Math.max(0, Math.min(255, x)).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

/**
 * Convert RGB values to hex color string (legacy support)
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return rgbaToHex({ r, g, b, a: 1 })
}

/**
 * Convert hex to RGB object (legacy support)
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const rgba = hexToRgba(hex)
  return { r: rgba.r, g: rgba.g, b: rgba.b }
}

/**
 * Quick color presets for the color picker
 */
export const QUICK_COLORS = [
  '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00',
  '#ff00ff', '#00ffff', '#ffa500', '#800080', '#ffc0cb', '#808080'
]
