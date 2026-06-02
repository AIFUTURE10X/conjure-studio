"use client"

import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_LOGO_GENERATION_SETTINGS } from '@/lib/logo-generation-contract'
import type { BgRemovalMethod, GeneratedLogo, LogoAspectRatio, LogoGenerationModel, LogoTextMode } from './useLogoGeneration'
import { LogoConcept, LogoRenderTreatment, LogoResolution, LogoType, LogoTypographyDirection, LogoVisualStyle, RenderStyle } from '../constants/logo-constants'
import type { DotMatrixConfig } from '../constants/dot-matrix-config'
import { BatchGenerationOptions } from './useBatchGeneration'
import { LogoHistoryItem } from '../components/Logo/LogoHistory'

export interface LogoPanelStateProps {
  externalPrompt?: string
  externalNegativePrompt?: string
  pendingLogoConfig?: Partial<DotMatrixConfig> | null
}

export function useLogoPanelState({
  externalPrompt,
  externalNegativePrompt,
  pendingLogoConfig,
}: LogoPanelStateProps) {
  // Core prompt state
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')

  // Style state
  const [selectedConcept, setSelectedConcept] = useState<LogoConcept | null>(null)
  const [selectedRenders, setSelectedRenders] = useState<RenderStyle[]>([])
  const [logoType, setLogoType] = useState<LogoType>('icon-wordmark')
  const [logoVisualStyle, setLogoVisualStyle] = useState<LogoVisualStyle>('modern')
  const [logoRenderTreatment, setLogoRenderTreatment] = useState<LogoRenderTreatment>('flat-vector')
  const [logoTypographyDirection, setLogoTypographyDirection] = useState<LogoTypographyDirection>('clean-sans')

  // Settings state
  const [bgRemovalMethod, setBgRemovalMethod] = useState<BgRemovalMethod>(DEFAULT_LOGO_GENERATION_SETTINGS.bgRemovalMethod)
  const [aspectRatio, setAspectRatio] = useState<LogoAspectRatio>('1:1')
  const [resolution, setResolution] = useState<LogoResolution>('1K')
  const [selectedModel, setSelectedModel] = useState<LogoGenerationModel>('gemini-3.1-flash-image-preview')
  const [textMode, setTextMode] = useState<LogoTextMode>('ai-text')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [referenceImage, setReferenceImage] = useState<{ file: File; preview: string } | null>(null)
  const [referenceMode, setReferenceMode] = useState<'replicate' | 'inspire'>('replicate')
  const [removeBackgroundOnly, setRemoveBackgroundOnly] = useState(false)
  const [seedLocked, setSeedLocked] = useState(false)
  const [seedValue, setSeedValue] = useState<number | undefined>()

  // Mode state
  const [logoMode, setLogoMode] = useState<'guided' | 'expert'>('guided')

  // Modal visibility state
  const [showTextEditor, setShowTextEditor] = useState(false)
  const [isEraserMode, setIsEraserMode] = useState(false)
  const [showDotMatrixConfigurator, setShowDotMatrixConfigurator] = useState(false)
  const [showUnifiedConfigurator, setShowUnifiedConfigurator] = useState(false)
  const [showLogoWizard, setShowLogoWizard] = useState(false)
  const [showBatchGenerator, setShowBatchGenerator] = useState(false)
  const [showMockupPreview, setShowMockupPreview] = useState(false)
  const [showComparisonView, setShowComparisonView] = useState(false)
  const [showRealFontOverlay, setShowRealFontOverlay] = useState(false)

  // Preset and wizard state
  const [selectedPresetId, setSelectedPresetId] = useState<string>('corporate-dotmatrix')
  const [wizardConfig, setWizardConfig] = useState<Record<string, any> | null>(null)
  const [batchOptions, setBatchOptions] = useState<BatchGenerationOptions | null>(null)
  const [comparisonItems, setComparisonItems] = useState<LogoHistoryItem[]>([])

  // Sync external prompts from AI Helper
  useEffect(() => {
    if (externalPrompt !== undefined && externalPrompt !== prompt) {
      setPrompt(externalPrompt)
    }
  }, [externalPrompt])

  useEffect(() => {
    if (externalNegativePrompt !== undefined && externalNegativePrompt !== negativePrompt) {
      setNegativePrompt(externalNegativePrompt)
    }
  }, [externalNegativePrompt])

  // Auto-open DotMatrixConfigurator when AI Helper sends config
  useEffect(() => {
    if (pendingLogoConfig && Object.keys(pendingLogoConfig).length > 0) {
      setShowDotMatrixConfigurator(true)
    }
  }, [pendingLogoConfig])

  // Clear all state
  const handleClearAll = useCallback(() => {
    setPrompt('')
    setNegativePrompt('')
    setSelectedConcept(null)
    setSelectedRenders([])
    setLogoType('icon-wordmark')
    setLogoVisualStyle('modern')
    setLogoRenderTreatment('flat-vector')
    setLogoTypographyDirection('clean-sans')
    setBgRemovalMethod(DEFAULT_LOGO_GENERATION_SETTINGS.bgRemovalMethod)
    setAspectRatio('1:1')
    setResolution('1K')
    setSelectedModel('gemini-3.1-flash-image-preview')
    setTextMode('ai-text')
    setShowAdvanced(false)
    setReferenceImage(null)
    setReferenceMode('replicate')
    setShowTextEditor(false)
    setRemoveBackgroundOnly(false)
    setSeedLocked(false)
    setSeedValue(undefined)
    setIsEraserMode(false)
  }, [])

  // Get combined style string
  const getCombinedStyle = useCallback(() => {
    const styleParts = [
      logoType,
      logoVisualStyle,
      logoRenderTreatment,
      logoTypographyDirection,
      selectedConcept,
      ...selectedRenders,
    ].filter(Boolean)
    return (styleParts.length > 0 ? styleParts.join('+') : 'modern') as any
  }, [logoType, logoVisualStyle, logoRenderTreatment, logoTypographyDirection, selectedConcept, selectedRenders])

  return {
    // Core state
    prompt, setPrompt,
    negativePrompt, setNegativePrompt,

    // Style state
    selectedConcept, setSelectedConcept,
    selectedRenders, setSelectedRenders,
    logoType, setLogoType,
    logoVisualStyle, setLogoVisualStyle,
    logoRenderTreatment, setLogoRenderTreatment,
    logoTypographyDirection, setLogoTypographyDirection,

    // Settings state
    bgRemovalMethod, setBgRemovalMethod,
    aspectRatio, setAspectRatio,
    resolution, setResolution,
    selectedModel, setSelectedModel,
    textMode, setTextMode,
    showAdvanced, setShowAdvanced,
    referenceImage, setReferenceImage,
    referenceMode, setReferenceMode,
    removeBackgroundOnly, setRemoveBackgroundOnly,
    seedLocked, setSeedLocked,
    seedValue, setSeedValue,

    // Mode state
    logoMode, setLogoMode,

    // Modal visibility state
    showTextEditor, setShowTextEditor,
    isEraserMode, setIsEraserMode,
    showDotMatrixConfigurator, setShowDotMatrixConfigurator,
    showUnifiedConfigurator, setShowUnifiedConfigurator,
    showLogoWizard, setShowLogoWizard,
    showBatchGenerator, setShowBatchGenerator,
    showMockupPreview, setShowMockupPreview,
    showComparisonView, setShowComparisonView,
    showRealFontOverlay, setShowRealFontOverlay,

    // Preset and wizard state
    selectedPresetId, setSelectedPresetId,
    wizardConfig, setWizardConfig,
    batchOptions, setBatchOptions,
    comparisonItems, setComparisonItems,

    // Helpers
    handleClearAll,
    getCombinedStyle,
  }
}
