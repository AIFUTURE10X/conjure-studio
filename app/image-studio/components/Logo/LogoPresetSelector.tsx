"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDown, ChevronUp, Wand2, X, Settings2, Star, ChevronRight } from 'lucide-react'
import {
  LogoPreset,
  PresetCategory,
  PRESET_CATEGORIES,
  LOGO_PRESETS,
  getPresetsByCategory,
  applyPresetTemplate
} from '../../constants/logo-presets'
import { LogoConcept, RenderStyle, GOLD_GRADIENT } from '../../constants/logo-constants'
import { CustomPresetsList, useCustomPresets, CustomPreset } from './CustomPresets'

interface LogoPresetSelectorProps {
  onApplyPreset: (
    prompt: string,
    negativePrompt: string | undefined,
    concept: LogoConcept,
    renderStyles: RenderStyle[]
  ) => void
  onOpenDotMatrixConfigurator?: () => void
  onOpenUnifiedConfigurator?: (presetId: string) => void
  onOpenUnifiedConfiguratorWithConfig?: (presetId: string, config: Record<string, any>) => void
  disabled?: boolean
}

export function LogoPresetSelector({
  onApplyPreset,
  onOpenDotMatrixConfigurator,
  onOpenUnifiedConfigurator,
  onOpenUnifiedConfiguratorWithConfig,
  disabled
}: LogoPresetSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<LogoPreset | null>(null)
  const [brandName, setBrandName] = useState('')
  const [showMyPresets, setShowMyPresets] = useState(false)

  const { presets: customPresets, presetsCount } = useCustomPresets()

  const filteredPresets = selectedCategory
    ? getPresetsByCategory(selectedCategory)
    : LOGO_PRESETS

  const handleSelectPreset = (preset: LogoPreset) => {
    // Open the unified configurator for any preset if available
    if (onOpenUnifiedConfigurator) {
      onOpenUnifiedConfigurator(preset.id)
      setIsExpanded(false)
      return
    }

    // Legacy: If it's the Dot Matrix 3D preset, open the old configurator modal
    if (preset.id === 'corporate-dotmatrix' && onOpenDotMatrixConfigurator) {
      onOpenDotMatrixConfigurator()
      setIsExpanded(false)
      return
    }
    setSelectedPreset(preset)
  }

  const handleApply = () => {
    if (!selectedPreset || !brandName.trim()) return

    const finalPrompt = applyPresetTemplate(selectedPreset, brandName)
    onApplyPreset(
      finalPrompt,
      selectedPreset.negativePrompt,
      selectedPreset.concept,
      selectedPreset.renderStyles
    )

    // Reset and collapse
    setSelectedPreset(null)
    setBrandName('')
    setIsExpanded(false)
  }

  const handleClear = () => {
    setSelectedPreset(null)
    setBrandName('')
    setSelectedCategory(null)
  }

  const handleSelectCustomPreset = (preset: CustomPreset) => {
    // Open configurator with saved config
    if (onOpenUnifiedConfiguratorWithConfig) {
      onOpenUnifiedConfiguratorWithConfig(preset.basePresetId, preset.config)
      setIsExpanded(false)
    } else if (onOpenUnifiedConfigurator) {
      onOpenUnifiedConfigurator(preset.basePresetId)
      setIsExpanded(false)
    }
  }

  return (
    <div className="space-y-2">
      {/* Header Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white disabled:opacity-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-[#dbb56e]" />
          <span>Quick Presets</span>
          {selectedPreset && (
            <span className="text-xs bg-[#c99850]/20 text-[#dbb56e] px-2 py-0.5 rounded-full">
              {selectedPreset.name}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-zinc-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="bg-zinc-800/30 border border-zinc-700 rounded-lg p-3 space-y-3">
          {/* My Presets Toggle */}
          {presetsCount > 0 && (
            <button
              onClick={() => setShowMyPresets(!showMyPresets)}
              className="w-full flex items-center justify-between px-3 py-2 bg-linear-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg text-sm hover:from-amber-500/20 hover:to-orange-500/20 transition-all"
            >
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-amber-200 font-medium">My Presets</span>
                <span className="text-xs text-amber-400/60">({presetsCount})</span>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-amber-400 transition-transform ${
                  showMyPresets ? 'rotate-90' : ''
                }`}
              />
            </button>
          )}

          {/* My Presets List */}
          {showMyPresets && (
            <div className="border-l-2 border-amber-500/30 pl-3 ml-1">
              <CustomPresetsList
                onSelectPreset={handleSelectCustomPreset}
              />
            </div>
          )}

          {/* Category Filter */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                selectedCategory === null
                  ? 'bg-[#c99850] text-black font-medium'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              All
            </button>
            {PRESET_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                  selectedCategory === cat.value
                    ? 'bg-[#c99850] text-black font-medium'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Preset Grid */}
          <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-1">
            {filteredPresets.map((preset) => {
              const hasUnifiedConfigurator = !!onOpenUnifiedConfigurator
              const isDotMatrixPreset = preset.id === 'corporate-dotmatrix'
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-2 rounded-lg border text-left transition-all relative ${
                    hasUnifiedConfigurator
                      ? 'border-purple-500/50 bg-purple-900/20 hover:border-purple-400 hover:bg-purple-900/30'
                      : isDotMatrixPreset
                        ? 'border-purple-500/50 bg-purple-900/20 hover:border-purple-400 hover:bg-purple-900/30'
                        : selectedPreset?.id === preset.id
                          ? 'border-[#c99850] bg-[#c99850]/10'
                          : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800'
                  }`}
                >
                  {(hasUnifiedConfigurator || isDotMatrixPreset) && (
                    <div className="absolute top-1 right-1">
                      <Settings2 className="w-3 h-3 text-purple-400" />
                    </div>
                  )}
                  <div className="text-lg mb-1">{preset.icon}</div>
                  <div className="text-xs font-medium text-white truncate">{preset.name}</div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    {hasUnifiedConfigurator ? 'Full configurator' : isDotMatrixPreset ? 'Advanced configurator' : preset.description}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Brand Name Input & Apply */}
          {selectedPreset && (
            <div className="space-y-2 pt-2 border-t border-zinc-700">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Selected:</span>
                <span className="text-xs text-white font-medium">{selectedPreset.name}</span>
                <span className="text-lg">{selectedPreset.icon}</span>
                <button
                  onClick={handleClear}
                  className="ml-auto p-1 hover:bg-zinc-700 rounded"
                >
                  <X className="w-3 h-3 text-zinc-400" />
                </button>
              </div>

              <div className="text-[10px] text-zinc-500 bg-zinc-900/50 p-2 rounded">
                <span className="text-zinc-400">Template:</span> {selectedPreset.promptTemplate}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Enter your brand name..."
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="flex-1 h-8 text-sm bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && brandName.trim()) {
                      handleApply()
                    }
                  }}
                />
                <Button
                  onClick={handleApply}
                  disabled={!brandName.trim()}
                  size="sm"
                  className="h-8 px-4 text-xs font-semibold text-black disabled:opacity-50"
                  style={{ background: GOLD_GRADIENT }}
                >
                  Apply
                </Button>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                <span>Style:</span>
                <span className="bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-300 capitalize">
                  {selectedPreset.concept}
                </span>
                {selectedPreset.renderStyles.map((style) => (
                  <span key={style} className="bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-300">
                    {style}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
