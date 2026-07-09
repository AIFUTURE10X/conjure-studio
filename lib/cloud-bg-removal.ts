/**
 * lib/cloud-bg-removal.ts
 * Cloud-based background removal using remove.bg or Pixian.ai APIs
 * Highest quality but requires API key
 */

import { removeBackground as localRemoveBackground } from './background-removal'
import { removeBackgroundSmart } from './smart-bg-removal'

export interface CloudRemovalOptions {
  apiKey?: string
  size?: 'auto' | 'preview' | 'full' | '4k'
  type?: 'auto' | 'person' | 'product' | 'car'
  format?: 'png' | 'jpg' | 'zip'
  provider?: 'removebg' | 'pixian'
}

/**
 * Remove background using remove.bg cloud API
 * Falls back to local AI method if API key not available or API fails
 */
export async function removeBackgroundCloud(
  imageBase64: string,
  options: CloudRemovalOptions = {}
): Promise<string> {
  const {
    apiKey = process.env.REMOVE_BG_API_KEY,
    size = 'auto',
    type = 'product', // Best for logos
    format = 'png'
  } = options

  // If no API key, fall back to local AI method
  if (!apiKey) {
    console.warn('[Cloud BG Removal] No API key provided, falling back to local AI method')
    return localRemoveBackground(imageBase64, { method: 'ai-local' })
  }

  try {
    console.log('[Cloud BG Removal] Starting remove.bg API call...')

    const formData = new FormData()
    formData.append('image_file_b64', imageBase64)
    formData.append('size', size)
    formData.append('type', type)
    formData.append('format', format)

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`remove.bg API error ${response.status}: ${errorText}`)
    }

    const resultBuffer = await response.arrayBuffer()
    const resultBase64 = Buffer.from(resultBuffer).toString('base64')

    console.log('[Cloud BG Removal] Success! Image processed by remove.bg')
    return resultBase64
  } catch (error) {
    console.error('[Cloud BG Removal] API Error:', error)

    // Fall back to local AI method on any error
    console.log('[Cloud BG Removal] Falling back to local AI method...')
    return localRemoveBackground(imageBase64, { method: 'ai-local' })
  }
}

/**
 * Check if remove.bg API key is configured
 */
export function isCloudRemovalAvailable(): boolean {
  return !!process.env.REMOVE_BG_API_KEY
}

/**
 * Get remove.bg API usage/credits info (if available)
 */
export async function getCloudApiInfo(apiKey?: string): Promise<{
  available: boolean
  credits?: number
  error?: string
}> {
  const key = apiKey || process.env.REMOVE_BG_API_KEY

  if (!key) {
    return { available: false, error: 'No API key configured' }
  }

  try {
    // The remove.bg package doesn't expose account info directly
    // We just check if the key is set
    return {
      available: true,
      credits: undefined // Would need direct API call to get this
    }
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Remove background using Pixian.ai cloud API
 * Free tier available, good quality for logos
 */
export async function removeBackgroundPixian(
  imageBase64: string,
  apiKey: string
): Promise<string> {
  if (!apiKey) {
    console.warn('[Pixian BG Removal] No API key provided, falling back to local method')
    return localRemoveBackground(imageBase64, { method: 'simple' })
  }

  try {
    console.log('[Pixian BG Removal] Starting Pixian.ai API call...')

    // Convert base64 to binary for form upload
    const imageBuffer = Buffer.from(imageBase64, 'base64')

    // Create form data with the image
    const formData = new FormData()
    formData.append('image', new Blob([imageBuffer], { type: 'image/png' }), 'image.png')

    // Pixian uses HTTP Basic Auth with API key as username
    const authHeader = 'Basic ' + Buffer.from(apiKey + ':').toString('base64')

    const response = await fetch('https://api.pixian.ai/api/v2/remove-background', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Pixian API error ${response.status}: ${errorText}`)
    }

    // Response is the PNG image directly
    const resultBuffer = await response.arrayBuffer()
    const resultBase64 = Buffer.from(resultBuffer).toString('base64')

    console.log('[Pixian BG Removal] Success! Image processed by Pixian.ai')
    return resultBase64
  } catch (error) {
    console.error('[Pixian BG Removal] API Error:', error)

    console.log('[Pixian BG Removal] Falling back to local smart method...')
    return removeBackgroundSmart(imageBase64)
  }
}
