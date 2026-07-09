/**
 * lib/replicate-upscaler.ts
 * AI-powered image upscaling using Replicate's Real-ESRGAN model
 *
 * Real-ESRGAN produces genuinely sharper, more detailed images
 * unlike traditional interpolation which just smoothly stretches pixels.
 *
 * Cost: ~$0.01-0.03 per image
 * Speed: 1-2 seconds
 */

import Replicate from "replicate"

export type UpscaleScale = 2 | 4

export interface UpscaleResult {
  success: boolean
  imageBase64?: string
  error?: string
  method: 'ai' | 'fallback'
}

/**
 * Upscale an image using Real-ESRGAN AI model via Replicate
 *
 * @param imageBase64 - Base64 encoded image (without data URL prefix)
 * @param scale - Upscale factor: 2 or 4 (default: 4)
 * @returns Base64 encoded upscaled image
 */
export async function upscaleWithRealESRGAN(
  imageBase64: string,
  scale: UpscaleScale = 4
): Promise<string> {
  const apiToken = process.env.REPLICATE_API_TOKEN

  if (!apiToken) {
    throw new Error("REPLICATE_API_TOKEN environment variable is not set")
  }

  console.log(`[Replicate Upscaler] Starting AI upscale with scale: ${scale}x`)

  const replicate = new Replicate({
    auth: apiToken,
  })

  // Real-ESRGAN model - excellent for logos and illustrations
  // nightmareai/real-esrgan is fast, reliable, and produces sharp results
  const output = await replicate.run(
    "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164291a4e9f4d1f99e80c524ef4db37e5a1f890",
    {
      input: {
        image: `data:image/png;base64,${imageBase64}`,
        scale: scale,
        face_enhance: false // Set true for portraits with faces
      }
    }
  )

  console.log("[Replicate Upscaler] Model completed, fetching result...")

  // Output is a URL to the upscaled image
  if (!output || typeof output !== 'string') {
    throw new Error("No output URL returned from Replicate")
  }

  // Fetch the upscaled image and convert to base64
  const response = await fetch(output)
  if (!response.ok) {
    throw new Error(`Failed to fetch upscaled image: ${response.status}`)
  }

  const buffer = await response.arrayBuffer()
  const resultBase64 = Buffer.from(buffer).toString('base64')

  console.log(`[Replicate Upscaler] AI upscale complete, output size: ${resultBase64.length}`)

  return resultBase64
}

/**
 * Check if Replicate API is available
 */
export function isReplicateAvailable(): boolean {
  return !!process.env.REPLICATE_API_TOKEN
}
