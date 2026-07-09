"use client"

/**
 * VariationResults Component
 *
 * Displays recommended logo presets based on questionnaire answers
 */

import { useState } from 'react'
import { ArrowRight, Sparkles, Wand2, Settings, Maximize2 } from 'lucide-react'
import { LOGO_PRESETS } from '../../../../constants/logo-presets'
import { LogoResolution, RESOLUTION_OPTIONS } from '../../../../constants/logo-constants'

interface VariationResultsProps {
  recommendedPresets: Array<{ presetId: string; score: number }>
  baseConfig: Record<string, any>
  onSelectVariation: (presetId: string) => void
  onGenerateNow?: (presetId: string, config: Record<string, any>) => void
  resolution?: LogoResolution
  onResolutionChange?: (resolution: LogoResolution) => void
}

export function VariationResults({
  recommendedPresets,
  baseConfig,
  onSelectVariation,
  onGenerateNow,
  resolution = '1K',
  onResolutionChange,
}: VariationResultsProps) {
  const [localResolution, setLocalResolution] = useState<LogoResolution>(resolution)

  // Handle resolution change
  const handleResolutionChange = (newRes: LogoResolution) => {
    setLocalResolution(newRes)
    onResolutionChange?.(newRes)
  }

  // Get preset details from IDs
  const variations = recommendedPresets.map(({ presetId, score }) => {
    const preset = LOGO_PRESETS.find((p) => p.id === presetId)
    return { preset, score }
  }).filter((v) => v.preset)

  // Get the brand name for display
  const brandName = baseConfig.brandName || 'Your Brand'

  return (
    <div className="space-y-6">
      {/* Header with brand preview */}
      <div className="text-center py-4">
        <p className="text-sm text-zinc-400 mb-2">Based on your answers, we recommend:</p>
        <h3 className="text-3xl font-bold text-white">{brandName}</h3>
      </div>

      {/* Resolution Selector */}
      <div className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
        <Maximize2 className="w-4 h-4 text-zinc-400" />
        <span className="text-xs text-zinc-400 mr-2">Resolution:</span>
        <div className="flex gap-1">
          {RESOLUTION_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleResolutionChange(option.value)}
              className={`
                px-3 py-1 rounded text-xs font-medium transition-all
                ${localResolution === option.value
                  ? 'bg-linear-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }
              `}
            >
              {option.value}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-zinc-500 ml-2">
          Higher = cleaner BG removal
        </span>
      </div>

      {/* Variation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {variations.map(({ preset, score }, index) => {
          if (!preset) return null

          const isTopPick = index === 0
          const matchPercentage = Math.min(100, Math.round((score / 20) * 100))

          return (
            <div
              key={preset.id}
              className={`
                relative flex flex-col items-start p-5 rounded-xl border-2 transition-all text-left
                ${
                  isTopPick
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-zinc-700 bg-zinc-800/50'
                }
              `}
            >
              {/* Top pick badge */}
              {isTopPick && (
                <div className="absolute -top-3 left-4 flex items-center gap-1 px-2 py-0.5 bg-linear-to-r from-purple-500 to-pink-500 rounded-full">
                  <Sparkles className="w-3 h-3 text-white" />
                  <span className="text-[10px] font-medium text-white">Best Match</span>
                </div>
              )}

              {/* Preset icon & name */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`p-3 rounded-lg ${
                    isTopPick ? 'bg-purple-500/30' : 'bg-zinc-700'
                  }`}
                >
                  <span className="text-2xl">{preset.icon}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">{preset.name}</h4>
                  <p className="text-xs text-zinc-400">{preset.category}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-zinc-300 mb-4">{preset.description}</p>

              {/* Match score */}
              <div className="w-full mt-auto">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-500">Match</span>
                  <span className="text-xs text-zinc-400">{matchPercentage}%</span>
                </div>
                <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isTopPick
                        ? 'bg-linear-to-r from-purple-500 to-pink-500'
                        : 'bg-zinc-500'
                    }`}
                    style={{ width: `${matchPercentage}%` }}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-4 w-full">
                {onGenerateNow && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onGenerateNow(preset.id, baseConfig)
                    }}
                    className={`
                      flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${isTopPick
                        ? 'bg-linear-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
                        : 'bg-zinc-700 text-white hover:bg-zinc-600'}
                    `}
                  >
                    <Wand2 className="w-4 h-4" />
                    Generate Now
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectVariation(preset.id)
                  }}
                  className={`
                    flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${onGenerateNow
                      ? 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700'
                      : isTopPick
                        ? 'flex-1 bg-linear-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
                        : 'flex-1 bg-zinc-700 text-white hover:bg-zinc-600'}
                  `}
                >
                  <Settings className="w-4 h-4" />
                  {onGenerateNow ? 'Customize' : 'Customize this style'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Show more options hint */}
      <p className="text-center text-xs text-zinc-500">
        {onGenerateNow
          ? 'Click "Generate Now" to create your logo instantly, or "Customize" for more options'
          : 'Click any variation to open the full configurator with your settings applied'}
      </p>
    </div>
  )
}
