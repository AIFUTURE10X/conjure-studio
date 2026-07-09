/**
 * lib/background-removal.ts
 * Multi-method background removal utility for transparent PNG output
 *
 * Main entry point that re-exports all methods and types.
 * Actual implementations are in bg-removal-methods.ts.
 */

import sharp from 'sharp'
import {
  removeBackgroundFloodFill,
  removeBackgroundSimple,
  removeBackgroundAI,
  removeBackgroundChromakey
} from './bg-removal-methods'

// Re-export utilities for external use
export { findNearbyNonWhiteColor, rgbToHsv } from './bg-removal-utils'

// Re-export individual methods
export {
  removeBackgroundFloodFill,
  removeBackgroundSimple,
  removeBackgroundAI,
  removeBackgroundChromakey
}

// Types
export type BackgroundRemovalMethod =
  | 'auto'
  | 'ai-local'
  | 'simple'
  | 'chromakey'
  | 'cloud'
  | 'pixian'
  | 'replicate'
  | '851-labs'
  | 'smart'
  | 'pixelcut'
  | 'photoroom'
  | 'fal'

export interface RemoveBackgroundOptions {
  method?: BackgroundRemovalMethod
  tolerance?: number // How close to white a pixel must be (0-255, default 30)
  edgeSmoothing?: boolean // Apply edge smoothing for better results
  decontaminate?: boolean // Replace white edge colors with nearby non-white colors
  chromaColor?: { r: number; g: number; b: number } // For chromakey method
}

/**
 * Main entry point - removes background using specified method
 * @param imageBase64 - Base64 encoded image (without data URL prefix)
 * @param options - Configuration options including method selection
 * @returns Base64 encoded PNG with transparent background
 */
export async function removeBackground(
  imageBase64: string,
  options: RemoveBackgroundOptions = {}
): Promise<string> {
  const { method = 'auto' } = options

  console.log(`[Background Removal] Using method: ${method}`)

  switch (method) {
    case 'ai-local':
      // AI Local disabled - causes segfault on Windows due to ONNX Runtime issues
      console.warn('[Background Removal] AI Local disabled (ONNX compatibility issue), using flood-fill method')
      return removeBackgroundFloodFill(imageBase64, options)

    case 'chromakey':
      return removeBackgroundChromakey(imageBase64, options)

    case 'simple':
      // Legacy simple method - use flood-fill instead for better results
      return removeBackgroundFloodFill(imageBase64, options)

    case 'auto':
    default:
      // Auto mode: use flood-fill for best local results
      // This preserves interior design elements while removing edge backgrounds
      console.log('[Background Removal] Auto mode using flood-fill method')
      return removeBackgroundFloodFill(imageBase64, options)
  }
}

/**
 * Checks if an image already has transparency
 * @param imageBase64 - Base64 encoded image
 * @returns true if image has any transparent pixels
 */
export async function hasTransparency(imageBase64: string): Promise<boolean> {
  try {
    const inputBuffer = Buffer.from(imageBase64, 'base64')

    const { data } = await sharp(inputBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const pixels = new Uint8ClampedArray(data)

    // Check alpha channel of each pixel
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 255) {
        return true
      }
    }

    return false
  } catch {
    return false
  }
}
