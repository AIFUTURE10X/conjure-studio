"use client"

import { toast } from 'sonner'
import { TextOverlayEditor } from '../TextOverlayEditor'
import { EraserToolModal } from '../Logo/EraserToolModal'
import { DotMatrixConfigurator } from '../Logo/DotMatrixConfigurator'
import { UnifiedConfigurator } from '../Logo/UnifiedConfigurator'
import { LogoWizard } from '../Logo/LogoWizard'
import { BatchGenerator } from '../Logo/BatchGeneration'
import { MockupPreview } from '../Logo/MockupPreview'
import { ComparisonView, LogoHistoryItem } from '../Logo/LogoHistory'
import { RealFontOverlay } from '../Logo/RealFontOverlay'
import { BatchGenerationOptions } from '../../hooks/useBatchGeneration'
import { GeneratedLogo, BgRemovalMethod, LogoAspectRatio, LogoGenerationOptions, LogoResolution, LogoTextMode } from '../../hooks/useLogoGeneration'
import type { DotMatrixConfig } from '../../constants/dot-matrix-config'
import type { UnifiedLogoConfig } from '../../constants/preset-schemas'
import { buildFullPrompt, buildNegativePromptForPreset } from '../../constants/preset-schemas'

interface LogoPanelModalsProps {
  showTextEditor: boolean; setShowTextEditor: (show: boolean) => void
  isEraserMode: boolean; setIsEraserMode: (mode: boolean) => void
  showDotMatrixConfigurator: boolean; setShowDotMatrixConfigurator: (show: boolean) => void
  pendingLogoConfig?: Partial<DotMatrixConfig> | null; onClearPendingConfig?: () => void
  showUnifiedConfigurator: boolean; setShowUnifiedConfigurator: (show: boolean) => void
  selectedPresetId: string; setSelectedPresetId: (id: string) => void
  wizardConfig: Record<string, any> | null; setWizardConfig: (config: Record<string, any> | null) => void
  showLogoWizard: boolean; setShowLogoWizard: (show: boolean) => void; setLogoMode: (mode: 'guided' | 'expert') => void
  showBatchGenerator: boolean; setShowBatchGenerator: (show: boolean) => void
  batchOptions: BatchGenerationOptions | null; setBatchOptions: (options: BatchGenerationOptions | null) => void
  showMockupPreview: boolean; setShowMockupPreview: (show: boolean) => void
  showComparisonView: boolean; setShowComparisonView: (show: boolean) => void
  comparisonItems: LogoHistoryItem[]; setComparisonItems: (items: LogoHistoryItem[]) => void
  showRealFontOverlay: boolean; setShowRealFontOverlay: (show: boolean) => void
  generatedLogo: GeneratedLogo | null; setLogo: (logo: GeneratedLogo) => void
  bgRemovalMethod: BgRemovalMethod; aspectRatio: LogoAspectRatio; textMode: LogoTextMode; resolution: LogoResolution
  seedLocked: boolean; seedValue: number | undefined; setSeedValue: (value: number | undefined) => void
  setPrompt: (prompt: string) => void; setNegativePrompt: (prompt: string) => void
  setSelectedConcept: (concept: any) => void; setSelectedRenders: (renders: any[]) => void
  generateLogo: (options: LogoGenerationOptions) => Promise<GeneratedLogo>; addToHistory: (item: any) => void
  onLogoGenerated?: (url: string) => void; prompt: string
  logoFilter?: React.CSSProperties
}

