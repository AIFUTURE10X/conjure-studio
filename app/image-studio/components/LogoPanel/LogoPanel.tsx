"use client"

import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
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
} from '../../constants/logo-constants'
import { useLogoGeneration } from '../../hooks/useLogoGeneration'
import { useLogoPanelHandlers } from '../../hooks/useLogoPanelHandlers'
import { useLogoPanelState } from '../../hooks/useLogoPanelState'
import { useFavorites } from '../SimpleFavorites'

import { LogoPromptSection } from '../Logo/LogoPromptSection'
import { LogoAdvancedSettings } from '../Logo/LogoAdvancedSettings'
import { LogoPreviewPanel, type LogoFilterStyle } from '../Logo/LogoPreviewPanel'
import { LogoActionButtons } from '../Logo/LogoActionButtons'
import { LogoHistoryPanel, useLogoHistory, type LogoHistoryItem } from '../Logo/LogoHistory'
import { LogoHistoryModal } from '../Logo/LogoHistory/LogoHistoryModal'

import { LogoPanelHeader } from './LogoPanelHeader'
import { LogoPanelModals } from './LogoPanelModals'
import { LogoModeSection } from './LogoModeSection'
import { LogoGenerateSection } from './LogoGenerateSection'
import { useLogoPanelGenerate, useLogoFavorite } from './useLogoPanelGenerate'
import type { DotMatrixConfig } from '../../constants/dot-matrix-config'

interface LogoPanelProps {
  onLogoGenerated?: (output: LogoOutputContext) => void
  externalPrompt?: string
  externalNegativePrompt?: string
  pendingLogoConfig?: Partial<DotMatrixConfig> | null
  onClearPendingConfig?: () => void
  pendingLogoSettings?: LogoGeneratorSettingsPatch | null
  onClearPendingSettings?: () => void
  onLogoContextChange?: (context: LogoGeneratorContext) => void
}

export interface LogoPanelRef {
  triggerGenerate: () => void
  isGenerating: boolean
}

export interface LogoOutputContext {
  url: string
  prompt?: string
  negativePrompt?: string
  timestamp: number
  aspectRatio?: string
  textMode?: string
  bgRemovalMethod?: string
  seed?: number
  style?: string
  source?: 'generated' | 'history' | 'mockup' | 'recolored'
}

export interface LogoGeneratorContext {
  bgRemovalMethod: string
  bgRemovalEnabled: boolean
  removeBackgroundOnly: boolean
  selectedModel: string
  resolution: string
  aspectRatio: string
  textMode: string
  logoType: string
  logoVisualStyle: string
  logoRenderTreatment: string
  logoTypographyDirection: string
  hasReferenceImage: boolean
  referenceMode: string
}

export interface LogoGeneratorSettingsPatch {
  bgRemovalMethod?: string
  textMode?: string
  selectedModel?: string
  resolution?: string
  aspectRatio?: string
  logoType?: string
  logoVisualStyle?: string
  logoRenderTreatment?: string
  logoTypographyDirection?: string
}

const isAllowedSetting = <T extends readonly string[]>(value: string | undefined, allowed: T): value is T[number] => {
  return Boolean(value && allowed.includes(value))
}

