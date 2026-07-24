"use client"

/**
 * LogoCanvas
 *
 * Center workspace canvas for logo mode: guided/expert mode section,
 * action buttons, preview panel, history, and the logo modals — wired to
 * the lifted logo state and the shared logo engine. Mirrors LogoPanel's
 * output side; prompt entry lives in the PromptDock and settings in the
 * LogoSettingsRail.
 */

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { LogoModeSection } from '../LogoPanel/LogoModeSection'
import { LogoPanelModals } from '../LogoPanel/LogoPanelModals'
import { LogoActionButtons } from '../Logo/LogoActionButtons'
import { LogoPreviewPanel, type LogoFilterStyle } from '../Logo/LogoPreviewPanel'
import { LogoHistoryPanel, type LogoHistoryItem } from '../Logo/LogoHistory'
import { LogoHistoryModal } from '../Logo/LogoHistory/LogoHistoryModal'
import { ConjureBrandPresets } from '../Logo/ConjureBrandPresets'
import { LogoVariationsGenerator } from '../Logo/LogoVariations'
import type { ConjureBrandPreset } from '../../constants/conjure-brand-presets'
import { useStudioCore, useStudioLogoState, useStudioMode } from '../../context/useStudio'
import { useLogoGenerationEngine } from '../../context/LogoGenerationProvider'

