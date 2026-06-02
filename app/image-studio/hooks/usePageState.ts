"use client"

/**
 * Hook for page-level state and handlers
 * Extracted from page.tsx to reduce component size
 */

import { useState, useEffect, useCallback, RefObject } from 'react'
import { useImageUpload } from './useImageUpload'
import { useImageAnalysis } from './useImageAnalysis'
import { useParameters } from './useParameters'
import { useFavorites } from '../components/SimpleFavorites'
import { useImageStudioState } from './useImageStudioState'
import { useAppSettings } from './useAppSettings'
import { usePresets } from './usePresets'
import { useAutoAnalysis } from './useAutoAnalysis'
import { useAISuggestionsHandler } from './useAISuggestionsHandler'
import { useParameterHandlers } from './useParameterHandlers'
import { useLightboxHandlers } from './useLightboxHandlers'
import { useStyleAutoDetection } from './useStyleAutoDetection'
import { useCameraAutoDetection } from './useCameraAutoDetection'
import { stylePresets } from '../constants/camera-options'
import { normalizeCreativeDirection } from '../constants/creative-direction-options'
import type { DotMatrixConfig } from '../constants/dot-matrix-config'
import type { GeneratePreset } from '../constants/settings-defaults'

// Migrate old model names to new ones
const migrateModelName = (model: string): string => {
  const migrations: Record<string, string> = {
    'gemini-2.5-flash-preview-image': 'gemini-3.1-flash-image-preview',
    'gemini-2.5-flash-image': 'gemini-3.1-flash-image-preview',
    'gemini-3-pro-image': 'gemini-3-pro-image-preview',
    'gemini-2.0-flash-exp': 'gemini-3.1-flash-image-preview',
    'chatgpt-image-generator-2': 'gpt-image-2',
    'chatgpt-image-latest': 'gpt-image-2',
  }
  return migrations[model] || model
}

const normalizeImageSizeForModel = (imageSize: string | undefined, model: string): '1K' | '2K' | '4K' => {
  return imageSize === '2K' || imageSize === '4K' ? imageSize : '1K'
}

