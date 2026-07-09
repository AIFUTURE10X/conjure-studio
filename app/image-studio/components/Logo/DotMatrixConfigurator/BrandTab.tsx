"use client"

import { Input } from '@/components/ui/input'
import { TabsContent } from '@/components/ui/tabs'
import { Wand2 } from 'lucide-react'
import { DotMatrixConfig, INDUSTRY_PRESETS } from '../../../constants/dot-matrix-config'
import { ToggleSwitch } from './OptionButton'

interface BrandTabProps {
  config: DotMatrixConfig
  updateConfig: <K extends keyof DotMatrixConfig>(key: K, value: DotMatrixConfig[K]) => void
  applyIndustryPreset: (presetId: string) => void
}

export function BrandTab({ config, updateConfig, applyIndustryPreset }: BrandTabProps) {
  return (
    <TabsContent value="brand" className="mt-0 space-y-6">
      {/* Industry Quick Presets */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-purple-400" />
          Industry Quick Start
        </label>
        <div className="flex flex-wrap gap-2">
          {INDUSTRY_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyIndustryPreset(preset.id)}
              className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{preset.icon}</span>
                <div>
                  <div className="text-xs font-medium text-white">{preset.name}</div>
                  <div className="text-[10px] text-zinc-500">{preset.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Brand Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Brand Name *</label>
        <Input
          value={config.brandName}
          onChange={(e) => updateConfig('brandName', e.target.value)}
          placeholder="Enter your brand name..."
          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-11"
        />
      </div>

      {/* Tagline */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Tagline (optional)</label>
        <Input
          value={config.tagline}
          onChange={(e) => updateConfig('tagline', e.target.value)}
          placeholder='e.g., "Let us connect the dots"'
          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
        />
      </div>

      {/* Tagline Options - Only show when tagline exists */}
      {config.tagline && config.tagline.trim() && (
        <div className="space-y-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
          <label className="text-xs font-medium text-zinc-400">Tagline Settings</label>

          {/* Position */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500">Position</label>
            <div className="flex gap-1.5">
              {(['below', 'right', 'inline'] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => updateConfig('taglinePosition', pos)}
                  className={`px-2.5 py-1 text-[10px] rounded-md border transition-colors ${
                    config.taglinePosition === pos
                      ? 'bg-purple-500/30 border-purple-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {pos === 'below' ? 'Below' : pos === 'right' ? 'Right' : 'Inline'}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500">Style</label>
            <div className="flex gap-1.5">
              {(['match', 'italic', 'lighter', 'caps'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => updateConfig('taglineStyle', style)}
                  className={`px-2.5 py-1 text-[10px] rounded-md border transition-colors ${
                    config.taglineStyle === style
                      ? 'bg-purple-500/30 border-purple-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {style === 'match' ? 'Match' : style === 'italic' ? 'Italic' : style === 'lighter' ? 'Lighter' : 'CAPS'}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500">Size</label>
            <div className="flex gap-1.5">
              {(['small', 'medium'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => updateConfig('taglineSize', size)}
                  className={`px-2.5 py-1 text-[10px] rounded-md border transition-colors ${
                    config.taglineSize === size
                      ? 'bg-purple-500/30 border-purple-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {size === 'small' ? 'Small' : 'Medium'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Use Initials Toggle */}
      <ToggleSwitch
        enabled={config.useInitials}
        onChange={() => updateConfig('useInitials', !config.useInitials)}
        label="Use Initials Only"
        description={`Show "${config.brandName.split(/\s+/).map(w => w.charAt(0).toUpperCase()).join('')}" instead of full name`}
      />
    </TabsContent>
  )
}
