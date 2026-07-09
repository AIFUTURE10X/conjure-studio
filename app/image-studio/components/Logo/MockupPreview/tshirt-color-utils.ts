/**
 * TShirt Color Utilities
 *
 * Color conversion and utility functions for TShirt controls.
 * Extracted from TShirtControls.tsx to keep files under 300 lines.
 */

import type { RgbaColor } from 'react-colorful'

/**
 * Convert hex to RGBA
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
 * Convert RGBA to hex
 */
export function rgbaToHex(rgba: RgbaColor): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`
}

/**
 * Determine if text should be light or dark based on background color
 */
export function getTextColor(hex: string): 'light' | 'dark' {
  const rgba = hexToRgba(hex)
  // Calculate relative luminance
  const luminance = (0.299 * rgba.r + 0.587 * rgba.g + 0.114 * rgba.b) / 255
  return luminance > 0.5 ? 'dark' : 'light'
}

/**
 * Global CSS styles for react-colorful picker
 */
export const COLORFUL_PICKER_STYLES = `
  .custom-color-picker .react-colorful {
    width: 100%;
    height: auto;
  }
  .custom-color-picker .react-colorful__saturation {
    height: 150px;
    border-radius: 8px 8px 0 0;
    border-bottom: none;
  }
  .custom-color-picker .react-colorful__hue {
    height: 14px;
    border-radius: 0;
    margin-top: 8px;
  }
  .custom-color-picker .react-colorful__alpha {
    display: none;
  }
  .custom-color-picker .react-colorful__pointer {
    width: 20px;
    height: 20px;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
  .custom-color-picker .react-colorful__hue-pointer {
    width: 14px;
    height: 14px;
    border-radius: 50%;
  }
`
