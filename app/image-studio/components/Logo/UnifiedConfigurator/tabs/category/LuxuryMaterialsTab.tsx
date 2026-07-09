"use client"

/**
 * LuxuryMaterialsTab - Luxury category specific settings
 *
 * Used by presets: luxury-crown, luxury-diamond
 * Provides settings for metals, gems, finishes, engraving
 */

import { TabsContent } from '@/components/ui/tabs'
import { Crown, Gem, Sparkles } from 'lucide-react'
import {
  LuxuryLogoConfig,
  METAL_TYPE_OPTIONS,
  GEM_STYLE_OPTIONS,
  GEM_PLACEMENT_OPTIONS,
  FINISH_QUALITY_OPTIONS,
  ENGRAVING_STYLE_OPTIONS,
  LUXURY_PATTERN_OPTIONS,
  EXCLUSIVITY_OPTIONS,
} from '../../../../../constants/preset-schemas/luxury-schema'
import { OptionButton } from '../../../DotMatrixConfigurator/OptionButton'

interface LuxuryMaterialsTabProps {
  config: LuxuryLogoConfig
  updateConfig: <K extends keyof LuxuryLogoConfig>(key: K, value: LuxuryLogoConfig[K]) => void
  toggleConfig: <K extends keyof LuxuryLogoConfig>(key: K, value: LuxuryLogoConfig[K]) => void
}

export function LuxuryMaterialsTab({ config, updateConfig, toggleConfig }: LuxuryMaterialsTabProps) {
  return (
    <TabsContent value="luxury-materials" className="mt-0 space-y-6">
      {/* Metal Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-400" />
          Metal Type
        </label>
        <div className="flex flex-wrap gap-2">
          {METAL_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateConfig('metalType', opt.value)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                config.metalType === opt.value
                  ? 'border-amber-500 bg-amber-500/20'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <div
                className="w-4 h-4 rounded-full border border-zinc-600"
                style={{ backgroundColor: opt.hex }}
              />
              <span className="text-xs text-white">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Gem Style */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Gem className="w-4 h-4 text-amber-400" />
          Gem Style
        </label>
        <div className="flex flex-wrap gap-2">
          {GEM_STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateConfig('gemStyle', opt.value)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                config.gemStyle === opt.value
                  ? 'border-amber-500 bg-amber-500/20'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              {opt.value !== 'none' && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: opt.hex }}
                />
              )}
              <span className="text-xs text-white">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Gem Placement - Only show if gem is selected */}
      {config.gemStyle !== 'none' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Gem Placement</label>
          <div className="grid grid-cols-3 gap-2">
            {GEM_PLACEMENT_OPTIONS.map((opt) => (
              <OptionButton
                key={opt.value}
                selected={config.gemPlacement === opt.value}
                onClick={() => updateConfig('gemPlacement', opt.value)}
                className="flex flex-col items-start p-3"
              >
                <span className="text-xs font-medium">{opt.label}</span>
                <span className="text-[10px] text-zinc-500">{opt.description}</span>
              </OptionButton>
            ))}
          </div>
        </div>
      )}

      {/* Finish Quality */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Finish Quality
        </label>
        <div className="flex flex-wrap gap-2">
          {FINISH_QUALITY_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.finishQuality === opt.value}
              onClick={() => updateConfig('finishQuality', opt.value)}
              className="px-3 py-2"
            >
              <span className="text-xs">{opt.label}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Engraving Style */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Engraving Style</label>
        <div className="flex flex-wrap gap-2">
          {ENGRAVING_STYLE_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.engravingStyle === opt.value}
              onClick={() => updateConfig('engravingStyle', opt.value)}
              className="px-3 py-2"
            >
              <span className="text-xs">{opt.label}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Luxury Pattern */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Decorative Pattern</label>
        <div className="flex flex-wrap gap-2">
          {LUXURY_PATTERN_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.luxuryPattern === opt.value}
              onClick={() => updateConfig('luxuryPattern', opt.value)}
              className="px-3 py-2"
            >
              <span className="text-xs">{opt.label}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Exclusivity Level */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Exclusivity Level</label>
        <div className="grid grid-cols-3 gap-2">
          {EXCLUSIVITY_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.exclusivityLevel === opt.value}
              onClick={() => updateConfig('exclusivityLevel', opt.value)}
              className="flex flex-col items-start p-3"
            >
              <span className="text-xs font-medium">{opt.label}</span>
              <span className="text-[10px] text-zinc-500">{opt.description}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Toggle Options */}
      <div className="space-y-3 pt-2 border-t border-zinc-700">
        <label className="text-sm font-medium text-zinc-300">Premium Elements</label>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.hasGoldLeaf || false}
              onChange={(e) => updateConfig('hasGoldLeaf', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-xs text-zinc-300">Gold Leaf Accents</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.hasCrownElement || false}
              onChange={(e) => updateConfig('hasCrownElement', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-xs text-zinc-300">Crown Element</span>
          </label>
        </div>
      </div>
    </TabsContent>
  )
}
