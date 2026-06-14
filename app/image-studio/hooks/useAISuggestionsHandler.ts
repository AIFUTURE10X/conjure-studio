"use client"

/**
 * useAISuggestionsHandler Hook
 *
 * Handles applying AI suggestions to generation parameters
 */

import { useCallback } from 'react'
import type { GenerationModel } from '../components/GeneratePanel/ModelSelector'
import {
  normalizeValue,
  styleSynonyms,
  cameraAngleSynonyms,
  cameraLensSynonyms,
  styleStrengthSynonyms,
  type StyleStrength,
} from '../constants/normalization-synonyms'
import { styleValues, cameraAngleOptions, cameraLensOptions, aspectRatioOptions } from '../constants/camera-options'

interface AISuggestions {
  prompt?: string
  negativePrompt?: string
  style?: string
  aspectRatio?: string
  cameraAngle?: string
  cameraLens?: string
  styleStrength?: string
  resolution?: string
  selectedModel?: string
  model?: string
  bgRemovalMethod?: string
  imageBgRemovalMethod?: string
}

interface UseAISuggestionsHandlerProps {
  setMainPrompt: (value: string) => void
  setNegativePrompt: (value: string) => void
  setSelectedStylePreset: (value: string) => void
  setAspectRatio: (value: string) => void
  setSelectedCameraAngle: (value: string) => void
  setSelectedCameraLens: (value: string) => void
  setStyleStrength: (value: StyleStrength) => void
  setImageSize: (value: '1K' | '2K' | '4K') => void
  setSelectedModel: (value: GenerationModel) => void
  setUseImageBgRemoval: (enabled: boolean) => void
  setUsePhotoRoomBgRemoval: (enabled: boolean) => void
}

const normalizeSuggestedImageModel = (model?: string): GenerationModel | null => {
  if (!model) return null
  if (model === 'gpt-image-2' || model.startsWith('gemini-')) return 'gpt-image-2'
  return null
}

