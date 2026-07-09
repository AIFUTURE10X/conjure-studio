/**
 * lib/pixelcut-bg-removal.ts
 * Background removal using Pixelcut API - specifically designed for logos
 *
 * Pixelcut excels at preserving fine lines, intricate shapes, and text in logos.
 * Supports up to 6000x6000px resolution.
 *
 * Cost: 5 credits per image (100 free credits on signup)
 * Speed: 1-3 seconds
 *
 * @see https://developer.pixelcut.ai/remove-background
 */

/**
 * Remove background from an image using Pixelcut API
 *
 * @param imageBase64 - Base64 encoded image (without data URL prefix)
 * @param apiKey - Pixelcut API key (from env or user-provided)
 * @returns Base64 encoded PNG with transparent background
 */
export async function removeBackgroundWithPixelcut(
  imageBase64: string,
  apiKey?: string
): Promise<string> {
  const token = apiKey || process.env.PIXELCUT_API_KEY

  if (!token) {
    throw new Error("PIXELCUT_API_KEY environment variable is not set and no API key provided")
  }

  console.log("[Pixelcut BG Removal] Starting logo-optimized background removal...")

  // Convert base64 to binary blob for multipart upload
  const imageBuffer = Buffer.from(imageBase64, 'base64')
  const blob = new Blob([imageBuffer], { type: 'image/png' })

  // Create form data with binary image
  const formData = new FormData()
  formData.append('image', blob, 'image.png')
  formData.append('format', 'png')

  try {
    const response = await fetch('https://api.developer.pixelcut.ai/v1/remove-background', {
      method: 'POST',
      headers: {
        'X-API-KEY': token,
        'Accept': 'image/png', // Request binary PNG directly
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Pixelcut API error: ${response.status}`

      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.error) {
          errorMessage = `Pixelcut: ${errorJson.error}`

          // Handle specific error codes
          if (errorJson.error === 'insufficient_api_credits') {
            errorMessage = 'Pixelcut: Insufficient API credits. Please add more credits to your account.'
          } else if (errorJson.error === 'invalid_auth_token') {
            errorMessage = 'Pixelcut: Invalid API key. Please check your PIXELCUT_API_KEY.'
          } else if (errorJson.error === 'file_size_too_large') {
            errorMessage = 'Pixelcut: Image file too large. Maximum size is 25MB.'
          } else if (errorJson.error === 'resolution_too_high') {
            errorMessage = 'Pixelcut: Image resolution too high. Maximum is 6000x6000px.'
          }
        }
      } catch {
        // Not JSON, use raw text
        errorMessage = `Pixelcut API error: ${errorText}`
      }

      throw new Error(errorMessage)
    }

    // Response is binary PNG data
    const resultBuffer = await response.arrayBuffer()
    const resultBase64 = Buffer.from(resultBuffer).toString('base64')

    console.log("[Pixelcut BG Removal] Success! Logo processed with text preservation")
    return resultBase64
  } catch (error) {
    console.error('[Pixelcut BG Removal] API Error:', error)
    throw error
  }
}

/**
 * Remove background using Pixelcut with JSON response (returns URL)
 * Use this if you want to get a URL instead of binary data
 */
export async function removeBackgroundWithPixelcutUrl(
  imageBase64: string,
  apiKey?: string
): Promise<{ resultUrl: string }> {
  const token = apiKey || process.env.PIXELCUT_API_KEY

  if (!token) {
    throw new Error("PIXELCUT_API_KEY environment variable is not set")
  }

  const imageBuffer = Buffer.from(imageBase64, 'base64')
  const blob = new Blob([imageBuffer], { type: 'image/png' })

  const formData = new FormData()
  formData.append('image', blob, 'image.png')
  formData.append('format', 'png')

  const response = await fetch('https://api.developer.pixelcut.ai/v1/remove-background', {
    method: 'POST',
    headers: {
      'X-API-KEY': token,
      'Accept': 'application/json',
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Pixelcut API error: ${errorText}`)
  }

  const result = await response.json()
  return { resultUrl: result.result_url }
}

/**
 * Check if Pixelcut background removal is available
 */
export function isPixelcutBgRemovalAvailable(): boolean {
  return !!process.env.PIXELCUT_API_KEY
}
