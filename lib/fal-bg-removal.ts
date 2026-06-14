/**
 * lib/fal-bg-removal.ts
 * AI-powered background removal using fal.ai (BiRefNet v2).
 *
 * Pay-as-you-go on fal — no subscription. BiRefNet gives top-tier edges on
 * hair, fine text, and semi-transparent regions.
 *
 * Auth: reads FAL_KEY from the environment (the variable name the fal SDK
 * expects). Cost: fractions of a cent per image (compute-billed).
 * Speed: ~1-2 seconds.
 *
 * @see https://fal.ai/models/fal-ai/birefnet/v2/api
 */

import { fal } from "@fal-ai/client"
import { recoverBrightDetailOnDarkBackground } from "./bright-detail-recovery"

/**
 * Detect MIME type from base64 magic bytes so fal receives a correct data URI.
 */
function detectMimeType(base64: string): string {
  if (base64.startsWith('/9j/')) return 'image/jpeg'
  if (base64.startsWith('iVBOR')) return 'image/png'
  if (base64.startsWith('UklGR')) return 'image/webp'
  if (base64.startsWith('R0lG')) return 'image/gif'
  return 'image/png'
}

/**
 * Extract the output image URL from fal's response, tolerating shape changes
 * (subscribe returns { data: { image: { url } } } for BiRefNet).
 */
function extractImageUrl(result: unknown): string {
  const data = (result as { data?: unknown })?.data ?? result

  if (data && typeof data === 'object') {
    const image = (data as { image?: unknown }).image
    if (image && typeof image === 'object') {
      const url = (image as { url?: unknown }).url
      if (typeof url === 'string') return url
    }
    const directUrl = (data as { url?: unknown }).url
    if (typeof directUrl === 'string') return directUrl
  }

  throw new Error("Could not extract image URL from fal response")
}

/**
 * Fetch result image and convert to base64.
 */
async function fetchResultAsBase64(outputUrl: string): Promise<string> {
  const response = await fetch(outputUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch fal result image: ${response.status}`)
  }
  const buffer = await response.arrayBuffer()
  return Buffer.from(buffer).toString('base64')
}

export interface FalBgRemovalOptions {
  /** Reserved for parity with other providers; BiRefNet Heavy already preserves text edges well. */
  isLogoContext?: boolean
}

/**
 * Remove the background from an image using fal.ai BiRefNet v2.
 *
 * @param imageBase64 - Base64 encoded image (without data URL prefix)
 * @param options - Optional settings
 * @returns Base64 encoded PNG with a transparent background
 */
export async function removeBackgroundWithFal(
  imageBase64: string,
  options?: FalBgRemovalOptions
): Promise<string> {
  const apiKey = process.env.FAL_KEY

  if (!apiKey) {
    throw new Error("FAL_KEY environment variable is not set")
  }

  fal.config({ credentials: apiKey })

  const mimeType = detectMimeType(imageBase64)
  console.log("[fal BG Removal] Starting BiRefNet v2 background removal...")
  console.log(`[fal BG Removal] Input MIME type: ${mimeType}, logo context: ${options?.isLogoContext === true}`)

  try {
    const result = await fal.subscribe("fal-ai/birefnet/v2", {
      input: {
        image_url: `data:${mimeType};base64,${imageBase64}`,
        model: "General Use (Heavy)", // best edge quality; cost is negligible on fal
        output_format: "png",          // PNG preserves alpha transparency
        refine_foreground: true,       // cleaner edges on hair / fine detail
      },
      logs: false,
    })

    const outputUrl = extractImageUrl(result)
    console.log("[fal BG Removal] Success, output URL:", outputUrl)
    const processedBase64 = await fetchResultAsBase64(outputUrl)
    // Restore faint bright detail (sparkles/glow) the matte drops on dark-bg
    // logos; no-op for non-dark/busy backgrounds.
    return await recoverBrightDetailOnDarkBackground(imageBase64, processedBase64)
  } catch (error) {
    console.error('[fal BG Removal] Error:', error)
    throw error
  }
}

/**
 * Check if fal background removal is available (FAL_KEY configured).
 */
export function isFalBgRemovalAvailable(): boolean {
  return !!process.env.FAL_KEY
}
