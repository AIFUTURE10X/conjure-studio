"use client"

import { Wand2, Settings, ArrowLeft } from 'lucide-react'
import { LogoPresetSelector } from '../Logo/LogoPresetSelector'
import { TitleStyleGallery } from '../Logo/TitleStyles'
import type { LogoConcept, RenderStyle } from '../../constants/logo-constants'
import type { TitleStyleSettings } from '../../constants/title-logo-presets'

interface LogoModeSectionProps {
  logoMode: 'guided' | 'expert'
  setLogoMode: (mode: 'guided' | 'expert') => void
  removeBackgroundOnly: boolean
  isGenerating: boolean
  isRemovingRefBg: boolean

  // Wizard handlers
  onOpenWizard: () => void

  // Preset handlers
  onApplyPreset: (prompt: string, negative: string | undefined, concept: LogoConcept, renders: RenderStyle[]) => void
  /** Loads a title style's artwork into the reference slot in the given mode */
  onApplyReference?: (
    artwork: { file: File; preview: string },
    mode: 'replicate' | 'inspire'
  ) => void
  /** Turns background removal off so a glow style's dark backdrop survives */
  onKeepBackground?: () => void
  /** Drives the settings rail (logo type, visual style, render, typography) */
  onApplyStyleSettings?: (settings: TitleStyleSettings) => void
  onOpenDotMatrixConfigurator: () => void
  onOpenUnifiedConfigurator: (presetId: string) => void
  onOpenUnifiedConfiguratorWithConfig: (presetId: string, config: Record<string, any>) => void
}

export function LogoModeSection({
  logoMode,
  setLogoMode,
  removeBackgroundOnly,
  isGenerating,
  isRemovingRefBg,
  onOpenWizard,
  onApplyPreset,
  onApplyReference,
  onKeepBackground,
  onApplyStyleSettings,
  onOpenDotMatrixConfigurator,
  onOpenUnifiedConfigurator,
  onOpenUnifiedConfiguratorWithConfig,
}: LogoModeSectionProps) {
  // Don't show anything in background removal mode
  if (removeBackgroundOnly) return null

  // Guided Mode: Show wizard button
  if (logoMode === 'guided') {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={onOpenWizard}
          disabled={isGenerating || isRemovingRefBg}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-purple-500/20 to-pink-500/20 border-2 border-dashed border-purple-500/50 rounded-xl text-white hover:border-purple-500 hover:from-purple-500/30 hover:to-pink-500/30 transition-all disabled:opacity-50"
        >
          <Wand2 className="w-5 h-5 text-purple-400" />
          <span className="font-medium">Start Logo Wizard</span>
          <span className="text-xs text-zinc-400 ml-2">Answer questions to get personalized suggestions</span>
        </button>
        <button
          onClick={() => setLogoMode('expert')}
          disabled={isGenerating || isRemovingRefBg}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800/70 border border-[#c99850]/40 rounded-lg text-sm font-semibold text-[#dbb56e] hover:bg-zinc-800 hover:border-[#c99850]/80 hover:text-[#f4d698] transition-all disabled:opacity-50"
        >
          <Settings className="w-4 h-4" />
          Switch to Expert Mode
          <span className="text-xs font-normal text-zinc-500">— all presets &amp; title styles</span>
        </button>
      </div>
    )
  }

  // Expert Mode: Show preset selector + the film/TV title-style library
  return (
    <div className="space-y-2">
      <button
        onClick={() => setLogoMode('guided')}
        disabled={isGenerating || isRemovingRefBg}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-linear-to-r from-purple-500/15 to-pink-500/15 border border-purple-500/40 rounded-lg text-sm font-semibold text-purple-300 hover:from-purple-500/25 hover:to-pink-500/25 hover:border-purple-500/70 hover:text-white transition-all disabled:opacity-50"
      >
        <ArrowLeft className="w-4 h-4" />
        <Wand2 className="w-4 h-4" />
        Back to Logo Wizard
      </button>
      <LogoPresetSelector
        onApplyPreset={onApplyPreset}
        onOpenDotMatrixConfigurator={onOpenDotMatrixConfigurator}
        onOpenUnifiedConfigurator={onOpenUnifiedConfigurator}
        onOpenUnifiedConfiguratorWithConfig={onOpenUnifiedConfiguratorWithConfig}
        disabled={isGenerating || isRemovingRefBg}
      />
      <TitleStyleGallery
        onApplyPreset={onApplyPreset}
        onApplyReference={onApplyReference}
        onKeepBackground={onKeepBackground}
        onApplyStyleSettings={onApplyStyleSettings}
        disabled={isGenerating || isRemovingRefBg}
      />
    </div>
  )
}
