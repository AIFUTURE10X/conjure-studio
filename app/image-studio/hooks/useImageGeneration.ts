import { useState } from 'react'
import { logPromptUse } from '@/lib/prompt-log'

import { urlToBase64 } from '../utils/export-utils'

export type ImageSize = "1K" | "2K" | "4K"
export type GenerationModel = "gemini-3.1-flash-image-preview" | "gemini-3-pro-image-preview" | "gemini-2.5-flash-image" | "gpt-image-2"
export type ReferenceMode = "replicate" | "inspire"
export type OpenAIImageQuality = "low" | "medium" | "high" | "auto"

export interface GenerationOptions {
  prompt: string
  count: number
  aspectRatio: string
  seed?: number | null
  referenceImage?: File
  referenceMode?: ReferenceMode
  maskImage?: File
  imageSize?: ImageSize
  model?: GenerationModel
  imageQuality?: OpenAIImageQuality
}

export interface GeneratedImage {
  url: string
  prompt: string
  timestamp: number
}

export interface FallbackInfo {
  used: true
  reason: string
}

/** Server-side cap in /api/generate-image; bigger batches split into parallel requests. */
const MAX_COUNT_PER_REQUEST = 4

/** Balanced split of a batch into request-sized chunks: 10 → [4, 3, 3], 6 → [3, 3]. */
function splitCount(total: number): number[] {
  const chunks = Math.ceil(total / MAX_COUNT_PER_REQUEST)
  const base = Math.floor(total / chunks)
  const remainder = total % chunks
  return Array.from({ length: chunks }, (_, i) => base + (i < remainder ? 1 : 0))
}

export function useImageGeneration(
  onImagesUpdate?: (images: GeneratedImage[]) => void,
  onFallback?: (info: FallbackInfo) => void,
) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUpscaling, setIsUpscaling] = useState(false)

  const upscaleImage = async (imageUrl: string, target: '2K' | '4K' = '4K'): Promise<string> => {
    setIsUpscaling(true)
    try {
      const formData = new FormData()
      // The upscale API decodes imageBase64 with Buffer.from(..., 'base64'),
      // so a remote Blob URL must be fetched and converted to a data URL first.
      formData.append('imageBase64', await urlToBase64(imageUrl))
      formData.append('targetResolution', target)
      formData.append('method', 'fast')
      const response = await fetch('/api/upscale-logo', { method: 'POST', body: formData })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `Upscale failed (${response.status})`)
      }
      const data = await response.json()
      if (!data.image) throw new Error('No image returned from upscaler')
      return data.image as string
    } finally {
      setIsUpscaling(false)
    }
  }

  const requestImages = async (
    options: GenerationOptions,
    count: number,
  ): Promise<{ images: GeneratedImage[]; fallback?: FallbackInfo }> => {
    const formData = new FormData()
    formData.append('prompt', options.prompt)
    formData.append('count', count.toString())
    formData.append('aspectRatio', options.aspectRatio)

    if (options.seed !== null && options.seed !== undefined) {
      formData.append('seed', options.seed.toString())
    }

    if (options.referenceImage) {
      formData.append('referenceImage', options.referenceImage)
      if (options.referenceMode) {
        formData.append('referenceMode', options.referenceMode)
      }
      if (options.maskImage) {
        formData.append('maskImage', options.maskImage)
      }
    }

    if (options.imageSize) {
      formData.append('imageSize', options.imageSize)
    }

    if (options.model) {
      formData.append('model', options.model)
    }

    if (options.imageQuality) {
      formData.append('imageQuality', options.imageQuality)
    }

    const response = await fetch('/api/generate-image', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `Failed to generate images (${response.status})`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
      throw new Error('No images returned from API')
    }

    const images: GeneratedImage[] = data.images.map((img: any) => ({
      url: typeof img === 'string' ? img : img.url,
      prompt: options.prompt,
      timestamp: Date.now()
    }))

    return { images, fallback: data.fallback as FallbackInfo | undefined }
  }

  const generateImages = async (options: GenerationOptions) => {
    setIsGenerating(true)
    setError(null)

    try {
      // The server caps count at MAX_COUNT_PER_REQUEST; bigger batches run as
      // balanced parallel requests (10 → 4+3+3). Each chunk lands in the grid
      // via onImagesUpdate as soon as it resolves. Note: multi-chunk callers
      // must pass an appending onImagesUpdate (the studio provider does);
      // legacy panels only ever request ≤4, which is always a single chunk.
      const counts = splitCount(Math.max(1, options.count))
      let fallbackReported = false

      const results = await Promise.all(counts.map(async (chunkCount) => {
        try {
          const { images, fallback } = await requestImages(options, chunkCount)
          if (fallback?.used && !fallbackReported && onFallback) {
            fallbackReported = true
            onFallback(fallback)
          }
          onImagesUpdate?.(images)
          return { images, failed: 0, message: undefined as string | undefined }
        } catch (err) {
          console.error('[v0] Generation chunk error:', err)
          const message = err instanceof Error ? err.message : 'Failed to generate images'
          return { images: [] as GeneratedImage[], failed: chunkCount, message }
        }
      }))

      const allImages = results.flatMap(r => r.images)
      const failedCount = results.reduce((sum, r) => sum + r.failed, 0)

      if (allImages.length === 0) {
        const message = results.find(r => r.message)?.message || 'Failed to generate images'
        setError(message)
        throw new Error(message)
      }

      if (failedCount > 0) {
        setError(`${failedCount} of ${options.count} images failed to generate`)
      }

      logPromptUse(options.prompt, 'image')
      return allImages
    } finally {
      setIsGenerating(false)
    }
  }
  
  const clearImages = () => {
    setError(null)
    onImagesUpdate?.([])
  }
  
  return {
    isGenerating,
    error,
    generateImages,
    clearImages,
    upscaleImage,
    isUpscaling,
  }
}
