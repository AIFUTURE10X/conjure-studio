"use client"

/**
 * LogoGenerationProvider
 *
 * v2 studio logo engine. Wires the lifted logo state (StudioLogoContext)
 * into the same generation hooks LogoPanel uses (useLogoGeneration,
 * useLogoPanelGenerate, useLogoPanelHandlers, useLogoHistory) so the logo
 * canvas, settings rail, prompt dock, and AI helper share one engine.
 * Mounted only inside StudioShell; the classic LogoPanel keeps its own
 * wiring until the shell swap.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  LOGO_ASPECT_RATIOS,
  LOGO_BACKGROUND_REMOVAL_METHODS,
  LOGO_GENERATION_MODELS,
  LOGO_RESOLUTIONS,
  LOGO_TEXT_MODES,
} from '@/lib/logo-generation-contract'
import {
  LOGO_RENDER_TREATMENT_VALUES,
  LOGO_TYPE_VALUES,
  LOGO_TYPOGRAPHY_DIRECTION_VALUES,
  LOGO_VISUAL_STYLE_VALUES,
} from '../constants/logo-constants'
import { useLogoGeneration } from '../hooks/useLogoGeneration'
import { useLogoPanelHandlers } from '../hooks/useLogoPanelHandlers'
import { useFavorites } from '../components/SimpleFavorites'
import { useLogoHistory } from '../components/Logo/LogoHistory'
import { useLogoPanelGenerate, useLogoFavorite } from '../components/LogoPanel/useLogoPanelGenerate'
import type { LogoGeneratorSettingsPatch, LogoOutputContext } from '../components/LogoPanel'
import { useStudioLogoState } from './useStudio'

const isAllowedSetting = <T extends readonly string[]>(value: string | undefined, allowed: T): value is T[number] => {
  return Boolean(value && allowed.includes(value))
}

export interface LogoGenerationEngine {
  isGenerating: boolean
  error: string | null
  generatedLogo: ReturnType<typeof useLogoGeneration>['generatedLogo']
  latestLogoOutput: LogoOutputContext | null
  generateNow: () => void
  /** Queue a generate that runs in an effect after pending state updates flush. */
  requestGenerate: () => void
  /** Raw low-level generator from useLogoGeneration (wizard/batch flows). */
  generateLogo: ReturnType<typeof useLogoGeneration>['generateLogo']
  clearLogo: () => void
  downloadLogo: ReturnType<typeof useLogoGeneration>['downloadLogo']
  setLogo: ReturnType<typeof useLogoGeneration>['setLogo']
  addToHistory: ReturnType<typeof useLogoHistory>['addToHistory']
  /** Apply a validated settings patch to the lifted logo state. */
  applyLogoSettingsPatch: (settings: LogoGeneratorSettingsPatch) => void
  handleLogoGenerated: (url: string) => void
  /** Record a non-generated output (history restore, mockup send) as the latest logo output. */
  recordLogoOutput: (output: LogoOutputContext) => void
  buildHistoryLogoOutputContext: (item: Parameters<typeof historyContextBuilder>[0], source: 'history' | 'mockup') => LogoOutputContext
  handlers: ReturnType<typeof useLogoPanelHandlers>
  handleToggleFavorite: () => void
  isFavorite: (url: string) => boolean
  isFavoriteToggling: (url: string) => boolean
}

interface LogoHistoryItemLike {
  imageUrl: string
  prompt: string
  negativePrompt?: string
  timestamp?: number
  seed?: number
  style?: string
  config?: { aspectRatio?: unknown; textMode?: unknown; bgRemovalMethod?: unknown }
}

function historyContextBuilder(item: LogoHistoryItemLike, source: 'history' | 'mockup'): LogoOutputContext {
  return {
    url: item.imageUrl,
    prompt: item.prompt,
    negativePrompt: item.negativePrompt,
    timestamp: item.timestamp || Date.now(),
    aspectRatio: typeof item.config?.aspectRatio === 'string' ? item.config.aspectRatio : '1:1',
    textMode: typeof item.config?.textMode === 'string' ? item.config.textMode : 'ai-text',
    bgRemovalMethod: typeof item.config?.bgRemovalMethod === 'string' ? item.config.bgRemovalMethod : 'none',
    seed: item.seed,
    style: item.style,
    source,
  }
}

const LogoGenerationContext = createContext<LogoGenerationEngine | null>(null)

