"use client"

/**
 * Wizard Results View Component
 *
 * Shows the variation results after wizard completion or analysis.
 * Extracted from LogoWizard.tsx to keep files under 300 lines.
 */

import { ChevronLeft, Sparkles, X } from 'lucide-react'
import { VariationResults } from './variations/VariationResults'
import type { LogoResolution } from '../../../constants/logo-constants'

interface WizardResultsViewProps {
  recommendedPresets: Array<{ presetId: string; score: number }>
  baseConfig: Record<string, any>
  hasAnalysisPresets: boolean
  onBack: () => void
  onStartOver: () => void
  onClose: () => void
  onSelectVariation: (presetId: string) => void
  onGenerateNow?: (presetId: string, config: Record<string, any>) => void
  resolution?: LogoResolution
  onResolutionChange?: (resolution: LogoResolution) => void
}

export function WizardResultsView({
  recommendedPresets,
  baseConfig,
  hasAnalysisPresets,
  onBack,
  onStartOver,
  onClose,
  onSelectVariation,
  onGenerateNow,
  resolution,
  onResolutionChange,
}: WizardResultsViewProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="p-2 rounded-lg bg-linear-to-r from-purple-500 to-pink-500">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Your Logo Variations</h2>
              <p className="text-xs text-zinc-400">
                Choose a style to customize further
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onStartOver}
              className="px-3 py-1.5 text-sm text-zinc-300 hover:text-white transition-colors"
            >
              Start Over
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Results Content */}
        <div className="p-6">
          <VariationResults
            recommendedPresets={recommendedPresets}
            baseConfig={baseConfig}
            onSelectVariation={onSelectVariation}
            onGenerateNow={onGenerateNow}
            resolution={resolution}
            onResolutionChange={onResolutionChange}
          />
        </div>
      </div>
    </div>
  )
}
