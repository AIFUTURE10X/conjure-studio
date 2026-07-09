/**
 * Color Conversion Utilities
 * Shared functions for converting between hex, RGB, and RGBA color formats
 */

import type { RgbaColor } from 'react-colorful'

// Re-export the type for convenience
export type { RgbaColor }

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
 * Convert RGB values to hex color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return rgbaToHex({ r, g, b, a: 1 })
}

/**
 * Convert hex color string to RGB object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const rgba = hexToRgba(hex)
  return { r: rgba.r, g: rgba.g, b: rgba.b }
}

/**
 * Determine if a color is light (for contrast calculations)
 */
export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex)
  // Using relative luminance formula
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.5
}

/**
 * Get contrasting text color (black or white) for a background
 */
export function getTextColor(hex: string): string {
  return isLightColor(hex) ? '#000000' : '#ffffff'
}
