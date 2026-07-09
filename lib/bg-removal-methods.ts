/**
 * Background Removal Methods
 *
 * Individual background removal implementations:
 * - Flood-fill based (preserves interior elements)
 * - Simple threshold-based
 * - AI-based (using imgly)
 * - Chromakey (for solid color backgrounds)
 *
 * Extracted from background-removal.ts to keep files under 300 lines.
 */

import sharp from 'sharp'
import { findNearbyNonWhiteColor, rgbToHsv } from './bg-removal-utils'
import type { RemoveBackgroundOptions } from './background-removal'

/**
 * Flood-fill based background removal - only removes white connected to edges
 * This preserves interior light-colored elements that are part of the design
 */
export async function removeBackgroundFloodFill(
  imageBase64: string,
  options: RemoveBackgroundOptions = {}
): Promise<string> {
  const { tolerance = 15 } = options // Lower tolerance for more precision

  try {
    const inputBuffer = Buffer.from(imageBase64, 'base64')

    const { data, info } = await sharp(inputBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const pixels = new Uint8ClampedArray(data)
    const { width, height } = info
    const threshold = 255 - tolerance

    // Track which pixels to make transparent
    const toRemove = new Set<number>()
    const visited = new Set<number>()

    // Check if pixel is "white enough" to be background
    const isWhite = (idx: number) => {
      const r = pixels[idx]
      const g = pixels[idx + 1]
      const b = pixels[idx + 2]
      return r > threshold && g > threshold && b > threshold
    }

    // Flood fill from a starting point
    const floodFill = (startX: number, startY: number) => {
      const stack: [number, number][] = [[startX, startY]]

      while (stack.length > 0) {
        const [x, y] = stack.pop()!
        if (x < 0 || x >= width || y < 0 || y >= height) continue

        const pixelIndex = (y * width + x) * 4
        if (visited.has(pixelIndex)) continue
        visited.add(pixelIndex)

        if (isWhite(pixelIndex)) {
          toRemove.add(pixelIndex)
          // Add neighbors (4-connected for speed)
          stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
        }
      }
    }

    // Start flood fill from all edges
    for (let x = 0; x < width; x++) {
      floodFill(x, 0)           // Top edge
      floodFill(x, height - 1)  // Bottom edge
    }
    for (let y = 0; y < height; y++) {
      floodFill(0, y)           // Left edge
      floodFill(width - 1, y)   // Right edge
    }

    // Apply transparency to marked pixels
    for (const idx of toRemove) {
      pixels[idx + 3] = 0 // Set alpha to 0
    }

    // Apply edge smoothing for anti-aliased edges
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] === 0) continue // Skip transparent

      // Check if this pixel borders a transparent one
      const x = (i / 4) % width
      const y = Math.floor((i / 4) / width)
      let bordersTrans = false

      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const ni = (ny * width + nx) * 4
          if (pixels[ni + 3] === 0) {
            bordersTrans = true
            break
          }
        }
      }

      // If bordering transparent and somewhat white, apply partial transparency
      if (bordersTrans) {
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2]
        const brightness = (r + g + b) / 3
        if (brightness > 200) {
          // Fade based on how white it is
          const alpha = Math.round(((255 - brightness) / 55) * 255)
          pixels[i + 3] = Math.min(pixels[i + 3], Math.max(alpha, 50))
        }
      }
    }

    const outputBuffer = await sharp(Buffer.from(pixels), {
      raw: { width, height, channels: 4 }
    })
      .png({ compressionLevel: 6 })
      .toBuffer()

    console.log(`[Background Removal FloodFill] Removed ${toRemove.size} background pixels`)
    return outputBuffer.toString('base64')
  } catch (error) {
    console.error('[Background Removal FloodFill] Error:', error)
    throw error
  }
}

/**
 * Simple/Fast background removal using color threshold (legacy method)
 */
