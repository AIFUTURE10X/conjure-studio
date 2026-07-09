/**
 * lib/replicate-bg-removal.ts
 * AI-powered background removal using Replicate models
 *
 * Uses BRIA RMBG 2.0 with preserve_alpha: true for 256 levels of transparency.
 * This is critical for preserving text edges and fine details in logos.
 *
 * Cost: ~$0.01-0.02 per image
 * Speed: 1-3 seconds
 */

import Replicate from "replicate"

/**
 * Detect MIME type from base64 magic bytes
 * Important: Sending wrong MIME type could affect model performance
 */
function detectMimeType(base64: string): string {
  // Check for JPEG magic bytes (starts with /9j/)
  if (base64.startsWith('/9j/')) return 'image/jpeg'
  // Check for PNG magic bytes (starts with iVBOR)
  if (base64.startsWith('iVBOR')) return 'image/png'
  // Check for WebP magic bytes (starts with UklGR)
  if (base64.startsWith('UklGR')) return 'image/webp'
  // Check for GIF magic bytes (starts with R0lG)
  if (base64.startsWith('R0lG')) return 'image/gif'
  // Default to PNG for safety
  return 'image/png'
}

/**
 * Extract URL from Replicate output (handles various output formats)
 */
function extractOutputUrl(output: unknown): string {
  if (typeof output === 'string') {
    return output
  }

  if (output && typeof output === 'object') {
    // Handle FileOutput or other object types from newer Replicate SDK
    const outputObj = output as { url?: () => string } | { toString?: () => string }
    if ('url' in outputObj && typeof outputObj.url === 'function') {
      return outputObj.url()
    }
    if (output.toString && output.toString() !== '[object Object]') {
      return output.toString()
    }
    // Try to get the URL from the object directly
    const maybeUrl = (output as Record<string, unknown>).url || (output as Record<string, unknown>)[0]
    if (typeof maybeUrl === 'string') {
      return maybeUrl
    }
  }

  throw new Error("Could not extract URL from Replicate output")
}

/**
 * Fetch result image and convert to base64
 */