export const LogoPanel = forwardRef<LogoPanelRef, LogoPanelProps>(function LogoPanel({
  onLogoGenerated,
  externalPrompt,
  externalNegativePrompt,
  pendingLogoConfig,
  onClearPendingConfig,
  pendingLogoSettings,
  onClearPendingSettings,
  onLogoContextChange
}, ref) {
  // Use extracted state hook
  const state = useLogoPanelState({
    externalPrompt,
    externalNegativePrompt,
    pendingLogoConfig
  })

  const { addToHistory } = useLogoHistory()

  const {
    isGenerating, error, generatedLogo, generateLogo, clearLogo, downloadLogo, setLogo
  } = useLogoGeneration()

  const { toggleFavorite, isFavorite, isToggling: isFavoriteToggling } = useFavorites()

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
    onLogoGenerated?.(buildLogoOutputContext(url))
  }, [buildLogoOutputContext, onLogoGenerated])

  const buildHistoryLogoOutputContext = useCallback((item: LogoHistoryItem, source: 'history' | 'mockup'): LogoOutputContext => ({
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
  }), [])

  const {
    isRemovingLogoBg, isUpscaling, isExportingSvg, isExportingPdf, copied: handlerCopied, isRemovingRefBg,
    handleRemoveLogoBackground, handleUpscale, handleCopyToClipboard, handleExportSvg, handleExportPdf, handleRemoveRefBackground
  } = useLogoPanelHandlers({ generatedLogo, setLogo, bgRemovalMethod: state.bgRemovalMethod, onLogoGenerated: handleLogoGenerated, addToHistory })

  // Track color filter from LogoPreviewPanel for mockups
  const [logoFilter, setLogoFilter] = useState<LogoFilterStyle>({})

  const applyPendingLogoSettings = useCallback((settings: LogoGeneratorSettingsPatch) => {
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

  useEffect(() => {
    if (!pendingLogoSettings) return
    applyPendingLogoSettings(pendingLogoSettings)
    onClearPendingSettings?.()
  }, [applyPendingLogoSettings, onClearPendingSettings, pendingLogoSettings])

  useEffect(() => {
    onLogoContextChange?.({
      bgRemovalMethod: state.bgRemovalMethod,
      bgRemovalEnabled: state.bgRemovalMethod !== 'none',
      removeBackgroundOnly: state.removeBackgroundOnly,
      selectedModel: state.selectedModel,
      resolution: state.resolution,
      aspectRatio: state.aspectRatio,
      textMode: state.textMode,
      logoType: state.logoType,
      logoVisualStyle: state.logoVisualStyle,
      logoRenderTreatment: state.logoRenderTreatment,
      logoTypographyDirection: state.logoTypographyDirection,
      hasReferenceImage: Boolean(state.referenceImage),
      referenceMode: state.referenceMode,
    })
  }, [
    onLogoContextChange,
    state.bgRemovalMethod,
    state.removeBackgroundOnly,
    state.selectedModel,
    state.resolution,
    state.aspectRatio,
    state.textMode,
    state.logoType,
    state.logoVisualStyle,
    state.logoRenderTreatment,
    state.logoTypographyDirection,
    state.referenceImage,
    state.referenceMode,
  ])

  // Use extracted hooks for generate and favorite logic
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
    handleRemoveRefBackground,
    addToHistory,
    onLogoGenerated: handleLogoGenerated,
  })

  const { handleToggleFavorite } = useLogoFavorite({
    generatedLogo,
    toggleFavorite,
  })

  useImperativeHandle(ref, () => ({ triggerGenerate: handleGenerate, isGenerating }), [handleGenerate, isGenerating])

  const handleClearAll = () => { state.handleClearAll(); clearLogo() }

  // Generation History pop-out (full-size modal, like the image generator's
  // Parameter History). The inline bar below only triggers this modal.
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  const historyUseSettings = (item: LogoHistoryItem) => {
    state.setPrompt(item.prompt)
    if (item.negativePrompt) state.setNegativePrompt(item.negativePrompt)
    if (item.seed) {
      state.setSeedValue(item.seed)
      state.setSeedLocked(true)
    }
    if (item.config?.aspectRatio) state.setAspectRatio(item.config.aspectRatio)
    if (item.config?.textMode) state.setTextMode(item.config.textMode)
    if (item.presetId) state.setSelectedPresetId(item.presetId)
  }

  const historyLoadImage = (item: LogoHistoryItem) => {
    setLogo({
      url: item.imageUrl,
      prompt: item.prompt,
      style: item.style || '',
      aspectRatio: item.config?.aspectRatio || '1:1',
      textMode: item.config?.textMode || 'ai-text',
      bgRemovalMethod: item.config?.bgRemovalMethod || 'none',
      timestamp: item.timestamp,
      seed: item.seed
    })
    historyUseSettings(item)
    onLogoGenerated?.(buildHistoryLogoOutputContext(item, 'history'))
    setShowHistoryModal(false)
    toast.success('Image loaded! You can now preview on mockups.', { duration: 3000 })
  }

  const historySendToMockups = (item: LogoHistoryItem) => {
    setLogo({
      url: item.imageUrl,
      prompt: item.prompt,
      style: item.style || '',
      aspectRatio: item.config?.aspectRatio || '1:1',
      textMode: item.config?.textMode || 'ai-text',
      bgRemovalMethod: item.config?.bgRemovalMethod || 'none',
      timestamp: item.timestamp,
      seed: item.seed
    })
    if (item.config?.aspectRatio) state.setAspectRatio(item.config.aspectRatio)
    if (item.config?.textMode) state.setTextMode(item.config.textMode)
    onLogoGenerated?.(buildHistoryLogoOutputContext(item, 'mockup'))
    setShowHistoryModal(false)
    state.setShowMockupPreview(true)
    toast.success('Logo sent to mockups!')
  }

  const historyCompare = (items: LogoHistoryItem[]) => {
    state.setComparisonItems(items)
    state.setShowComparisonView(true)
  }

  return (
    <Card className="bg-zinc-900/90 border border-zinc-800 p-4">
      <LogoPanelHeader
        logoMode={state.logoMode}
        setLogoMode={state.setLogoMode}
        onClearAll={handleClearAll}
      />

      <div className="flex gap-4">
        <div className="flex-1 space-y-3">
          <LogoModeSection
            logoMode={state.logoMode}
            setLogoMode={state.setLogoMode}
            removeBackgroundOnly={state.removeBackgroundOnly}
            isGenerating={isGenerating}
            isRemovingRefBg={isRemovingRefBg}
            onOpenWizard={() => state.setShowLogoWizard(true)}
            onApplyPreset={(presetPrompt, presetNegative, concept, renderStyles) => {
              state.setPrompt(presetPrompt)
              if (presetNegative) state.setNegativePrompt(presetNegative)
              state.setSelectedConcept(concept)
              state.setSelectedRenders(renderStyles)
            }}
            onApplyReference={(artwork) => {
              // Always Inspire — Replicate would aim the model at the original wordmark.
              if (state.referenceImage?.preview) {
                URL.revokeObjectURL(state.referenceImage.preview)
              }
              state.setReferenceImage(artwork)
              state.setReferenceMode('inspire')
            }}
            onKeepBackground={() => state.setBgRemovalMethod('none')}
            onApplyStyleSettings={(s) => {
              state.setLogoType(s.logoType)
              state.setLogoVisualStyle(s.visualStyle)
              state.setLogoRenderTreatment(s.renderTreatment)
              state.setLogoTypographyDirection(s.typography)
            }}
            onOpenDotMatrixConfigurator={() => state.setShowDotMatrixConfigurator(true)}
            onOpenUnifiedConfigurator={(presetId) => {
              state.setSelectedPresetId(presetId)
              state.setShowUnifiedConfigurator(true)
            }}
            onOpenUnifiedConfiguratorWithConfig={(presetId, config) => {
              state.setSelectedPresetId(presetId)
              state.setWizardConfig(config)
              state.setShowUnifiedConfigurator(true)
            }}
          />

          <LogoPromptSection
            prompt={state.prompt}
            setPrompt={state.setPrompt}
            negativePrompt={state.negativePrompt}
            setNegativePrompt={state.setNegativePrompt}
            referenceImage={state.referenceImage}
            setReferenceImage={state.setReferenceImage}
            referenceMode={state.referenceMode}
            setReferenceMode={state.setReferenceMode}
            removeBackgroundOnly={state.removeBackgroundOnly}
            setRemoveBackgroundOnly={state.setRemoveBackgroundOnly}
            isGenerating={isGenerating}
            isRemovingBackground={isRemovingRefBg}
          />

          <LogoAdvancedSettings
            showAdvanced={state.showAdvanced}
            setShowAdvanced={state.setShowAdvanced}
            resolution={state.resolution}
            setResolution={state.setResolution}
            aspectRatio={state.aspectRatio}
            setAspectRatio={state.setAspectRatio}
            selectedModel={state.selectedModel}
            setSelectedModel={state.setSelectedModel}
            textMode={state.textMode}
            setTextMode={state.setTextMode}
            logoType={state.logoType}
            setLogoType={state.setLogoType}
            logoVisualStyle={state.logoVisualStyle}
            setLogoVisualStyle={state.setLogoVisualStyle}
            logoRenderTreatment={state.logoRenderTreatment}
            setLogoRenderTreatment={state.setLogoRenderTreatment}
            logoTypographyDirection={state.logoTypographyDirection}
            setLogoTypographyDirection={state.setLogoTypographyDirection}
            selectedConcept={state.selectedConcept}
            setSelectedConcept={state.setSelectedConcept}
            selectedRenders={state.selectedRenders}
            setSelectedRenders={state.setSelectedRenders}
            seedLocked={state.seedLocked}
            setSeedLocked={state.setSeedLocked}
            seedValue={state.seedValue}
            setSeedValue={state.setSeedValue}
            bgRemovalMethod={state.bgRemovalMethod}
            setBgRemovalMethod={state.setBgRemovalMethod}
            isGenerating={isGenerating}
            isRemovingBackground={isRemovingRefBg}
          />

          <LogoGenerateSection
            isGenerating={isGenerating}
            isRemovingRefBg={isRemovingRefBg}
            removeBackgroundOnly={state.removeBackgroundOnly}
            hasPrompt={!!state.prompt.trim()}
            hasReferenceImage={!!state.referenceImage}
            onGenerate={handleGenerate}
            onOpenBatchGenerator={() => {
              const combinedStyle = state.getCombinedStyle()
              state.setBatchOptions({
                prompt: state.prompt.trim() || 'Modern professional logo design',
                negativePrompt: state.negativePrompt.trim() || undefined,
                style: combinedStyle,
                bgRemovalMethod: state.bgRemovalMethod,
                aspectRatio: state.aspectRatio,
                resolution: state.resolution,
                textMode: state.textMode,
                baseSeed: state.seedLocked ? state.seedValue : undefined,
              })
              state.setShowBatchGenerator(true)
            }}
            error={error}
          />

          {generatedLogo && (
            <LogoActionButtons
              generatedLogo={generatedLogo}
              onShowTextEditor={() => state.setShowTextEditor(true)}
              onToggleEraserMode={() => state.setIsEraserMode(!state.isEraserMode)}
              isEraserMode={state.isEraserMode}
              onDownload={() => downloadLogo(generatedLogo)}
              onExportSvg={handleExportSvg}
              isExportingSvg={isExportingSvg}
              onExportPdf={handleExportPdf}
              isExportingPdf={isExportingPdf}
              onCopyToClipboard={handleCopyToClipboard}
              copied={handlerCopied}
              onUpscale={handleUpscale}
              isUpscaling={isUpscaling}
              onToggleFavorite={handleToggleFavorite}
              isFavorite={isFavorite(generatedLogo.url)}
              isFavoriteToggling={isFavoriteToggling(generatedLogo.url)}
              onRemoveBackground={handleRemoveLogoBackground}
              isRemovingBackground={isRemovingLogoBg}
              onShowMockup={() => state.setShowMockupPreview(true)}
              onShowRealFontOverlay={() => state.setShowRealFontOverlay(true)}
            />
          )}

          <LogoHistoryPanel
            onPopOut={() => setShowHistoryModal(true)}
            onUseSettings={historyUseSettings}
            onLoadImage={historyLoadImage}
            onSendToMockups={historySendToMockups}
            onCompare={historyCompare}
          />

          <LogoHistoryModal
            isOpen={showHistoryModal}
            onClose={() => setShowHistoryModal(false)}
            onUseSettings={historyUseSettings}
            onLoadImage={historyLoadImage}
            onSendToMockups={historySendToMockups}
            onCompare={historyCompare}
          />

          {!generatedLogo && (
            <p className="text-[10px] text-zinc-500 text-center">
              AI-powered transparent PNG with clean edges
            </p>
          )}
        </div>

        <LogoPreviewPanel
          generatedLogo={generatedLogo}
          onClearLogo={clearLogo}
          onPreviewMockups={generatedLogo ? () => state.setShowMockupPreview(true) : undefined}
          onFilterChange={setLogoFilter}
          onRecolored={(newUrl) => {
            // Update the logo with the recolored version
            if (generatedLogo) {
              setLogo({
                ...generatedLogo,
                url: newUrl,
              })
              onLogoGenerated?.(buildLogoOutputContext(newUrl, { source: 'recolored' }))
            }
          }}
        />
      </div>

      <LogoPanelModals
        showTextEditor={state.showTextEditor} setShowTextEditor={state.setShowTextEditor}
        isEraserMode={state.isEraserMode} setIsEraserMode={state.setIsEraserMode}
        showDotMatrixConfigurator={state.showDotMatrixConfigurator} setShowDotMatrixConfigurator={state.setShowDotMatrixConfigurator}
        pendingLogoConfig={pendingLogoConfig} onClearPendingConfig={onClearPendingConfig}
        showUnifiedConfigurator={state.showUnifiedConfigurator} setShowUnifiedConfigurator={state.setShowUnifiedConfigurator}
        selectedPresetId={state.selectedPresetId} setSelectedPresetId={state.setSelectedPresetId}
        wizardConfig={state.wizardConfig} setWizardConfig={state.setWizardConfig}
        showLogoWizard={state.showLogoWizard} setShowLogoWizard={state.setShowLogoWizard} setLogoMode={state.setLogoMode}
        showBatchGenerator={state.showBatchGenerator} setShowBatchGenerator={state.setShowBatchGenerator}
        batchOptions={state.batchOptions} setBatchOptions={state.setBatchOptions}
        showMockupPreview={state.showMockupPreview} setShowMockupPreview={state.setShowMockupPreview}
        showComparisonView={state.showComparisonView} setShowComparisonView={state.setShowComparisonView}
        comparisonItems={state.comparisonItems} setComparisonItems={state.setComparisonItems}
        showRealFontOverlay={state.showRealFontOverlay} setShowRealFontOverlay={state.setShowRealFontOverlay}
        generatedLogo={generatedLogo} setLogo={setLogo}
        bgRemovalMethod={state.bgRemovalMethod} resolution={state.resolution}
        aspectRatio={state.aspectRatio}
        textMode={state.textMode}
        seedLocked={state.seedLocked} seedValue={state.seedValue} setSeedValue={state.setSeedValue}
        setPrompt={state.setPrompt} setNegativePrompt={state.setNegativePrompt}
        setSelectedConcept={state.setSelectedConcept} setSelectedRenders={state.setSelectedRenders}
        generateLogo={generateLogo} addToHistory={addToHistory}
        onLogoGenerated={handleLogoGenerated} prompt={state.prompt}
        logoFilter={logoFilter}
      />
    </Card>
  )
})