export async function removeBackgroundSimple(
  imageBase64: string,
  options: RemoveBackgroundOptions = {}
): Promise<string> {
  const { tolerance = 15, edgeSmoothing = true, decontaminate = true } = options

  try {
    const inputBuffer = Buffer.from(imageBase64, 'base64')

    // Get image metadata first
    const metadata = await sharp(inputBuffer).metadata()
    const { width = 0, height = 0 } = metadata

    if (!width || !height) {
      throw new Error('Could not determine image dimensions')
    }

    // Convert to raw RGBA pixel data
    const { data, info } = await sharp(inputBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const pixels = new Uint8ClampedArray(data)
    const threshold = 255 - tolerance

    // Pass 1: Process each pixel for transparency
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]

      // Check if pixel is white/near-white
      if (r > threshold && g > threshold && b > threshold) {
        // Make fully transparent
        pixels[i + 3] = 0
      } else if (edgeSmoothing) {
        // For edge pixels (somewhat white), apply partial transparency
        const avgBrightness = (r + g + b) / 3
        if (avgBrightness > threshold - 30) {
          // Calculate alpha based on how close to white
          const alpha = Math.round(((255 - avgBrightness) / (255 - threshold + 30)) * 255)
          pixels[i + 3] = Math.min(pixels[i + 3], alpha)
        }
      }
    }

    // Pass 2: Color decontamination - replace white edge colors
    if (decontaminate) {
      for (let i = 0; i < pixels.length; i += 4) {
        const alpha = pixels[i + 3]

        // Only process semi-transparent edge pixels
        if (alpha > 0 && alpha < 250) {
          const r = pixels[i]
          const g = pixels[i + 1]
          const b = pixels[i + 2]

          // If pixel color is still whitish, replace with nearby non-white color
          if (r > 180 && g > 180 && b > 180) {
            const nearbyColor = findNearbyNonWhiteColor(pixels, i, info.width, info.height)
            pixels[i] = nearbyColor.r
            pixels[i + 1] = nearbyColor.g
            pixels[i + 2] = nearbyColor.b
          }
        }
      }
    }

    // Convert back to PNG with transparency
    const outputBuffer = await sharp(Buffer.from(pixels), {
      raw: { width: info.width, height: info.height, channels: 4 }
    })
      .png({ compressionLevel: 6 })
      .toBuffer()

    return outputBuffer.toString('base64')
  } catch (error) {
    console.error('[Background Removal Simple] Error:', error)
    throw error
  }
}

// AI method moved to bg-removal-ai.ts
export { removeBackgroundAI } from './bg-removal-ai'

/**
 * Chromakey background removal - removes specific color (default: magenta)
 */
export async function removeBackgroundChromakey(
  imageBase64: string,
  options: RemoveBackgroundOptions = {}
): Promise<string> {
  const {
    chromaColor = { r: 255, g: 0, b: 255 }, // Default to magenta
    tolerance = 40
  } = options

  try {
    console.log('[Background Removal Chromakey] Starting chromakey removal...')

    const inputBuffer = Buffer.from(imageBase64, 'base64')

    const { data, info } = await sharp(inputBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const pixels = new Uint8ClampedArray(data)

    // Get HSV of the chroma color for better matching
    const chromaHsv = rgbToHsv(chromaColor.r, chromaColor.g, chromaColor.b)
    const hueTolerance = tolerance

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]

      const pixelHsv = rgbToHsv(r, g, b)

      // Calculate hue difference (accounting for circular nature)
      let hueDiff = Math.abs(pixelHsv.h - chromaHsv.h)
      if (hueDiff > 180) hueDiff = 360 - hueDiff

      // Check if pixel matches chroma color
      if (hueDiff < hueTolerance && pixelHsv.s > 0.3 && pixelHsv.v > 0.3) {
        const matchStrength = 1 - (hueDiff / hueTolerance)
        const satMatch = Math.min(1, pixelHsv.s / chromaHsv.s)
        const alpha = Math.round((1 - matchStrength * satMatch) * 255)
        pixels[i + 3] = Math.min(pixels[i + 3], alpha)
      }
    }

    const outputBuffer = await sharp(Buffer.from(pixels), {
      raw: { width: info.width, height: info.height, channels: 4 }
    })
      .png({ compressionLevel: 6 })
      .toBuffer()

    console.log('[Background Removal Chromakey] Completed successfully')
    return outputBuffer.toString('base64')
  } catch (error) {
    console.error('[Background Removal Chromakey] Error:', error)
    throw error
  }
}