async function fetchResultAsBase64(outputUrl: string): Promise<string> {
  const response = await fetch(outputUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch result image: ${response.status}`)
  }

  const buffer = await response.arrayBuffer()
  return Buffer.from(buffer).toString('base64')
}

/**
 * Try 851-labs/background-remover model
 * Very cheap (~$0.00055/run), has threshold control for edge quality
 * Uses transparent-background python package
 */
async function try851Labs(replicate: Replicate, imageBase64: string): Promise<string> {
  console.log("[Replicate BG Removal] ========================================")
  console.log("[Replicate BG Removal] === USING 851-LABS BACKGROUND REMOVER ===")
  console.log("[Replicate BG Removal] ========================================")

  const mimeType = detectMimeType(imageBase64)
  console.log(`[Replicate BG Removal] Input image MIME type: ${mimeType}`)
  console.log(`[Replicate BG Removal] Input base64 length: ${imageBase64.length}`)

  const output = await replicate.run(
    "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc",
    {
      input: {
        image: `data:${mimeType};base64,${imageBase64}`,
        background_type: "rgba",
        format: "png",
        threshold: 0 // Default threshold for best edge detection
      }
    }
  )

  console.log("[Replicate BG Removal] === 851-LABS COMPLETED SUCCESSFULLY ===")
  const outputUrl = extractOutputUrl(output)
  console.log("[Replicate BG Removal] 851-labs output URL:", outputUrl)

  return fetchResultAsBase64(outputUrl)
}

/**
 * Try Recraft AI model - fallback option
 */
async function tryRecraftAI(replicate: Replicate, imageBase64: string): Promise<string> {
  console.log("[Replicate BG Removal] Trying Recraft AI model (fallback)...")

  const output = await replicate.run(
    "recraft-ai/recraft-remove-background:bf4f3a4bf48c1a032e14f7cb8886992b52197ad3c71e5642a61f94151f80b521",
    {
      input: {
        image: `data:image/png;base64,${imageBase64}`,
      }
    }
  )

  console.log("[Replicate BG Removal] Recraft AI completed")
  const outputUrl = extractOutputUrl(output)
  console.log("[Replicate BG Removal] Recraft URL:", outputUrl)

  return fetchResultAsBase64(outputUrl)
}

/**
 * Try BRIA RMBG 2.0 model - primary choice for text and fine details
 *
 * For logos/text: Uses preserve_alpha: false + custom_threshold: 0.55
 *   - Solid edges preserve text better
 *   - custom_threshold keeps fine details like taglines
 *
 * For photos: Uses preserve_alpha: true for 256 levels of transparency
 */
async function tryBRIA(
  replicate: Replicate,
  imageBase64: string,
  options?: { isLogoContext?: boolean }
): Promise<string> {
  console.log("[Replicate BG Removal] ========================================")
  console.log("[Replicate BG Removal] === USING BRIA RMBG 2.0 MODEL ===")
  console.log("[Replicate BG Removal] ========================================")

  const mimeType = detectMimeType(imageBase64)
  console.log(`[Replicate BG Removal] Input image MIME type: ${mimeType}`)
  console.log(`[Replicate BG Removal] Input base64 length: ${imageBase64.length}`)

  // Use text-preserving settings for logo context
  const isLogoMode = options?.isLogoContext === true

  const inputParams = isLogoMode
    ? {
        image: `data:${mimeType};base64,${imageBase64}`,
        preserve_alpha: false,      // Solid edges for text
        custom_threshold: 0.55      // Preserve fine details like taglines
      }
    : {
        image: `data:${mimeType};base64,${imageBase64}`,
        preserve_alpha: true        // Smooth transparency for photos
      }

  console.log(`[Replicate BG Removal] Logo mode: ${isLogoMode}`)
  console.log(`[Replicate BG Removal] preserve_alpha: ${inputParams.preserve_alpha}`)
  if (isLogoMode) {
    console.log(`[Replicate BG Removal] custom_threshold: 0.55 (text preservation)`)
  }

  const output = await replicate.run(
    "bria/remove-background:4ed060b3587b7c3912353dd7d59000c883a6e1c5c9181ed7415c2624c2e8e392",
    { input: inputParams }
  )

  console.log("[Replicate BG Removal] === BRIA COMPLETED SUCCESSFULLY ===")
  const outputUrl = extractOutputUrl(output)
  console.log("[Replicate BG Removal] BRIA output URL:", outputUrl)

  return fetchResultAsBase64(outputUrl)
}

/**
 * Available Replicate background removal models
 */
export type ReplicateBgModel = 'bria' | '851-labs' | 'recraft'

/**
 * Options for background removal
 */
export interface BgRemovalOptions {
  /** When true, use text-preserving settings (solid edges + custom_threshold) */
  isLogoContext?: boolean
}

/**
 * Remove background from an image using Replicate AI models
 *
 * Supports multiple models:
 * - 'bria' (default): BRIA RMBG 2.0 with preserve_alpha for 256 levels of transparency
 * - '851-labs': 851-labs/background-remover - very cheap, good for general use
 * - 'recraft': Recraft AI - fallback option
 *
 * @param imageBase64 - Base64 encoded image (without data URL prefix)
 * @param model - Which model to use (default: 'bria')
 * @param options - Optional settings (e.g., isLogoContext for text preservation)
 * @returns Base64 encoded PNG with transparent background
 */
export async function removeBackgroundWithReplicate(
  imageBase64: string,
  model: ReplicateBgModel = 'bria',
  options?: BgRemovalOptions
): Promise<string> {
  const apiToken = process.env.REPLICATE_API_TOKEN

  if (!apiToken) {
    throw new Error("REPLICATE_API_TOKEN environment variable is not set")
  }

  console.log("[Replicate BG Removal] Starting background removal...")
  console.log(`[Replicate BG Removal] Using model: ${model}`)
  if (options?.isLogoContext) {
    console.log("[Replicate BG Removal] Logo context detected - using text-preserving settings")
  }

  const replicate = new Replicate({
    auth: apiToken,
  })

  let result: string

  switch (model) {
    case '851-labs':
      result = await try851Labs(replicate, imageBase64)
      console.log(`[Replicate BG Removal] Complete (851-labs), output size: ${result.length}`)
      break
    case 'recraft':
      result = await tryRecraftAI(replicate, imageBase64)
      console.log(`[Replicate BG Removal] Complete (Recraft), output size: ${result.length}`)
      break
    case 'bria':
    default:
      result = await tryBRIA(replicate, imageBase64, options)
      console.log(`[Replicate BG Removal] Complete (BRIA), output size: ${result.length}`)
      break
  }

  return result
}

/**
 * Check if Replicate background removal is available
 */
export function isReplicateBgRemovalAvailable(): boolean {
  return !!process.env.REPLICATE_API_TOKEN
}
