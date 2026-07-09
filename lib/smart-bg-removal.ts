/**
 * lib/smart-bg-removal.ts
 * Smart background removal that preserves ALL logo content including text
 *
 * Unlike AI-based removal which tries to detect "subjects", this method:
 * 1. Detects the actual background color from the image edges
 * 2. Removes only pixels matching that background color
 * 3. Preserves ALL content including text that may be same color as background
 */

import sharp from 'sharp'
import {
  colorDistance,
  sampleEdgeColors,
  groupSimilarColors,
  type ColorSample
} from './smart-bg-utils'

export interface SmartRemovalOptions {
  /** Color tolerance for background matching (0-100, default 25) */
  tolerance?: number
  /** How many pixels deep to sample from edges (default 10) */
  sampleDepth?: number
  /** Apply edge smoothing for anti-aliased results */
  edgeSmoothing?: boolean
}

/**
 * Smart background removal that detects and removes actual background color
 * Preserves ALL logo content including text
 */
export async function removeBackgroundSmart(
  imageBase64: string,
  options: SmartRemovalOptions = {}
): Promise<string> {
  const {
    tolerance = 25,
    sampleDepth = 15,
    edgeSmoothing = false  // Disabled - causes artifacts, flood-fill produces clean edges
  } = options

  try {
    console.log('[Smart BG Removal] Starting smart background detection...')

    const inputBuffer = Buffer.from(imageBase64, 'base64')

    const { data, info } = await sharp(inputBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const pixels = new Uint8ClampedArray(data)
    const { width, height } = info

    // Step 1: Sample colors from edges
    console.log('[Smart BG Removal] Sampling edge colors...')
    const edgeColors = sampleEdgeColors(pixels, width, height, sampleDepth)

    // Step 2: Group similar colors (handles gradients)
    const colorGroups = groupSimilarColors(edgeColors, 40)

    if (colorGroups.length === 0) {
      console.warn('[Smart BG Removal] No edge colors detected, returning original')
      return imageBase64
    }

    // The most common edge color(s) are likely the background
    const bgColors = colorGroups.slice(0, 3) // Top 3 color groups
    console.log('[Smart BG Removal] Detected background colors:', bgColors.map(c => `rgb(${c.r},${c.g},${c.b}) [${c.count}]`))

    // Check if background is dark and adjust settings accordingly
    const avgBrightness = bgColors.reduce((sum, c) => sum + (c.r + c.g + c.b) / 3, 0) / bgColors.length

    // For dark backgrounds, use more aggressive settings
    let effectiveTolerance = tolerance
    let effectiveBgColors = bgColors

    if (avgBrightness < 80) {
      // Dark background detected - increase tolerance and use more color groups
      effectiveTolerance = Math.max(tolerance, 40)
      effectiveBgColors = colorGroups.slice(0, 5) // Use top 5 colors instead of 3
      console.log(`[Smart BG Removal] Dark background detected (brightness: ${avgBrightness.toFixed(0)}), using enhanced settings: tolerance=${effectiveTolerance}, colors=${effectiveBgColors.length}`)
    } else if (avgBrightness > 200) {
      // Light/white background detected - increase tolerance for off-white variations
      effectiveTolerance = Math.max(tolerance, 35)
      effectiveBgColors = colorGroups.slice(0, 5) // Use top 5 colors instead of 3
      console.log(`[Smart BG Removal] Light background detected (brightness: ${avgBrightness.toFixed(0)}), using enhanced settings: tolerance=${effectiveTolerance}, colors=${effectiveBgColors.length}`)
    }

    // Step 3: Flood fill from edges, removing only background colors
    const toRemove = new Set<number>()
    const visited = new Set<number>()

    // Scaled tolerance based on input (use effectiveTolerance for dark backgrounds)
    const colorThreshold = effectiveTolerance * 3 // Scale to reasonable range

    const isBackgroundColor = (idx: number): boolean => {
      const pixelColor = {
        r: pixels[idx],
        g: pixels[idx + 1],
        b: pixels[idx + 2]
      }

      // Check if pixel matches any of the background colors (use effectiveBgColors for dark backgrounds)
      for (const bgColor of effectiveBgColors) {
        if (colorDistance(pixelColor, bgColor) < colorThreshold) {
          return true
        }
      }
      return false
    }

    // Flood fill from edges
    const floodFill = (startX: number, startY: number) => {
      const stack: [number, number][] = [[startX, startY]]

      while (stack.length > 0) {
        const [x, y] = stack.pop()!
        if (x < 0 || x >= width || y < 0 || y >= height) continue

        const pixelIndex = (y * width + x) * 4
        if (visited.has(pixelIndex)) continue
        visited.add(pixelIndex)

        if (isBackgroundColor(pixelIndex)) {
          toRemove.add(pixelIndex)
          // Add neighbors (4-connected)
          stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
        }
      }
    }

    console.log('[Smart BG Removal] Running flood fill from edges...')

    // Start flood fill from all edges
    for (let x = 0; x < width; x++) {
      floodFill(x, 0)           // Top edge
      floodFill(x, height - 1)  // Bottom edge
    }
    for (let y = 0; y < height; y++) {
      floodFill(0, y)           // Left edge
      floodFill(width - 1, y)   // Right edge
    }

    // Step 4: Apply transparency
    for (const idx of toRemove) {
      pixels[idx + 3] = 0 // Set alpha to 0
    }

    // Step 5: Edge smoothing for anti-aliased results (CONSERVATIVE)
    if (edgeSmoothing) {
      console.log('[Smart BG Removal] Applying edge smoothing...')

      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] === 0) continue // Skip fully transparent

        const x = (i / 4) % width
        const y = Math.floor((i / 4) / width)

        // Count transparent neighbors (only immediate 4-connected)
        let transparentNeighbors = 0
        const immediateNeighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]]

        for (const [dx, dy] of immediateNeighbors) {
          const nx = x + dx, ny = y + dy
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const ni = (ny * width + nx) * 4
            if (pixels[ni + 3] === 0) {
              transparentNeighbors++
            }
          }
        }

        // Only apply smoothing if pixel is VERY close to background AND has multiple transparent neighbors
        // This is much more conservative than before
        if (transparentNeighbors >= 2) {
          const pixelColor = { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] }

          for (const bgColor of bgColors) {
            const dist = colorDistance(pixelColor, bgColor)
            // Only smooth pixels that are within 50% of the threshold (very close to background)
            if (dist < colorThreshold * 0.5) {
              // Very light smoothing - only reduce alpha slightly for true edge pixels
              const alphaReduction = (1 - dist / (colorThreshold * 0.5)) * 0.3
              const newAlpha = Math.round(pixels[i + 3] * (1 - alphaReduction))
              pixels[i + 3] = Math.max(50, newAlpha) // Keep minimum alpha of 50 to avoid artifacts
              break
            }
          }
        }
      }
    }

    // Step 6: Cleanup pass - remove isolated semi-transparent pixels (artifacts)
    console.log('[Smart BG Removal] Cleaning up artifacts...')
    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3]
      // Skip fully opaque or fully transparent
      if (alpha === 255 || alpha === 0) continue

      const x = (i / 4) % width
      const y = Math.floor((i / 4) / width)

      // Count opaque neighbors
      let opaqueNeighbors = 0
      let transparentNeighbors = 0
      const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]

      for (const [dx, dy] of neighbors) {
        const nx = x + dx, ny = y + dy
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const ni = (ny * width + nx) * 4
          if (pixels[ni + 3] === 255) opaqueNeighbors++
          if (pixels[ni + 3] === 0) transparentNeighbors++
        }
      }

      // If semi-transparent pixel is mostly surrounded by opaque pixels, make it opaque
      if (opaqueNeighbors >= 5) {
        pixels[i + 3] = 255
      }
      // If semi-transparent pixel is mostly surrounded by transparent pixels, make it transparent
      else if (transparentNeighbors >= 5) {
        pixels[i + 3] = 0
      }
    }

    const outputBuffer = await sharp(Buffer.from(pixels), {
      raw: { width, height, channels: 4 }
    })
      .png({ compressionLevel: 6 })
      .toBuffer()

    console.log(`[Smart BG Removal] Complete! Removed ${toRemove.size} background pixels`)
    return outputBuffer.toString('base64')
  } catch (error) {
    console.error('[Smart BG Removal] Error:', error)
    throw error
  }
}

/**
 * Check if smart removal is suitable for an image
 * (i.e., if it has a detectable solid/gradient background)
 */
export async function canUseSmartRemoval(imageBase64: string): Promise<boolean> {
  try {
    const inputBuffer = Buffer.from(imageBase64, 'base64')

    const { data, info } = await sharp(inputBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const pixels = new Uint8ClampedArray(data)
    const { width, height } = info

    // Sample edge colors
    const edgeColors = sampleEdgeColors(pixels, width, height, 5)
    const colorGroups = groupSimilarColors(edgeColors, 40)

    // If the top color group accounts for >50% of edge pixels, smart removal will work well
    if (colorGroups.length > 0) {
      const totalSamples = edgeColors.reduce((sum, c) => sum + c.count, 0)
      const topGroupPercent = colorGroups[0].count / totalSamples
      return topGroupPercent > 0.3 // At least 30% of edges are similar color
    }

    return false
  } catch {
    return false
  }
}