export function LogoGenerationProvider({ children }: { children: ReactNode }) {
  const state = useStudioLogoState()
  const { addToHistory } = useLogoHistory()
  const {
    isGenerating, error, generatedLogo, generateLogo, clearLogo, downloadLogo, setLogo,
  } = useLogoGeneration()
  const { toggleFavorite, isFavorite, isToggling: isFavoriteToggling } = useFavorites()

  const [latestLogoOutput, setLatestLogoOutput] = useState<LogoOutputContext | null>(null)

  const buildLogoOutputContext = useCallback((url: string, overrides: Partial<LogoOutputContext> = {}): LogoOutputContext => ({
    url,
    prompt: state.prompt.trim() || undefined,
    negativePrompt: state.negativePrompt.trim() || undefined,
    timestamp: Date.now(),
    aspectRatio: state.aspectRatio,
    textMode: state.textMode,
    bgRemovalMethod: state.bgRemovalMethod,
    seed: state.seedValue,
    style: state.getCombinedStyle(),
    source: 'generated',
    ...overrides,
  }), [
    state.prompt,
    state.negativePrompt,
    state.aspectRatio,
    state.textMode,
    state.bgRemovalMethod,
    state.seedValue,
    state.getCombinedStyle,
  ])

  const handleLogoGenerated = useCallback((url: string) => {
    setLatestLogoOutput(buildLogoOutputContext(url))
  }, [buildLogoOutputContext])

  const recordLogoOutput = useCallback((output: LogoOutputContext) => {
    setLatestLogoOutput(output)
  }, [])

  const handlers = useLogoPanelHandlers({
    generatedLogo,
    setLogo,
    bgRemovalMethod: state.bgRemovalMethod,
    onLogoGenerated: handleLogoGenerated,
    addToHistory,
  })

  const { handleGenerate } = useLogoPanelGenerate({
    state: {
      prompt: state.prompt,
      negativePrompt: state.negativePrompt,
      referenceImage: state.referenceImage,
      referenceMode: state.referenceMode,
      bgRemovalMethod: state.bgRemovalMethod,
      aspectRatio: state.aspectRatio,
      resolution: state.resolution,
      selectedModel: state.selectedModel,
      textMode: state.textMode,
      seedLocked: state.seedLocked,
      seedValue: state.seedValue,
      removeBackgroundOnly: state.removeBackgroundOnly,
      selectedPresetId: state.selectedPresetId,
      getCombinedStyle: state.getCombinedStyle,
      setSeedValue: state.setSeedValue,
    },
    generateLogo,
    handleRemoveRefBackground: handlers.handleRemoveRefBackground,
    addToHistory,
    onLogoGenerated: handleLogoGenerated,
  })

  const { handleToggleFavorite } = useLogoFavorite({ generatedLogo, toggleFavorite })

  // Queued generation, mirroring the image engine: runs after applied state
  // patches flush so the generate sees fresh settings.
  const [generateQueued, setGenerateQueued] = useState(false)
  const requestGenerate = useCallback(() => setGenerateQueued(true), [])
  useEffect(() => {
    if (!generateQueued) return
    setGenerateQueued(false)
    void handleGenerate()
  }, [generateQueued, handleGenerate])

  // Same validation rules as LogoPanel's applyPendingLogoSettings.
  const applyLogoSettingsPatch = useCallback((settings: LogoGeneratorSettingsPatch) => {
    if (isAllowedSetting(settings.textMode, LOGO_TEXT_MODES)) {
      state.setTextMode(settings.textMode)
    }
    if (isAllowedSetting(settings.selectedModel, LOGO_GENERATION_MODELS)) {
      state.setSelectedModel(settings.selectedModel)
    }
    if (isAllowedSetting(settings.bgRemovalMethod, LOGO_BACKGROUND_REMOVAL_METHODS)) {
      if (settings.bgRemovalMethod === 'native-transparent' && settings.selectedModel !== 'gpt-image-2') {
        state.setSelectedModel('gpt-image-2')
      }
      state.setBgRemovalMethod(settings.bgRemovalMethod)
    }
    if (isAllowedSetting(settings.resolution, LOGO_RESOLUTIONS)) {
      state.setResolution(settings.resolution)
    }
    if (isAllowedSetting(settings.aspectRatio, LOGO_ASPECT_RATIOS)) {
      state.setAspectRatio(settings.aspectRatio)
    }
    if (isAllowedSetting(settings.logoType, LOGO_TYPE_VALUES)) {
      state.setLogoType(settings.logoType)
    }
    if (isAllowedSetting(settings.logoVisualStyle, LOGO_VISUAL_STYLE_VALUES)) {
      state.setLogoVisualStyle(settings.logoVisualStyle)
    }
    if (isAllowedSetting(settings.logoRenderTreatment, LOGO_RENDER_TREATMENT_VALUES)) {
      state.setLogoRenderTreatment(settings.logoRenderTreatment)
    }
    if (isAllowedSetting(settings.logoTypographyDirection, LOGO_TYPOGRAPHY_DIRECTION_VALUES)) {
      state.setLogoTypographyDirection(settings.logoTypographyDirection)
    }
  }, [
    state.setAspectRatio,
    state.setBgRemovalMethod,
    state.setLogoRenderTreatment,
    state.setLogoType,
    state.setLogoTypographyDirection,
    state.setLogoVisualStyle,
    state.setResolution,
    state.setSelectedModel,
    state.setTextMode,
  ])

  const value = useMemo<LogoGenerationEngine>(() => ({
    isGenerating,
    error,
    generatedLogo,
    latestLogoOutput,
    generateNow: handleGenerate,
    requestGenerate,
    generateLogo,
    clearLogo,
    downloadLogo,
    setLogo,
    addToHistory,
    applyLogoSettingsPatch,
    handleLogoGenerated,
    recordLogoOutput,
    buildHistoryLogoOutputContext: historyContextBuilder,
    handlers,
    handleToggleFavorite,
    isFavorite,
    isFavoriteToggling,
  }), [
    isGenerating, error, generatedLogo, latestLogoOutput, handleGenerate, requestGenerate,
    generateLogo, clearLogo, downloadLogo, setLogo, addToHistory, applyLogoSettingsPatch,
    handleLogoGenerated, recordLogoOutput, handlers, handleToggleFavorite, isFavorite, isFavoriteToggling,
  ])

  return (
    <LogoGenerationContext.Provider value={value}>
      {children}
    </LogoGenerationContext.Provider>
  )
}

export function useLogoGenerationEngine(): LogoGenerationEngine {
  const engine = useContext(LogoGenerationContext)
  if (engine === null) {
    throw new Error('useLogoGenerationEngine must be used within <LogoGenerationProvider>')
  }
  return engine
}
