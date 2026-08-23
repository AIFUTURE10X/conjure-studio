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
import sharp from "sharp"
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
 * BEN2 (like Bria) leaves the original background RGB under fully transparent
 * pixels, which bloats the PNG several-fold and halos in consumers that resize
 * without premultiplying. Zero it out, keeping edge semi-transparency intact.
 */
async function clearRgbUnderTransparency(base64: string): Promise<string> {
  const { data, info } = await sharp(Buffer.from(base64, 'base64'))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) {
      data[i] = 0
      data[i + 1] = 0
      data[i + 2] = 0
    }
  }
  const png = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer()
  return png.toString('base64')
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
  /**
   * Logo/graphic context routes to BEN2 instead of BiRefNet.
   *
   * BiRefNet is salient-object detection: a near-binary mask multiplied onto
   * the source, so glowing/gradient fills score low and get punched out (neon
   * bars come back as hollow outlines). Raising `operating_resolution` does not
   * fix it — the failure is the model class. BEN2 uses confidence-guided
   * matting and retained every fill with the sharpest type of anything fal
   * hosts. BiRefNet Heavy stays the default for photo subjects, where its
   * hair/fine-edge quality is best in class.
   *
   * Judged on pixels against a real PhotoRoom cutout via
   * scripts/compare-bg-removers.cjs.
   */
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
  const isLogoContext = options?.isLogoContext === true
  const dataUri = `data:${mimeType};base64,${imageBase64}`
  const endpoint = isLogoContext ? "fal-ai/ben/v2/image" : "fal-ai/birefnet/v2"
  console.log(`[fal BG Removal] Starting ${isLogoContext ? 'BEN2' : 'BiRefNet v2'} background removal...`)
  console.log(`[fal BG Removal] Input MIME type: ${mimeType}, logo context: ${isLogoContext}`)

  try {
    const result = await fal.subscribe(endpoint, {
      input: isLogoContext
        ? { image_url: dataUri }
        : {
            image_url: dataUri,
            model: "General Use (Heavy)", // best edge quality; cost is negligible on fal
            output_format: "png",          // PNG preserves alpha transparency
            refine_foreground: true,       // cleaner edges on hair / fine detail
          },
      logs: false,
    })

    const outputUrl = extractImageUrl(result)
    console.log("[fal BG Removal] Success, output URL:", outputUrl)
    let processedBase64 = await fetchResultAsBase64(outputUrl)
    if (isLogoContext) {
      processedBase64 = await clearRgbUnderTransparency(processedBase64)
    }
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
