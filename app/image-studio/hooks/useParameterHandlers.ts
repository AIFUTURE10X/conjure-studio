"use client"

import { useCallback } from 'react'
import type { AnalysisResultsState } from './useImageStudioState'
import {
  DEFAULT_CREATIVE_DIRECTION,
  normalizeCreativeDirection,
  type CreativeDirectionState,
} from '../constants/creative-direction-options'

interface UseParameterHandlersOptions {
  loadParameters: () => any
  setMainPrompt: (prompt: string) => void
  setAspectRatio: (ratio: string) => void
  setSelectedStylePreset: (preset: string) => void
  setImageCount: (count: number) => void
  setNegativePrompt: (prompt: string) => void
  setSelectedCameraAngle: (angle: string) => void
  setSelectedCameraLens: (lens: string) => void
  setStyleStrength: (strength: 'subtle' | 'moderate' | 'strong') => void
  setAnalysisMode: (mode: 'fast' | 'quality') => void
  setSeed: (seed: number | null) => void
  setImageSize: (size: '1K' | '2K' | '4K') => void
  setSelectedModel: (model: 'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview' | 'gpt-image-2') => void
  setCreativeDirection: (creativeDirection: CreativeDirectionState) => void
  setAnalysisResults: (results: AnalysisResultsState) => void
  setGeneratedImages: (images: any[]) => void
}

export interface ParameterHandlers {
  handleRestoreParameters: (params?: any, imageUrl?: string) => void
  handleResetAll: () => void
}

const migrateModelName = (model: string): 'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview' | 'gpt-image-2' => {
  if (
    model === 'gpt-image-2' ||
    model === 'chatgpt-image-generator-2' ||
    model === 'chatgpt-image-latest' ||
    model.startsWith('gemini-')
  ) {
    return 'gpt-image-2'
  }
  return 'gpt-image-2'
}

const normalizeImageSizeForModel = (
  imageSize: string | undefined,
  model: 'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview' | 'gpt-image-2',
): '1K' | '2K' | '4K' => {
  return imageSize === '2K' || imageSize === '4K' ? imageSize : '1K'
}

export function useParameterHandlers({
  loadParameters,
  setMainPrompt,
  setAspectRatio,
  setSelectedStylePreset,
  setImageCount,
  setNegativePrompt,
  setSelectedCameraAngle,
  setSelectedCameraLens,
  setStyleStrength,
  setAnalysisMode,
  setSeed,
  setImageSize,
  setSelectedModel,
  setCreativeDirection,
  setAnalysisResults,
  setGeneratedImages,
}: UseParameterHandlersOptions): ParameterHandlers {

  const handleRestoreParameters = useCallback((params?: any, imageUrl?: string) => {
    const paramsToRestore = params || loadParameters()
    // Restore the image(s) themselves as the current generated output, so
    // they reappear in the results canvas alongside their settings — a single
    // url from favorites, or the full imageUrls array from a history entry.
    const restoredUrls: string[] = imageUrl
      ? [imageUrl]
      : Array.isArray(paramsToRestore?.imageUrls)
        ? paramsToRestore.imageUrls.filter((url: unknown): url is string => typeof url === 'string' && url.length > 0)
        : []
    if (restoredUrls.length > 0) {
      const timestamp = Date.now()
      setGeneratedImages(restoredUrls.map((url) => ({ url, prompt: paramsToRestore?.mainPrompt, timestamp })))
    }
    if (paramsToRestore) {
      if (paramsToRestore.mainPrompt) setMainPrompt(paramsToRestore.mainPrompt)
      if (paramsToRestore.aspectRatio) setAspectRatio(paramsToRestore.aspectRatio)
      if (paramsToRestore.selectedStylePreset) setSelectedStylePreset(paramsToRestore.selectedStylePreset)
      if (paramsToRestore.imageCount) setImageCount(paramsToRestore.imageCount)
      if (paramsToRestore.negativePrompt) setNegativePrompt(paramsToRestore.negativePrompt)
      if (paramsToRestore.selectedCameraAngle) setSelectedCameraAngle(paramsToRestore.selectedCameraAngle)
      if (paramsToRestore.selectedCameraLens) setSelectedCameraLens(paramsToRestore.selectedCameraLens)
      if (paramsToRestore.styleStrength) setStyleStrength(paramsToRestore.styleStrength)
      if (paramsToRestore.analysisMode) setAnalysisMode(paramsToRestore.analysisMode)
      if (paramsToRestore.seed !== undefined) setSeed(paramsToRestore.seed)
      const selectedModel = paramsToRestore.selectedModel
        ? migrateModelName(paramsToRestore.selectedModel)
        : 'gpt-image-2'
      setImageSize(normalizeImageSizeForModel(paramsToRestore.imageSize, selectedModel))
      if (paramsToRestore.selectedModel) setSelectedModel(selectedModel)
      setCreativeDirection(normalizeCreativeDirection(paramsToRestore.creativeDirection))

      console.log('[v0] Restored parameters:', paramsToRestore)
    }
  }, [
    loadParameters,
    setMainPrompt,
    setAspectRatio,
    setSelectedStylePreset,
    setImageCount,
    setNegativePrompt,
    setSelectedCameraAngle,
    setSelectedCameraLens,
    setStyleStrength,
    setAnalysisMode,
    setSeed,
    setImageSize,
    setSelectedModel,
    setCreativeDirection,
    setGeneratedImages,
  ])

  const handleResetAll = useCallback(() => {
    setMainPrompt('')
    setNegativePrompt('')
    setAspectRatio('1:1')
    setSelectedStylePreset('Realistic')
    setImageCount(1)
    setSelectedCameraAngle('')
    setSelectedCameraLens('')
    setStyleStrength('moderate')
    setSeed(null)
    setImageSize('1K')
    setSelectedModel('gpt-image-2')
    setCreativeDirection(DEFAULT_CREATIVE_DIRECTION)
    setAnalysisResults({
      subjects: [],
      scene: null,
      style: null
    })
    setGeneratedImages([])
    console.log('[v0] Reset all parameters to defaults')
  }, [
    setMainPrompt,
    setNegativePrompt,
    setAspectRatio,
    setSelectedStylePreset,
    setImageCount,
    setSelectedCameraAngle,
    setSelectedCameraLens,
    setStyleStrength,
    setSeed,
    setImageSize,
    setSelectedModel,
    setCreativeDirection,
    setAnalysisResults,
    setGeneratedImages,
  ])

  return {
    handleRestoreParameters,
    handleResetAll,
  }
}
