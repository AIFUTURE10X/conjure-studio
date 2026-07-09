"use client"

/**
 * CreativeArtsTab - Creative/Agency category specific settings
 *
 * Used by presets: creative-studio, creative-camera
 * Provides settings for artistic style, brush effects, color vibrancy
 */

import { TabsContent } from '@/components/ui/tabs'
import { Palette, Brush, Sparkles, Camera } from 'lucide-react'
import {
  CreativeLogoConfig,
  CREATIVE_FIELD_OPTIONS,
  ARTISTIC_STYLE_OPTIONS,
  BRUSH_STYLE_OPTIONS,
  CREATIVE_ELEMENT_OPTIONS,
  COLOR_VIBRANCY_OPTIONS,
  CREATIVE_COLORS,
} from '../../../../../constants/preset-schemas/creative-schema'
import { OptionButton } from '../../../DotMatrixConfigurator/OptionButton'

interface CreativeArtsTabProps {
  config: CreativeLogoConfig
  updateConfig: <K extends keyof CreativeLogoConfig>(key: K, value: CreativeLogoConfig[K]) => void
  toggleConfig: <K extends keyof CreativeLogoConfig>(key: K, value: CreativeLogoConfig[K]) => void
}

export function CreativeArtsTab({ config, updateConfig, toggleConfig }: CreativeArtsTabProps) {
  return (
    <TabsContent value="creative-arts" className="mt-0 space-y-6">
      {/* Creative Field */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Camera className="w-4 h-4 text-pink-400" />
          Creative Field
        </label>
        <div className="grid grid-cols-3 gap-2">
          {CREATIVE_FIELD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateConfig('creativeField', opt.value)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                config.creativeField === opt.value
                  ? 'border-pink-500 bg-pink-500/20'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className="text-xs text-white">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Artistic Style */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Palette className="w-4 h-4 text-pink-400" />
          Artistic Style
        </label>
        <div className="grid grid-cols-3 gap-2">
          {ARTISTIC_STYLE_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.artisticStyle === opt.value}
              onClick={() => updateConfig('artisticStyle', opt.value)}
              className="flex flex-col items-start p-3"
            >
              <span className="text-xs font-medium">{opt.label}</span>
              <span className="text-[10px] text-zinc-500">{opt.description}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Brush Style */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Brush className="w-4 h-4 text-pink-400" />
          Brush Effect
        </label>
        <div className="grid grid-cols-3 gap-2">
          {BRUSH_STYLE_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.brushStyle === opt.value}
              onClick={() => updateConfig('brushStyle', opt.value)}
              className="flex flex-col items-start p-3"
            >
              <span className="text-xs font-medium">{opt.label}</span>
              <span className="text-[10px] text-zinc-500">{opt.description}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Creative Element */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Creative Element</label>
        <div className="grid grid-cols-4 gap-2">
          {CREATIVE_ELEMENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateConfig('creativeElement', opt.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                config.creativeElement === opt.value
                  ? 'border-pink-500 bg-pink-500/20'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className="text-[10px] text-white">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color Vibrancy */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-400" />
          Color Vibrancy
        </label>
        <div className="flex flex-wrap gap-2">
          {COLOR_VIBRANCY_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.colorVibrancy === opt.value}
              onClick={() => updateConfig('colorVibrancy', opt.value)}
              className="px-3 py-2"
            >
              <span className="text-xs">{opt.label}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Primary Creative Color */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Primary Color</label>
        <div className="flex flex-wrap gap-2">
          {CREATIVE_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => updateConfig('primaryCreativeColor', color)}
              className={`w-8 h-8 rounded-lg border-2 transition-all ${
                config.primaryCreativeColor?.value === color.value
                  ? 'border-white scale-110'
                  : 'border-zinc-700 hover:border-zinc-500'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Secondary Creative Color */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Secondary Color</label>
        <div className="flex flex-wrap gap-2">
          {CREATIVE_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => updateConfig('secondaryCreativeColor', color)}
              className={`w-8 h-8 rounded-lg border-2 transition-all ${
                config.secondaryCreativeColor?.value === color.value
                  ? 'border-white scale-110'
                  : 'border-zinc-700 hover:border-zinc-500'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Toggle Options */}
      <div className="space-y-3 pt-2 border-t border-zinc-700">
        <label className="text-sm font-medium text-zinc-300">Creative Effects</label>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.hasGradientSplash || false}
              onChange={(e) => updateConfig('hasGradientSplash', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-pink-500 focus:ring-pink-500"
            />
            <span className="text-xs text-zinc-300">Gradient Splash</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.hasArtisticTexture || false}
              onChange={(e) => updateConfig('hasArtisticTexture', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-pink-500 focus:ring-pink-500"
            />
            <span className="text-xs text-zinc-300">Artistic Texture</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showPortfolioStyle || false}
              onChange={(e) => updateConfig('showPortfolioStyle', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-pink-500 focus:ring-pink-500"
            />
            <span className="text-xs text-zinc-300">Portfolio Style</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.isAgency || false}
              onChange={(e) => updateConfig('isAgency', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-pink-500 focus:ring-pink-500"
            />
            <span className="text-xs text-zinc-300">Agency/Studio</span>
          </label>
        </div>
      </div>
    </TabsContent>
  )
}
