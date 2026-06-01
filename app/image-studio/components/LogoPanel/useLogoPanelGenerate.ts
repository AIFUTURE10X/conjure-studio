"use client"

/**
 * Logo Panel Generate Handler
 *
 * Handles logo generation and favorite toggling logic.
 * Extracted from LogoPanel.tsx to keep files under 300 lines.
 */

import { useCallback } from 'react'
import { toast } from 'sonner'
import { isTextOnlyLogo, buildTextOnlyNegativePrompt, REPLICATION_PROMPT, INSPIRE_PROMPT } from '../../utils/logo-prompt-helpers'
import type { LogoGenerationModel } from '../../hooks/useLogoGeneration'

interface UseLogoPanelGenerateConfig {
  state: {
    prompt: string
    negativePrompt: string
    referenceImage: { file: File; preview?: string } | null
    referenceMode: string
    bgRemovalMethod: string
    resolution: string
    selectedModel: LogoGenerationModel
    seedLocked: boolean
    seedValue: number | undefined
    removeBackgroundOnly: boolean
    selectedPresetId: string
    getCombinedStyle: () => string
    setSeedValue: (seed: number) => void
  }
  generateLogo: (options: any) => Promise<{ url: string; seed?: number }>
  // Use any to match the original inline function signature
  handleRemoveRefBackground: (ref: any) => Promise<void>
  addToHistory: (item: any) => void
  onLogoGenerated?: (url: string) => void
}

export function useLogoPanelGenerate(config: UseLogoPanelGenerateConfig) {
  const { state, generateLogo, handleRemoveRefBackground, addToHistory, onLogoGenerated } = config

  const handleGenerate = useCallback(async () => {
    if (state.removeBackgroundOnly && state.referenceImage) {
      return handleRemoveRefBackground(state.referenceImage)
    }
    if (!state.prompt.trim() && !state.referenceImage) return

    try {
      // Determine prompt and style based on reference mode
      const isReplicate = state.referenceImage && state.referenceMode === 'replicate'
      const effectivePrompt = state.prompt.trim() || (isReplicate ? REPLICATION_PROMPT : INSPIRE_PROMPT)
      const combinedStyle = isReplicate ? '' : state.getCombinedStyle()

      // Build negative prompt with text-only handling
      let finalNegativePrompt = state.negativePrompt.trim()
      if (isTextOnlyLogo(effectivePrompt)) {
        finalNegativePrompt = buildTextOnlyNegativePrompt(finalNegativePrompt)
      }

      const logo = await generateLogo({
        prompt: effectivePrompt,
        negativePrompt: finalNegativePrompt || undefined,
        style: combinedStyle,
        referenceImage: state.referenceImage?.file,
        bgRemovalMethod: state.bgRemovalMethod,
        resolution: state.resolution,
        model: state.selectedModel,
        seed: state.seedLocked ? state.seedValue : undefined
      })

      if (logo.seed !== undefined) state.setSeedValue(logo.seed)

      addToHistory({
        imageUrl: logo.url,
        prompt: state.prompt.trim() || (state.referenceImage ? '[Reference Image]' : effectivePrompt),
        negativePrompt: state.negativePrompt.trim() || undefined,
        seed: logo.seed,
        style: combinedStyle,
        presetId: state.selectedPresetId,
        config: state.referenceImage ? {
          referenceMode: state.referenceMode,
          wasReplication: isReplicate,
          resolution: state.resolution,
          bgRemovalMethod: state.bgRemovalMethod
        } : undefined
      })

      onLogoGenerated?.(logo.url)
      toast.info("If you don't like this logo, generate again for a better result!", { duration: 5000, position: 'top-center' })
    } catch (err) {
      // Error handled by hook
    }
  }, [state, generateLogo, handleRemoveRefBackground, addToHistory, onLogoGenerated])

  return { handleGenerate }
}

interface UseLogoFavoriteConfig {
  generatedLogo: { url: string; style?: string; prompt?: string; bgRemovalMethod?: string; seed?: number } | null
  toggleFavorite: (url: string, meta: any) => void
}

export function useLogoFavorite(config: UseLogoFavoriteConfig) {
  const { generatedLogo, toggleFavorite } = config

  const handleToggleFavorite = useCallback(() => {
    if (!generatedLogo) return
    toggleFavorite(generatedLogo.url, {
      style: generatedLogo.style,
      params: {
        prompt: generatedLogo.prompt,
        bgRemovalMethod: generatedLogo.bgRemovalMethod,
        seed: generatedLogo.seed
      }
    })
  }, [generatedLogo, toggleFavorite])

  return { handleToggleFavorite }
}
