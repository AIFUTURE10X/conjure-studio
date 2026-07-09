"use client"

import { TabsContent } from '@/components/ui/tabs'
import { DotMatrixConfig, METALLIC_FINISH_OPTIONS, BACKGROUND_OPTIONS, ColorOption } from '../../../constants/dot-matrix-config'
import { LetterColorPicker } from '../LetterColorPicker'
import { ExpandedColorPicker } from '../ExpandedColorPicker'

interface ColorsTabProps {
  config: DotMatrixConfig
  toggleConfig: <K extends keyof DotMatrixConfig>(key: K, value: DotMatrixConfig[K]) => void
  updateConfig: <K extends keyof DotMatrixConfig>(key: K, value: DotMatrixConfig[K]) => void
}

export function ColorsTab({ config, toggleConfig, updateConfig }: ColorsTabProps) {
  return (
    <TabsContent value="colors" className="mt-0 space-y-6">
      {/* Per-Letter Color Picker */}
      <LetterColorPicker
        brandName={config.brandName}
        letterColors={config.letterColors}
        onLetterColorsChange={(colors) => updateConfig('letterColors', colors)}
      />

      {/* Expanded Dot Color Picker */}
      <ExpandedColorPicker
        label="Dot Matrix Color"
        selectedColor={config.dotColor}
        onSelectColor={(color) => updateConfig('dotColor', color)}
        customColor={config.customDotColor}
        onCustomColorChange={(hex) => updateConfig('customDotColor', hex)}
        showCustomInput={true}
      />

      {/* Text/Metallic Color */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Text Metallic Finish</label>
        <div className="flex flex-wrap gap-2">
          {METALLIC_FINISH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => toggleConfig('metallicFinish', opt.value)}
              className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                config.metallicFinish === opt.value
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <div
                className="w-5 h-5 rounded-full border border-zinc-600"
                style={{ background: `linear-gradient(135deg, ${opt.color} 0%, #fff 50%, ${opt.color} 100%)` }}
              />
              <span className="text-xs text-white">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <ExpandedColorPicker
        label="Accent Color (sparkles, highlights)"
        selectedColor={config.accentColor}
        onSelectColor={(color) => updateConfig('accentColor', color)}
        showCustomInput={false}
      />

      {/* Background */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Background</label>
        <div className="flex flex-wrap gap-2">
          {BACKGROUND_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => toggleConfig('backgroundColor', opt.value)}
              className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                config.backgroundColor === opt.value
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <div
                className="w-5 h-5 rounded border border-zinc-600"
                style={{
                  background: opt.value === 'transparent'
                    ? `repeating-conic-gradient(#404040 0% 25%, #606060 0% 50%) 50%/8px 8px`
                    : opt.preview
                }}
              />
              <span className="text-xs text-white">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </TabsContent>
  )
}