export function LogoCanvas() {
  const state = useStudioLogoState()
  const { state: coreState } = useStudioCore()
  const { promptCollapsed, setPromptCollapsed } = useStudioMode()

  // Apply a one-click brand preset: write the prompt to both stores (dock +
  // generator), set every chip, and reveal the dock so the prompt is editable.
  const applyBrandPreset = (preset: ConjureBrandPreset) => {
    coreState.setMainPrompt(preset.prompt)
    state.setPrompt(preset.prompt)
    coreState.setNegativePrompt(preset.negativePrompt)
    state.setNegativePrompt(preset.negativePrompt)
    state.setLogoType(preset.logoType)
    state.setLogoVisualStyle(preset.visualStyle)
    state.setLogoRenderTreatment(preset.renderTreatment)
    state.setLogoTypographyDirection(preset.typography)
    state.setTextMode(preset.textMode)
    state.setAspectRatio(preset.aspectRatio)
    state.setResolution(preset.resolution)
    state.setBgRemovalMethod(preset.bgRemovalMethod)
    setPromptCollapsed(false)
    toast.success(`"${preset.name}" applied — tweak the prompt or hit Generate.`)
  }

  // Load a title style's artwork into the reference slot. Always Inspire —
  // Replicate would point the model at the original wordmark.
  const applyTitleStyleArtwork = (artwork: { file: File; preview: string }) => {
    if (state.referenceImage?.preview) URL.revokeObjectURL(state.referenceImage.preview)
    state.setReferenceImage(artwork)
    state.setReferenceMode('inspire')
  }

  // History restores write the prompt to both stores so the shared
  // PromptDock reflects it and a follow-up generate uses it.
  const restorePrompts = (prompt: string, negativePrompt?: string) => {
    coreState.setMainPrompt(prompt)
    state.setPrompt(prompt)
    if (negativePrompt) {
      coreState.setNegativePrompt(negativePrompt)
      state.setNegativePrompt(negativePrompt)
    }
  }
  const {
    isGenerating, error, generatedLogo,
    clearLogo, downloadLogo, setLogo, addToHistory, generateLogo,
    handleLogoGenerated, recordLogoOutput, buildHistoryLogoOutputContext, handlers,
    handleToggleFavorite, isFavorite, isFavoriteToggling, applyLogoSettingsPatch,
  } = useLogoGenerationEngine()

  // Apply an AI-generated variation patch, then reveal the dock to edit it.
  const applyVariationPatch = (patch: Parameters<typeof applyLogoSettingsPatch>[0]) => {
    applyLogoSettingsPatch(patch)
    setPromptCollapsed(false)
  }

  const [logoFilter, setLogoFilter] = useState<LogoFilterStyle>({})

  // Generation History pop-out — full-size modal like Parameter History.
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  const historyUseSettings = (item: LogoHistoryItem) => {
    restorePrompts(item.prompt, item.negativePrompt)
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
    recordLogoOutput(buildHistoryLogoOutputContext(item, 'history'))
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
    recordLogoOutput(buildHistoryLogoOutputContext(item, 'mockup'))
    setShowHistoryModal(false)
    state.setShowMockupPreview(true)
    toast.success('Logo sent to mockups!')
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <Card className="min-h-full bg-zinc-900/90 border border-zinc-800 p-4">
        <div className={`flex flex-col gap-4 ${promptCollapsed ? '' : '2xl:flex-row'}`}>
          <div className="flex-1 space-y-3 min-w-0">
            <LogoModeSection
              logoMode={state.logoMode}
              setLogoMode={state.setLogoMode}
              removeBackgroundOnly={state.removeBackgroundOnly}
              isGenerating={isGenerating}
              isRemovingRefBg={handlers.isRemovingRefBg}
              onOpenWizard={() => state.setShowLogoWizard(true)}
              onApplyPreset={(presetPrompt, presetNegative, concept, renderStyles) => {
                // Write to both stores — the visible PromptDock reads coreState,
                // the generator reads the logo state. Writing only one leaves the
                // dock empty while generation still uses the preset.
                coreState.setMainPrompt(presetPrompt)
                state.setPrompt(presetPrompt)
                if (presetNegative) {
                  coreState.setNegativePrompt(presetNegative)
                  state.setNegativePrompt(presetNegative)
                }
                state.setSelectedConcept(concept)
                state.setSelectedRenders(renderStyles)
                setPromptCollapsed(false)
              }}
              onApplyReference={applyTitleStyleArtwork}
              onKeepBackground={() => state.setBgRemovalMethod('none')}
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

            {!state.removeBackgroundOnly && (
              <ConjureBrandPresets onApply={applyBrandPreset} disabled={isGenerating} />
            )}

            {!state.removeBackgroundOnly && (
              <LogoVariationsGenerator
                onApply={applyVariationPatch}
                currentLogoPrompt={coreState.mainPrompt}
                disabled={isGenerating}
              />
            )}

            {generatedLogo && (
              <LogoActionButtons
                generatedLogo={generatedLogo}
                onShowTextEditor={() => state.setShowTextEditor(true)}
                onToggleEraserMode={() => state.setIsEraserMode(!state.isEraserMode)}
                isEraserMode={state.isEraserMode}
                onDownload={() => downloadLogo(generatedLogo)}
                onExportSvg={handlers.handleExportSvg}
                isExportingSvg={handlers.isExportingSvg}
                onExportPdf={handlers.handleExportPdf}
                isExportingPdf={handlers.isExportingPdf}
                onCopyToClipboard={handlers.handleCopyToClipboard}
                copied={handlers.copied}
                onUpscale={handlers.handleUpscale}
                isUpscaling={handlers.isUpscaling}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite(generatedLogo.url)}
                isFavoriteToggling={isFavoriteToggling(generatedLogo.url)}
                onRemoveBackground={handlers.handleRemoveLogoBackground}
                isRemovingBackground={handlers.isRemovingLogoBg}
                onShowMockup={() => state.setShowMockupPreview(true)}
                onShowRealFontOverlay={() => state.setShowRealFontOverlay(true)}
              />
            )}

            {error && (
              <Card className="bg-red-900/20 border-red-900/50 p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </Card>
            )}

            <LogoHistoryPanel
              onPopOut={() => setShowHistoryModal(true)}
              onUseSettings={historyUseSettings}
              onLoadImage={historyLoadImage}
              onSendToMockups={historySendToMockups}
              onCompare={(items) => {
                state.setComparisonItems(items)
                state.setShowComparisonView(true)
              }}
            />

            <LogoHistoryModal
              isOpen={showHistoryModal}
              onClose={() => setShowHistoryModal(false)}
              onUseSettings={historyUseSettings}
              onLoadImage={historyLoadImage}
              onSendToMockups={historySendToMockups}
              onCompare={(items) => {
                state.setComparisonItems(items)
                state.setShowComparisonView(true)
              }}
            />

            {!generatedLogo && (
              <p className="text-[10px] text-zinc-500 text-center">
                AI-powered transparent PNG with clean edges
              </p>
            )}
          </div>

          <LogoPreviewPanel
            stacked={promptCollapsed}
            generatedLogo={generatedLogo}
            onClearLogo={clearLogo}
            onPreviewMockups={generatedLogo ? () => state.setShowMockupPreview(true) : undefined}
            onFilterChange={setLogoFilter}
            onRecolored={(newUrl) => {
              if (generatedLogo) {
                setLogo({
                  ...generatedLogo,
                  url: newUrl,
                })
                handleLogoGenerated(newUrl)
              }
            }}
          />
        </div>

        <LogoPanelModals
          showTextEditor={state.showTextEditor} setShowTextEditor={state.setShowTextEditor}
          isEraserMode={state.isEraserMode} setIsEraserMode={state.setIsEraserMode}
          showDotMatrixConfigurator={state.showDotMatrixConfigurator} setShowDotMatrixConfigurator={state.setShowDotMatrixConfigurator}
          pendingLogoConfig={null} onClearPendingConfig={undefined}
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
    </div>
  )
}
