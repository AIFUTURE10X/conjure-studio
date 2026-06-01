import { useState } from 'react'
import { downloadLogo as downloadLogoUtil } from '../utils/export-utils'

// Extended logo styles including new 3D options
export type LogoStyle =
  | 'minimalist' | 'flat' | '3d' | 'vintage' | 'modern'
  | '3d-metallic' | '3d-crystal' | '3d-gradient' | 'neon'

// Background removal methods ('none' = skip removal)
export type BgRemovalMethod = 'none' | 'auto' | 'ai-local' | 'simple' | 'cloud' | 'pixian' | 'replicate' | 'smart' | 'photoroom' | '851-labs'

// Resolution options
export type LogoResolution = '1K' | '2K' | '4K'

// AI generation models
export type LogoGenerationModel = 'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview' | 'gpt-image-2'

export interface LogoGenerationOptions {
  prompt: string
  negativePrompt?: string
  style: LogoStyle
  referenceImage?: File
  bgRemovalMethod?: BgRemovalMethod
  cloudApiKey?: string
  resolution?: LogoResolution
  model?: LogoGenerationModel
  seed?: number // Optional seed for reproducible generation
  skipBgRemoval?: boolean // Skip background removal (default: true)
}

export interface GeneratedLogo {
  url: string
  originalUrl?: string // Stores the original image before background removal
  prompt: string
  style: LogoStyle
  bgRemovalMethod: BgRemovalMethod
  timestamp: number
  seed?: number // The seed used for generation (if available)
}

export function useLogoGeneration() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedLogo, setGeneratedLogo] = useState<GeneratedLogo | null>(null)

  const generateLogo = async (options: LogoGenerationOptions): Promise<GeneratedLogo> => {
    setIsGenerating(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('prompt', options.prompt)
      formData.append('style', options.style)
      formData.append('bgRemovalMethod', options.bgRemovalMethod || 'replicate')
      formData.append('resolution', options.resolution || '1K')
      formData.append('model', options.model || 'gemini-3.1-flash-image-preview')

      if (options.negativePrompt) {
        formData.append('negativePrompt', options.negativePrompt)
      }

      if (options.referenceImage) {
        formData.append('referenceImage', options.referenceImage)
      }

      if (options.cloudApiKey) {
        formData.append('cloudApiKey', options.cloudApiKey)
      }

      if (options.seed !== undefined) {
        formData.append('seed', options.seed.toString())
      }

      // Skip background removal by default (true), unless explicitly set to false
      formData.append('skipBgRemoval', options.skipBgRemoval === false ? 'false' : 'true')

      const response = await fetch('/api/generate-logo', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to generate logo (${response.status})`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (!data.image) {
        throw new Error('No logo returned from API')
      }

      const logo: GeneratedLogo = {
        url: data.image,
        prompt: options.prompt,
        style: options.style,
        bgRemovalMethod: options.bgRemovalMethod || 'auto',
        timestamp: Date.now(),
        seed: data.seed // Include seed from API response
      }

      setGeneratedLogo(logo)
      return logo
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate logo'
      console.error('[Logo] Generation error:', err)
      setError(message)
      throw err
    } finally {
      setIsGenerating(false)
    }
  }

  const clearLogo = () => {
    setGeneratedLogo(null)
    setError(null)
  }

  const downloadLogo = async (logo: GeneratedLogo) => {
    try {
      // Use utility function - see EXPORT_FIX_REFERENCE.md for why this pattern is needed
      await downloadLogoUtil(logo.url, logo.prompt)
    } catch (err) {
      console.error('[Logo] Download failed:', err)
    }
  }

  // Allow setting a logo directly (for background removal only mode)
  const setLogo = (logo: GeneratedLogo) => {
    setGeneratedLogo(logo)
    setError(null)
  }

  return {
    isGenerating,
    error,
    generatedLogo,
    generateLogo,
    clearLogo,
    downloadLogo,
    setLogo
  }
}
