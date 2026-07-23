"use client"

import { Wand2 } from 'lucide-react'
import { LogoPresetSelector } from '../Logo/LogoPresetSelector'
import { TitleStyleGallery } from '../Logo/TitleStyles'
import type { LogoConcept, RenderStyle } from '../../constants/logo-constants'

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
        <p className="text-[10px] text-zinc-500 text-center">
          Or switch to <button onClick={() => setLogoMode('expert')} className="text-purple-400 hover:underline">Expert Mode</button> to access all presets directly
        </p>
      </div>
    )
  }

  // Expert Mode: Show preset selector + the film/TV title-style library
  return (
    <div className="space-y-2">
      <LogoPresetSelector
        onApplyPreset={onApplyPreset}
        onOpenDotMatrixConfigurator={onOpenDotMatrixConfigurator}
        onOpenUnifiedConfigurator={onOpenUnifiedConfigurator}
        onOpenUnifiedConfiguratorWithConfig={onOpenUnifiedConfiguratorWithConfig}
        disabled={isGenerating || isRemovingRefBg}
      />
      <TitleStyleGallery
        onApplyPreset={onApplyPreset}
        disabled={isGenerating || isRemovingRefBg}
      />
    </div>
  )
}