export function usePageState() {
  const uploadState = useImageUpload()
  const { analyzeImage, analyzing } = useImageAnalysis()
  const { saveParameters, loadParameters, hasStoredParams } = useParameters()
  const { favorites, toggleFavorite, isFavorite, clearAll } = useFavorites()
  const state = useImageStudioState()
  const { settings, updateSetting, resetSettings, saveGenerateParams } = useAppSettings()
  const { presets, savePreset, deletePreset, updatePreset, clearAllPresets } = usePresets()

  const [showPhotoGenerator, setShowPhotoGenerator] = useState(false)

  // Restore saved parameters when Auto-Save is enabled
  useEffect(() => {
    if (!settings.features.autoSaveParams) return
    try {
      const stored = localStorage.getItem('image-studio-saved-params')
      if (stored) {
        const savedParams = JSON.parse(stored)
        if (savedParams.mainPrompt) state.setMainPrompt(savedParams.mainPrompt)
        if (savedParams.negativePrompt) state.setNegativePrompt(savedParams.negativePrompt)
        if (savedParams.aspectRatio) state.setAspectRatio(savedParams.aspectRatio)
        if (savedParams.selectedStylePreset) state.setSelectedStylePreset(savedParams.selectedStylePreset)
        if (savedParams.selectedCameraAngle) state.setSelectedCameraAngle(savedParams.selectedCameraAngle)
        if (savedParams.selectedCameraLens) state.setSelectedCameraLens(savedParams.selectedCameraLens)
        if (savedParams.styleStrength) state.setStyleStrength(savedParams.styleStrength)
        const selectedModel = savedParams.selectedModel ? migrateModelName(savedParams.selectedModel) : state.selectedModel
        state.setImageSize(normalizeImageSizeForModel(savedParams.imageSize, selectedModel))
        if (savedParams.selectedModel) state.setSelectedModel(selectedModel as any)
        state.setCreativeDirection(normalizeCreativeDirection(savedParams.creativeDirection))
      }
    } catch (e) {
      console.error('[Settings] Failed to restore saved params:', e)
    }
  }, [settings.features.autoSaveParams])

  // Parameter handlers
  const { handleRestoreParameters, handleResetAll } = useParameterHandlers({
    loadParameters,
    setMainPrompt: state.setMainPrompt,
    setAspectRatio: state.setAspectRatio,
    setSelectedStylePreset: state.setSelectedStylePreset,
    setImageCount: state.setImageCount,
    setNegativePrompt: state.setNegativePrompt,
    setSelectedCameraAngle: state.setSelectedCameraAngle,
    setSelectedCameraLens: state.setSelectedCameraLens,
    setStyleStrength: state.setStyleStrength,
    setAnalysisMode: state.setAnalysisMode,
    setSeed: state.setSeed,
    setImageSize: state.setImageSize,
    setSelectedModel: state.setSelectedModel,
    setCreativeDirection: state.setCreativeDirection,
    setAnalysisResults: state.setAnalysisResults,
    setGeneratedImages: state.setGeneratedImages,
  })

  // Lightbox handlers
  const { openLightbox, closeLightbox, navigateLightbox, handleDownloadFromLightbox } = useLightboxHandlers({
    generatedImages: state.generatedImages,
    setLightboxOpen: state.setLightboxOpen,
    setLightboxIndex: state.setLightboxIndex,
    lightboxIndex: state.lightboxIndex,
  })

  // Auto analysis
  const { clearSubjectAnalysis, clearSceneAnalysis, clearStyleAnalysis } = useAutoAnalysis({
    subjectImages: uploadState.subjectImages,
    sceneImage: uploadState.sceneImage,
    styleImage: uploadState.styleImage,
    analysisMode: state.analysisMode,
    selectedStylePreset: state.selectedStylePreset,
    analyzeImage,
    onAnalysisUpdate: state.setAnalysisResults,
    onResetAll: handleResetAll,
  })

  const handleClearSubjectAnalysis = useCallback(() => clearSubjectAnalysis(), [clearSubjectAnalysis])
  const handleClearSceneAnalysis = useCallback(() => clearSceneAnalysis(), [clearSceneAnalysis])
  const handleClearStyleAnalysis = useCallback(() => clearStyleAnalysis(), [clearStyleAnalysis])

  // Style auto-detection
  const detectedStyle = useStyleAutoDetection(state.analysisResults.style?.analysis || null, stylePresets)
  useEffect(() => {
    if (detectedStyle) state.setSelectedStylePreset(detectedStyle)
  }, [detectedStyle, state.setSelectedStylePreset])

  // Camera auto-detection
  const { detectedAngle, detectedLens, detectedRatio } = useCameraAutoDetection(state.analysisResults.scene?.analysis || null)
  useEffect(() => {
    if (detectedRatio) state.setAspectRatio(detectedRatio)
    if (detectedAngle) state.setSelectedCameraAngle(detectedAngle)
    if (detectedLens) state.setSelectedCameraLens(detectedLens)
  }, [detectedRatio, detectedAngle, detectedLens, state.setAspectRatio, state.setSelectedCameraAngle, state.setSelectedCameraLens])

  // AI suggestions handler
  const handleApplyAISuggestions = useAISuggestionsHandler({
    setMainPrompt: state.setMainPrompt,
    setNegativePrompt: state.setNegativePrompt,
    setSelectedStylePreset: state.setSelectedStylePreset,
    setAspectRatio: state.setAspectRatio,
    setSelectedCameraAngle: state.setSelectedCameraAngle,
    setSelectedCameraLens: state.setSelectedCameraLens,
    setStyleStrength: state.setStyleStrength,
    setImageSize: state.setImageSize,
    setSelectedModel: state.setSelectedModel,
    setUsePhotoRoomBgRemoval: state.setUsePhotoRoomBgRemoval,
  })

  const handleApplyLogoSuggestions = useCallback((suggestions: { prompt?: string; negativePrompt?: string }) => {
    if (!suggestions) return
    if (suggestions.prompt !== undefined) state.setMainPrompt(suggestions.prompt)
    if (suggestions.negativePrompt !== undefined) state.setNegativePrompt(suggestions.negativePrompt)
    state.setActiveTab('logo')
  }, [state.setMainPrompt, state.setNegativePrompt, state.setActiveTab])

  // Logo config handler
  const handleApplyLogoConfig = useCallback((config: Partial<DotMatrixConfig>) => {
    state.setPendingLogoConfig(config)
    state.setActiveTab('logo')
  }, [state.setPendingLogoConfig, state.setActiveTab])

  // Load preset handler
  const handleLoadPreset = (preset: GeneratePreset) => {
    const p = preset.params
    if (p.mainPrompt) state.setMainPrompt(p.mainPrompt)
    if (p.negativePrompt) state.setNegativePrompt(p.negativePrompt)
    if (p.aspectRatio) state.setAspectRatio(p.aspectRatio)
    if (p.selectedStylePreset) state.setSelectedStylePreset(p.selectedStylePreset)
    if (p.selectedCameraAngle) state.setSelectedCameraAngle(p.selectedCameraAngle)
    if (p.selectedCameraLens) state.setSelectedCameraLens(p.selectedCameraLens)
    if (p.styleStrength) state.setStyleStrength(p.styleStrength)
    const selectedModel = p.selectedModel ? migrateModelName(p.selectedModel) : state.selectedModel
    state.setImageSize(normalizeImageSizeForModel(p.imageSize, selectedModel))
    if (p.selectedModel) state.setSelectedModel(selectedModel as any)
    state.setCreativeDirection(normalizeCreativeDirection(p.creativeDirection))
    state.setActiveTab('generate')
  }

  return {
    // Upload state
    uploadState,
    analyzing,

    // Favorites
    favorites,
    toggleFavorite,
    isFavorite,
    clearAll,

    // Main state
    state,
    hasStoredParams,

    // Settings
    settings,
    updateSetting,
    resetSettings,
    saveGenerateParams,

    // Presets
    presets,
    savePreset,
    deletePreset,
    updatePreset,
    clearAllPresets,

    // Handlers
    handleRestoreParameters,
    handleResetAll,
    openLightbox,
    closeLightbox,
    navigateLightbox,
    handleDownloadFromLightbox,
    handleClearSubjectAnalysis,
    handleClearSceneAnalysis,
    handleClearStyleAnalysis,
    handleApplyAISuggestions,
    handleApplyLogoSuggestions,
    handleApplyLogoConfig,
    handleLoadPreset,
    saveParameters,

    // Photo generator
    showPhotoGenerator,
    setShowPhotoGenerator,

    // Style presets for toolbar
    stylePresets,
  }
}
