"use client"

import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from 'react'
import type { DotMatrixConfig } from '../constants/dot-matrix-config'
import { SETTINGS_STORAGE_KEY } from '../constants/settings-defaults'
import { DEFAULT_VIDEO_SETTINGS, type VideoSettingsValue } from '../constants/video-settings-defaults'
import {
  DEFAULT_CREATIVE_DIRECTION,
  normalizeCreativeDirection,
  type CreativeDirectionState,
} from '../constants/creative-direction-options'

type ActiveTab = 'generate' | 'video' | 'logo' | 'mockups' | 'bg-remover' | 'settings' | 'thumbnail' | 'translate' | 'guide' | 'analytics'

// Read defaultTab from localStorage settings (called in useEffect to avoid hydration mismatch)
function getStoredDefaultTab(): ActiveTab | null {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      const defaultTab = parsed.ui?.defaultTab
      if (defaultTab && ['generate', 'video', 'logo', 'mockups', 'bg-remover', 'thumbnail', 'translate'].includes(defaultTab)) {
        return defaultTab as ActiveTab
      }
    }
  } catch (e) {
    console.error('Failed to read defaultTab from settings:', e)
  }
  return null
}

export interface AnalysisResultsState {
  subjects: any[]
  scene: any | null
  style: any | null
}

export interface GeneratedImage {
  url: string
  prompt?: string
  timestamp?: number
}

export interface ImageStudioState {
  // Favorites & History UI
  showFavorites: boolean
  setShowFavorites: (show: boolean) => void
  showParameterHistory: boolean
  setShowParameterHistory: (show: boolean) => void

  // Analysis results
  analysisResults: AnalysisResultsState
  setAnalysisResults: (results: AnalysisResultsState) => void

  // UI state
  showAIHelper: boolean
  setShowAIHelper: (show: boolean) => void
  showUploadSection: boolean
  setShowUploadSection: (show: boolean) => void
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void
  pendingLogoConfig: Partial<DotMatrixConfig> | null
  setPendingLogoConfig: (config: Partial<DotMatrixConfig> | null) => void

  // Lightbox state
  lightboxOpen: boolean
  setLightboxOpen: (open: boolean) => void
  lightboxIndex: number
  setLightboxIndex: (index: number | ((prev: number) => number)) => void
  generatedImages: GeneratedImage[]
  setGeneratedImages: Dispatch<SetStateAction<GeneratedImage[]>>

  // Generation parameters
  aspectRatio: string
  setAspectRatio: (ratio: string) => void
  selectedStylePreset: string
  setSelectedStylePreset: (preset: string) => void
  stylePopoverOpen: boolean
  setStylePopoverOpen: (open: boolean) => void
  ratiosPopoverOpen: boolean
  setRatiosPopoverOpen: (open: boolean) => void
  imageCount: number
  setImageCount: (count: number) => void
  negativePrompt: string
  setNegativePrompt: (prompt: string) => void
  mainPrompt: string
  setMainPrompt: (prompt: string) => void
  seed: number | null
  setSeed: (seed: number | null) => void
  imageSize: '1K' | '2K' | '4K'
  setImageSize: (size: '1K' | '2K' | '4K') => void
  selectedModel: 'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview' | 'gpt-image-2'
  setSelectedModel: (model: 'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview' | 'gpt-image-2') => void
  useImageBgRemoval: boolean
  setUseImageBgRemoval: (enabled: boolean) => void
  usePhotoRoomBgRemoval: boolean
  setUsePhotoRoomBgRemoval: (enabled: boolean) => void
  creativeDirection: CreativeDirectionState
  setCreativeDirection: (creativeDirection: CreativeDirectionState | ((prev: CreativeDirectionState) => CreativeDirectionState)) => void

  // Camera settings
  selectedCameraAngle: string
  setSelectedCameraAngle: (angle: string) => void
  selectedCameraLens: string
  setSelectedCameraLens: (lens: string) => void
  styleStrength: 'subtle' | 'moderate' | 'strong'
  setStyleStrength: (strength: 'subtle' | 'moderate' | 'strong') => void
  referenceImage: any | null
  setReferenceImage: (image: any | null) => void
  analysisMode: 'fast' | 'quality'
  setAnalysisMode: (mode: 'fast' | 'quality') => void

  // Video frame pair (start/end stills feeding the video generator)
  videoStartFrame: string | null
  setVideoStartFrame: (url: string | null) => void
  videoEndFrame: string | null
  setVideoEndFrame: (url: string | null) => void

  // Video generator prompt + clip settings (lifted so presets/story mode can drive them)
  videoPrompt: string
  setVideoPrompt: (prompt: string) => void
  videoSettings: VideoSettingsValue
  setVideoSettings: (settings: VideoSettingsValue) => void
}

