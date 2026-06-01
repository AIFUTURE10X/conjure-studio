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
import type { BgRemovalMethod, LogoAspectRatio, LogoGenerationModel, LogoGenerationOptions, LogoResolution, LogoTextMode } from '../../hooks/useLogoGeneration'
import type { LogoHistoryItem } from '../Logo/LogoHistory'

interface UseLogoPanelGenerateConfig {
  state: {
    prompt: string
    negativePrompt: string
    referenceImage: { file: File; preview: string } | null
    referenceMode: string
    bgRemovalMethod: BgRemovalMethod
    aspectRatio: LogoAspectRatio
    resolution: LogoResolution
    selectedModel: LogoGenerationModel
    textMode: LogoTextMode
    seedLocked: boolean
    seedValue: number | undefined
    removeBackgroundOnly: boolean
    selectedPresetId: string
    getCombinedStyle: () => string
    setSeedValue: (seed: number) => void
  }
  generateLogo: (options: LogoGenerationOptions) => Promise<{ url: string; seed?: number; bgRemovalMethod?: BgRemovalMethod }>
  handleRemoveRefBackground: (ref: { file: File; preview: string }) => Promise<void>
  addToHistory: (item: Omit<LogoHistoryItem, 'id' | 'timestamp' | 'isFavorited'>) => void
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
        aspectRatio: state.aspectRatio,
        resolution: state.resolution,
        model: state.selectedModel,
        textMode: state.textMode,
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
          aspectRatio: state.aspectRatio,
          resolution: state.resolution,
          textMode: state.textMode,
          bgRemovalMethod: logo.bgRemovalMethod || state.bgRemovalMethod
        } : {
          aspectRatio: state.aspectRatio,
          resolution: state.resolution,
          textMode: state.textMode,
          bgRemovalMethod: logo.bgRemovalMethod || state.bgRemovalMethod
        }
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
  generatedLogo: { url: string; style?: string; prompt?: string; aspectRatio?: string; textMode?: string; bgRemovalMethod?: string; seed?: number } | null
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
        aspectRatio: generatedLogo.aspectRatio,
        textMode: generatedLogo.textMode,
        bgRemovalMethod: generatedLogo.bgRemovalMethod,
        seed: generatedLogo.seed
      }
    })
  }, [generatedLogo, toggleFavorite])

  return { handleToggleFavorite }
}