export function useAISuggestionsHandler({
  setMainPrompt,
  setNegativePrompt,
  setSelectedStylePreset,
  setAspectRatio,
  setSelectedCameraAngle,
  setSelectedCameraLens,
  setStyleStrength,
  setImageSize,
  setSelectedModel,
  setUseImageBgRemoval,
  setUsePhotoRoomBgRemoval,
}: UseAISuggestionsHandlerProps) {
  const handleApplyAISuggestions = useCallback((suggestions: AISuggestions) => {
    console.log('[v0] ===== handleApplyAISuggestions CALLED =====')
    console.log('[v0] Received suggestions:', JSON.stringify(suggestions, null, 2))

    if (!suggestions) {
      console.warn('[v0] No suggestions provided, returning early')
      return
    }

    // Apply prompt - always set even if empty to allow clearing
    if (suggestions.prompt !== undefined) {
      console.log('[v0] Setting mainPrompt to:', suggestions.prompt?.substring(0, 50) + '...')
      setMainPrompt(suggestions.prompt)
    }

    // Apply negative prompt
    if (suggestions.negativePrompt !== undefined) {
      console.log('[v0] Setting negativePrompt to:', suggestions.negativePrompt?.substring(0, 50) + '...')
      setNegativePrompt(suggestions.negativePrompt)
    }

    // Apply style
    const normalizedStyle = normalizeValue(suggestions.style, styleValues, styleSynonyms)
    if (normalizedStyle) {
      console.log('[v0] Setting style to:', normalizedStyle)
      setSelectedStylePreset(normalizedStyle)
    } else if (suggestions.style && suggestions.style !== 'None') {
      console.warn('[v0] Unrecognized style suggestion:', suggestions.style)
    }

    // Apply aspect ratio
    const normalizedAspectRatio = normalizeValue(suggestions.aspectRatio, aspectRatioOptions as unknown as string[])
    if (normalizedAspectRatio) {
      console.log('[v0] Setting aspectRatio to:', normalizedAspectRatio)
      setAspectRatio(normalizedAspectRatio)
    } else if (suggestions.aspectRatio) {
      console.warn('[v0] Unrecognized aspect ratio suggestion:', suggestions.aspectRatio)
    }

    // Apply camera angle
    const normalizedCameraAngle = normalizeValue(
      suggestions.cameraAngle,
      cameraAngleOptions as unknown as string[],
      cameraAngleSynonyms
    )
    if (normalizedCameraAngle) {
      console.log('[v0] Setting cameraAngle to:', normalizedCameraAngle)
      setSelectedCameraAngle(normalizedCameraAngle)
    } else if (suggestions.cameraAngle && suggestions.cameraAngle !== 'None') {
      console.warn('[v0] Unrecognized camera angle suggestion:', suggestions.cameraAngle, '- clearing')
      setSelectedCameraAngle('')
    }

    // Apply camera lens
    const normalizedCameraLens = normalizeValue(
      suggestions.cameraLens,
      cameraLensOptions as unknown as string[],
      cameraLensSynonyms
    )
    if (normalizedCameraLens) {
      console.log('[v0] Setting cameraLens to:', normalizedCameraLens)
      setSelectedCameraLens(normalizedCameraLens)
    } else if (suggestions.cameraLens && suggestions.cameraLens !== 'None') {
      console.warn('[v0] Unrecognized camera lens suggestion:', suggestions.cameraLens, '- clearing')
      setSelectedCameraLens('')
    }

    // Apply style strength
    if (suggestions.styleStrength) {
      const strengthKey = suggestions.styleStrength.toLowerCase()
      const normalizedStrength = styleStrengthSynonyms[strengthKey]
      if (normalizedStrength) {
        console.log('[v0] Setting styleStrength to:', normalizedStrength)
        setStyleStrength(normalizedStrength)
      } else {
        console.warn('[v0] Unrecognized style strength suggestion:', suggestions.styleStrength)
      }
    }

    // Apply resolution/image size
    if (suggestions.resolution) {
      const validResolutions = ['1K', '2K', '4K']
      const upperRes = suggestions.resolution.toUpperCase()
      if (validResolutions.includes(upperRes)) {
        console.log('[v0] Setting imageSize to:', upperRes)
        setImageSize(upperRes as '1K' | '2K' | '4K')
      } else {
        console.warn('[v0] Unrecognized resolution suggestion:', suggestions.resolution)
      }
    }

    const suggestedModel = suggestions.selectedModel || suggestions.model
    const normalizedModel = normalizeSuggestedImageModel(suggestedModel)
    if (normalizedModel) {
      console.log('[v0] Setting selectedModel to:', normalizedModel)
      setSelectedModel(normalizedModel)
    } else if (suggestedModel) {
      console.warn('[v0] Unrecognized image model suggestion:', suggestedModel)
    }

    const normalizedBgRemovalMethod = suggestions.bgRemovalMethod || suggestions.imageBgRemovalMethod
    if (normalizedBgRemovalMethod === 'photoroom') {
      setUseImageBgRemoval(true)
      console.log('[v0] Turning PhotoRoom BG removal on')
      setUsePhotoRoomBgRemoval(true)
    } else if (normalizedBgRemovalMethod === 'none') {
      console.log('[v0] Turning image background removal off')
      setUseImageBgRemoval(false)
      setUsePhotoRoomBgRemoval(false)
    } else if (normalizedBgRemovalMethod) {
      console.warn('[v0] Unrecognized image background removal suggestion:', normalizedBgRemovalMethod)
    }

    console.log('[v0] ===== AI suggestions applied successfully =====')
  }, [
    setMainPrompt,
    setNegativePrompt,
    setSelectedStylePreset,
    setAspectRatio,
    setSelectedCameraAngle,
    setSelectedCameraLens,
    setStyleStrength,
    setImageSize,
    setSelectedModel,
    setUseImageBgRemoval,
    setUsePhotoRoomBgRemoval,
  ])

  return handleApplyAISuggestions
}
