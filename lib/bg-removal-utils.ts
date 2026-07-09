/**
 * Background Removal Utilities
 *
 * Helper functions for color conversion and pixel analysis.
 * Extracted from background-removal.ts to keep files under 300 lines.
 */

/**
 * Find a nearby non-white color to replace white edge pixels
 */
export function findNearbyNonWhiteColor(
  pixels: Uint8ClampedArray,
  pixelIndex: number,
  width: number,
  height: number
): { r: number; g: number; b: number } {
  const x = (pixelIndex / 4) % width
  const y = Math.floor((pixelIndex / 4) / width)

  // Search in expanding squares around the pixel
  const searchRadius = 5
  let bestColor = { r: 0, g: 0, b: 0 }
  let foundNonWhite = false

  for (let radius = 1; radius <= searchRadius && !foundNonWhite; radius++) {
    for (let dy = -radius; dy <= radius && !foundNonWhite; dy++) {
      for (let dx = -radius; dx <= radius && !foundNonWhite; dx++) {
        // Only check perimeter of the square
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue

        const nx = x + dx
        const ny = y + dy

        // Bounds check
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue

        const ni = (ny * width + nx) * 4
        const nr = pixels[ni]
        const ng = pixels[ni + 1]
        const nb = pixels[ni + 2]
        const na = pixels[ni + 3]

        // Look for opaque, non-white pixels
        if (na > 200 && (nr < 200 || ng < 200 || nb < 200)) {
          bestColor = { r: nr, g: ng, b: nb }
          foundNonWhite = true
        }
      }
    }
  }

  // If no non-white found, return black as fallback
  return foundNonWhite ? bestColor : { r: 0, g: 0, b: 0 }
}

/**
 * Convert RGB to HSV color space
 */
export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min

  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max

  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return { h: h * 360, s, v }
}
