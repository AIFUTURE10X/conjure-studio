/**
 * Smart Background Removal Utilities
 *
 * Color sampling and grouping functions for smart background detection.
 * Extracted from smart-bg-removal.ts to keep files under 300 lines.
 */

export interface ColorSample {
  r: number
  g: number
  b: number
  count: number
}

/**
 * Calculate color distance between two RGB colors
 * Uses weighted Euclidean distance for better perceptual matching
 */
export function colorDistance(
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number }
): number {
  const rDiff = c1.r - c2.r
  const gDiff = c1.g - c2.g
  const bDiff = c1.b - c2.b
  // Human eye is more sensitive to green, less to blue
  return Math.sqrt(2 * rDiff * rDiff + 4 * gDiff * gDiff + 3 * bDiff * bDiff)
}

/**
 * Sample colors from the edges of the image to detect background
 */
export function sampleEdgeColors(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  sampleDepth: number = 5
): ColorSample[] {
  const colorCounts = new Map<string, ColorSample>()

  const addSample = (idx: number) => {
    const key = `${pixels[idx]},${pixels[idx + 1]},${pixels[idx + 2]}`
    const existing = colorCounts.get(key)
    if (existing) {
      existing.count++
    } else {
      colorCounts.set(key, {
        r: pixels[idx],
        g: pixels[idx + 1],
        b: pixels[idx + 2],
        count: 1
      })
    }
  }

  // Sample from all four edges
  for (let depth = 0; depth < sampleDepth; depth++) {
    // Top edge
    for (let x = 0; x < width; x++) {
      addSample((depth * width + x) * 4)
    }

    // Bottom edge
    for (let x = 0; x < width; x++) {
      const y = height - 1 - depth
      addSample((y * width + x) * 4)
    }

    // Left edge
    for (let y = sampleDepth; y < height - sampleDepth; y++) {
      addSample((y * width + depth) * 4)
    }

    // Right edge
    for (let y = sampleDepth; y < height - sampleDepth; y++) {
      const x = width - 1 - depth
      addSample((y * width + x) * 4)
    }
  }

  // Sort by count and return top colors
  return Array.from(colorCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

/**
 * Group similar colors together to handle gradients
 */
export function groupSimilarColors(colors: ColorSample[], threshold: number = 30): ColorSample[] {
  const groups: ColorSample[] = []

  for (const color of colors) {
    let foundGroup = false
    for (const group of groups) {
      if (colorDistance(color, group) < threshold) {
        // Add to existing group (weighted average)
        const totalCount = group.count + color.count
        group.r = Math.round((group.r * group.count + color.r * color.count) / totalCount)
        group.g = Math.round((group.g * group.count + color.g * color.count) / totalCount)
        group.b = Math.round((group.b * group.count + color.b * color.count) / totalCount)
        group.count = totalCount
        foundGroup = true
        break
      }
    }
    if (!foundGroup) {
      groups.push({ ...color })
    }
  }

  return groups.sort((a, b) => b.count - a.count)
}
