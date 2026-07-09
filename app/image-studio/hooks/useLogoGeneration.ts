import { useState } from 'react'
import { downloadLogo as downloadLogoUtil } from '../utils/export-utils'
import { DEFAULT_LOGO_GENERATION_SETTINGS } from '@/lib/logo-generation-contract'
import type {
  BgRemovalMethod,
  GeneratedLogo,
  LogoAspectRatio,
  LogoGenerationModel,
  LogoGenerationOptions,
  LogoReferenceMode,
  LogoResolution,
  LogoStyle,
  LogoTextMode,
} from '@/lib/logo-generation-contract'

export type {
  BgRemovalMethod,
  GeneratedLogo,
  LogoAspectRatio,
  LogoGenerationModel,
  LogoGenerationOptions,
  LogoReferenceMode,
  LogoResolution,
  LogoStyle,
  LogoTextMode,
} from '@/lib/logo-generation-contract'

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
      formData.append('bgRemovalMethod', options.bgRemovalMethod || DEFAULT_LOGO_GENERATION_SETTINGS.bgRemovalMethod)
      formData.append('aspectRatio', options.aspectRatio || DEFAULT_LOGO_GENERATION_SETTINGS.aspectRatio)
      formData.append('resolution', options.resolution || DEFAULT_LOGO_GENERATION_SETTINGS.resolution)
      formData.append('model', options.model || DEFAULT_LOGO_GENERATION_SETTINGS.model)
      formData.append('textMode', options.textMode || DEFAULT_LOGO_GENERATION_SETTINGS.textMode)

      if (options.negativePrompt) {
        formData.append('negativePrompt', options.negativePrompt)
      }

      if (options.referenceImage) {
        formData.append('referenceImage', options.referenceImage)
      }

      if (options.referenceMode) {
        formData.append('referenceMode', options.referenceMode)
      }

      if (options.cloudApiKey) {
        formData.append('cloudApiKey', options.cloudApiKey)
      }

      if (options.seed !== undefined) {
        formData.append('seed', options.seed.toString())
      }

      formData.append('skipBgRemoval', options.skipBgRemoval === true ? 'true' : 'false')

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
        aspectRatio: data.aspectRatio || options.aspectRatio || DEFAULT_LOGO_GENERATION_SETTINGS.aspectRatio,
        textMode: data.textMode || options.textMode || DEFAULT_LOGO_GENERATION_SETTINGS.textMode,
        bgRemovalMethod: data.bgRemovalMethod || options.bgRemovalMethod || DEFAULT_LOGO_GENERATION_SETTINGS.bgRemovalMethod,
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
