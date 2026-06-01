import { useState } from 'react'

export type ImageSize = "1K" | "2K" | "4K"
export type GenerationModel = "gemini-3.1-flash-image-preview" | "gemini-3-pro-image-preview" | "gemini-2.5-flash-image" | "gpt-image-2"
export type ReferenceMode = "replicate" | "inspire"
export type OpenAIImageQuality = "low" | "auto"

export interface GenerationOptions {
  prompt: string
  count: number
  aspectRatio: string
  seed?: number | null
  referenceImage?: File
  referenceMode?: ReferenceMode
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
      formData.append('imageBase64', imageUrl)
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

  const generateImages = async (options: GenerationOptions) => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('prompt', options.prompt)
      formData.append('count', options.count.toString())
      formData.append('aspectRatio', options.aspectRatio)
      
      if (options.seed !== null && options.seed !== undefined) {
        formData.append('seed', options.seed.toString())
      }
      
      if (options.referenceImage) {
        formData.append('referenceImage', options.referenceImage)
        if (options.referenceMode) {
          formData.append('referenceMode', options.referenceMode)
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

      const newImages: GeneratedImage[] = data.images.map((img: any) => ({
        url: typeof img === 'string' ? img : img.url,
        prompt: options.prompt,
        timestamp: Date.now()
      }))

      if (onImagesUpdate) {
        onImagesUpdate(newImages)
      }

      if (data.fallback?.used && onFallback) {
        onFallback(data.fallback as FallbackInfo)
      }

      return newImages
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate images'
      console.error('[v0] Generation error:', err)
      setError(message)
      throw err
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