export function useImageStudioState(): ImageStudioState {
  // Favorites & History UI
  const [showFavorites, setShowFavorites] = useState(false)
  const [showParameterHistory, setShowParameterHistory] = useState(false)

  // Analysis results
  const [analysisResults, setAnalysisResults] = useState<AnalysisResultsState>({
    subjects: [],
    scene: null,
    style: null
  })

  // UI state
  const [showAIHelper, setShowAIHelper] = useState(false)
  const [showUploadSection, setShowUploadSection] = useState(true)
  // Start with 'generate' to match server render, then update from localStorage in useEffect
  const [activeTab, setActiveTab] = useState<ActiveTab>('generate')
  const [pendingLogoConfig, setPendingLogoConfig] = useState<Partial<DotMatrixConfig> | null>(null)

  // Load defaultTab from localStorage after hydration to avoid mismatch
  useEffect(() => {
    const storedTab = getStoredDefaultTab()
    if (storedTab) {
      setActiveTab(storedTab)
    }
  }, [])

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])

  // Generation parameters
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [selectedStylePreset, setSelectedStylePreset] = useState('Realistic')
  const [stylePopoverOpen, setStylePopoverOpen] = useState(false)
  const [ratiosPopoverOpen, setRatiosPopoverOpen] = useState(false)
  const [imageCount, setImageCount] = useState(1)
  const [negativePromptState, setNegativePromptState] = useState('')
  const [mainPromptState, setMainPromptState] = useState('')

  // Stable setters for prompts (wrapped in useCallback to prevent stale closures)
  const setMainPrompt = useCallback((value: string) => {
    console.log('[v0] setMainPrompt called with:', value?.substring(0, 50) + '...')
    setMainPromptState(value)
  }, [])

  const setNegativePrompt = useCallback((value: string) => {
    console.log('[v0] setNegativePrompt called with:', value?.substring(0, 50) + '...')
    setNegativePromptState(value)
  }, [])

  const [seed, setSeed] = useState<number | null>(null)
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K')
  const [selectedModel, setSelectedModel] = useState<'gemini-3.1-flash-image-preview' | 'gemini-3-pro-image-preview' | 'gpt-image-2'>('gpt-image-2')
  const [useImageBgRemoval, setUseImageBgRemoval] = useState(true)
  const [usePhotoRoomBgRemoval, setUsePhotoRoomBgRemoval] = useState(true)
  const [creativeDirectionState, setCreativeDirectionState] = useState<CreativeDirectionState>(DEFAULT_CREATIVE_DIRECTION)
  const setCreativeDirection = useCallback((
    value: CreativeDirectionState | ((prev: CreativeDirectionState) => CreativeDirectionState),
  ) => {
    setCreativeDirectionState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value
      return normalizeCreativeDirection(next)
    })
  }, [])

  // Debug: Log whenever mainPrompt changes
  useEffect(() => {
    console.log('[v0] *** mainPrompt STATE CHANGED to:', mainPromptState?.substring(0, 50) + '...')
  }, [mainPromptState])

  // Camera settings
  const [selectedCameraAngle, setSelectedCameraAngle] = useState('')
  const [selectedCameraLens, setSelectedCameraLens] = useState('')
  const [styleStrength, setStyleStrength] = useState<'subtle' | 'moderate' | 'strong'>('moderate')
  const [referenceImage, setReferenceImage] = useState<any | null>(null)
  const [analysisMode, setAnalysisMode] = useState<'fast' | 'quality'>('fast')

  // Video frame pair
  const [videoStartFrame, setVideoStartFrame] = useState<string | null>(null)
  const [videoEndFrame, setVideoEndFrame] = useState<string | null>(null)

  // Video generator prompt + clip settings
  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoSettings, setVideoSettings] = useState<VideoSettingsValue>(DEFAULT_VIDEO_SETTINGS)

  return {
    // Favorites & History UI
    showFavorites, setShowFavorites,
    showParameterHistory, setShowParameterHistory,

    // Analysis results
    analysisResults, setAnalysisResults,

    // UI state
    showAIHelper, setShowAIHelper,
    showUploadSection, setShowUploadSection,
    activeTab, setActiveTab,
    pendingLogoConfig, setPendingLogoConfig,

    // Lightbox state
    lightboxOpen, setLightboxOpen,
    lightboxIndex, setLightboxIndex,
    generatedImages, setGeneratedImages,

    // Generation parameters
    aspectRatio, setAspectRatio,
    selectedStylePreset, setSelectedStylePreset,
    stylePopoverOpen, setStylePopoverOpen,
    ratiosPopoverOpen, setRatiosPopoverOpen,
    imageCount, setImageCount,
    negativePrompt: negativePromptState, setNegativePrompt,
    mainPrompt: mainPromptState, setMainPrompt,
    seed, setSeed,
    imageSize, setImageSize,
    selectedModel, setSelectedModel,
    useImageBgRemoval, setUseImageBgRemoval,
    usePhotoRoomBgRemoval, setUsePhotoRoomBgRemoval,
    creativeDirection: creativeDirectionState, setCreativeDirection,

    // Camera settings
    selectedCameraAngle, setSelectedCameraAngle,
    selectedCameraLens, setSelectedCameraLens,
    styleStrength, setStyleStrength,
    referenceImage, setReferenceImage,
    analysisMode, setAnalysisMode,

    // Video frame pair
    videoStartFrame, setVideoStartFrame,
    videoEndFrame, setVideoEndFrame,

    // Video generator prompt + clip settings
    videoPrompt, setVideoPrompt,
    videoSettings, setVideoSettings,
  }
}