export function LogoPanelModals({
  showTextEditor, setShowTextEditor,
  isEraserMode, setIsEraserMode,
  showDotMatrixConfigurator, setShowDotMatrixConfigurator,
  pendingLogoConfig, onClearPendingConfig,
  showUnifiedConfigurator, setShowUnifiedConfigurator,
  selectedPresetId, setSelectedPresetId,
  wizardConfig, setWizardConfig,
  showLogoWizard, setShowLogoWizard, setLogoMode,
  showBatchGenerator, setShowBatchGenerator,
  batchOptions, setBatchOptions,
  showMockupPreview, setShowMockupPreview,
  showComparisonView, setShowComparisonView,
  comparisonItems, setComparisonItems,
  showRealFontOverlay, setShowRealFontOverlay,
  generatedLogo, setLogo,
  bgRemovalMethod, aspectRatio, textMode, resolution,
  seedLocked, seedValue, setSeedValue,
  setPrompt, setNegativePrompt,
  setSelectedConcept, setSelectedRenders,
  generateLogo, addToHistory, onLogoGenerated,
  prompt,
  logoFilter
}: LogoPanelModalsProps) {

  const handleDotMatrixGenerate = async (generatedPrompt: string, generatedNegativePrompt: string) => {
    setPrompt(generatedPrompt)
    setNegativePrompt(generatedNegativePrompt)
    setSelectedConcept('modern')
    setSelectedRenders(['3d-metallic'])
    setShowDotMatrixConfigurator(false)
    onClearPendingConfig?.()

    try {
      const logo = await generateLogo({
        prompt: generatedPrompt,
        negativePrompt: generatedNegativePrompt || undefined,
        style: 'modern+3d-metallic' as any,
        bgRemovalMethod,
        aspectRatio,
        textMode,
        resolution,
        seed: seedLocked ? seedValue : undefined
      })
      if (logo.seed !== undefined) {
        setSeedValue(logo.seed)
      }
      onLogoGenerated?.(logo.url)
    } catch (err) {
      // Error handled by hook
    }
  }

  const handleUnifiedGenerate = async (generatedPrompt: string, generatedNegativePrompt: string) => {
    setPrompt(generatedPrompt)
    setNegativePrompt(generatedNegativePrompt)
    setSelectedConcept('modern')
    setSelectedRenders(['3d-metallic'])
    setShowUnifiedConfigurator(false)
    setWizardConfig(null)

    try {
      const logo = await generateLogo({
        prompt: generatedPrompt,
        negativePrompt: generatedNegativePrompt || undefined,
        style: 'modern+3d-metallic' as any,
        bgRemovalMethod,
        aspectRatio,
        textMode,
        resolution,
        seed: seedLocked ? seedValue : undefined
      })
      if (logo.seed !== undefined) {
        setSeedValue(logo.seed)
      }
      onLogoGenerated?.(logo.url)
    } catch (err) {
      // Error handled by hook
    }
  }

  const handleWizardGenerateNow = async (presetId: string, config: Record<string, any>, wizardResolution?: LogoResolution) => {
    const generatedPrompt = buildFullPrompt(presetId, config as Partial<UnifiedLogoConfig>)
    const generatedNegativePrompt = buildNegativePromptForPreset(config as Partial<UnifiedLogoConfig>)
    const shouldRemoveBg = config.removeBackground === true
    // Use wizard-selected resolution if provided, otherwise fall back to panel resolution
    const effectiveResolution = wizardResolution || resolution

    setPrompt(generatedPrompt)
    setNegativePrompt(generatedNegativePrompt)
    setSelectedPresetId(presetId)
    setSelectedConcept('modern')
    setSelectedRenders(['3d-metallic'])
    setShowLogoWizard(false)

    try {
      const logo = await generateLogo({
        prompt: generatedPrompt,
        negativePrompt: generatedNegativePrompt,
        style: 'modern+3d-metallic' as any,
        bgRemovalMethod: shouldRemoveBg ? bgRemovalMethod : 'none',
        skipBgRemoval: !shouldRemoveBg,
        aspectRatio,
        textMode,
        resolution: effectiveResolution,
        seed: seedLocked ? seedValue : undefined
      })
      if (logo.seed !== undefined) {
        setSeedValue(logo.seed)
      }

      addToHistory({
        imageUrl: logo.url,
        prompt: generatedPrompt,
        negativePrompt: generatedNegativePrompt,
        seed: logo.seed,
        style: 'modern+3d-metallic',
        presetId: presetId,
        config: {
          wasBackgroundRemoval: shouldRemoveBg,
          bgRemovalMethod: shouldRemoveBg ? bgRemovalMethod : undefined,
          aspectRatio,
          textMode,
          resolution: effectiveResolution,
        }
      })

      onLogoGenerated?.(logo.url)

      // Show tip to regenerate if not satisfied
      toast.info("If you don't like this logo, generate again for a better result!", {
        duration: 5000,
      })
    } catch (err) {
      // Error handled by hook
    }
  }

  return (
    <>
      {/* Text Overlay Editor Modal */}
      {showTextEditor && generatedLogo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <TextOverlayEditor
            logoUrl={generatedLogo.url}
            onClose={() => setShowTextEditor(false)}
            onExport={(dataUrl) => {
              const link = document.createElement('a')
              link.href = dataUrl
              link.download = `logo-with-text-${Date.now()}.png`
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              setShowTextEditor(false)
            }}
          />
        </div>
      )}

      {/* Eraser Tool Modal */}
      {isEraserMode && generatedLogo && (
        <EraserToolModal
          generatedLogo={generatedLogo}
          onClose={() => setIsEraserMode(false)}
          onUpdateLogo={setLogo}
        />
      )}

      {/* Dot Matrix Configurator Modal */}
      <DotMatrixConfigurator
        isOpen={showDotMatrixConfigurator}
        onClose={() => {
          setShowDotMatrixConfigurator(false)
          onClearPendingConfig?.()
        }}
        initialConfig={pendingLogoConfig || undefined}
        onGenerate={handleDotMatrixGenerate}
      />

      {/* Unified Configurator Modal */}
      <UnifiedConfigurator
        isOpen={showUnifiedConfigurator}
        onClose={() => setShowUnifiedConfigurator(false)}
        presetId={selectedPresetId}
        initialConfig={wizardConfig || undefined}
        onGenerate={handleUnifiedGenerate}
      />

      {/* Logo Wizard Modal */}
      <LogoWizard
        isOpen={showLogoWizard}
        onClose={() => setShowLogoWizard(false)}
        onSelectPreset={(presetId, config) => {
          setWizardConfig(config)
          setSelectedPresetId(presetId)
          setShowLogoWizard(false)
          setShowUnifiedConfigurator(true)
        }}
        onGenerateNow={handleWizardGenerateNow}
        onSwitchToExpert={() => {
          setShowLogoWizard(false)
          setLogoMode('expert')
        }}
        resolution={resolution}
      />

      {/* Batch Generator Modal */}
      {batchOptions && (
        <BatchGenerator
          isOpen={showBatchGenerator}
          onClose={() => {
            setShowBatchGenerator(false)
            setBatchOptions(null)
          }}
          options={batchOptions}
          onSelectLogo={(logo: GeneratedLogo) => {
            setLogo(logo)
            setSeedValue(logo.seed)
            onLogoGenerated?.(logo.url)

            // Save batch-generated logo to history
            addToHistory({
              imageUrl: logo.url,
              prompt: logo.prompt || batchOptions?.prompt || '',
              seed: logo.seed,
              style: logo.style || batchOptions?.style || '',
              config: {
                wasBatchGeneration: true,
                aspectRatio: batchOptions?.aspectRatio,
                textMode: batchOptions?.textMode,
                resolution: batchOptions?.resolution,
                bgRemovalMethod: batchOptions?.bgRemovalMethod,
              }
            })
          }}
        />
      )}

      {/* Mockup Preview Modal */}
      {generatedLogo && (
        <MockupPreview
          isOpen={showMockupPreview}
          onClose={() => setShowMockupPreview(false)}
          logoUrl={generatedLogo.url}
          brandName={prompt.split(' ').slice(0, 2).join(' ') || 'Your Brand'}
          logoFilter={logoFilter}
        />
      )}

      {/* Comparison View Modal */}
      <ComparisonView
        isOpen={showComparisonView}
        onClose={() => {
          setShowComparisonView(false)
          setComparisonItems([])
        }}
        items={comparisonItems}
        onSelectWinner={(item) => {
          setPrompt(item.prompt)
          if (item.negativePrompt) setNegativePrompt(item.negativePrompt)
          if (item.seed) {
            setSeedValue(item.seed)
          }
          if (item.presetId) setSelectedPresetId(item.presetId)
        }}
      />

      {/* Real Font Overlay Modal */}
      {generatedLogo && (
        <RealFontOverlay
          isOpen={showRealFontOverlay}
          onClose={() => setShowRealFontOverlay(false)}
          logoUrl={generatedLogo.url}
          brandName={prompt.split(' ').slice(0, 2).join(' ') || 'Your Brand'}
          onExport={(dataUrl) => {
            setLogo({
              ...generatedLogo,
              url: dataUrl,
            })
            setShowRealFontOverlay(false)
          }}
        />
      )}
    </>
  )
}
