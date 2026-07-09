"use client"

/**
 * NatureOrganicsTab - Nature category specific settings
 *
 * Used by presets: nature-leaf
 * Provides settings for organic shapes, leaf styles, eco colors, textures
 */

import { TabsContent } from '@/components/ui/tabs'
import { Leaf, Droplet, Sun, TreeDeciduous } from 'lucide-react'
import {
  NatureLogoConfig,
  ORGANIC_SHAPE_OPTIONS,
  LEAF_STYLE_OPTIONS,
  ECO_PALETTE_OPTIONS,
  GROWTH_EFFECT_OPTIONS,
  NATURE_TEXTURE_OPTIONS,
  WATER_ELEMENT_OPTIONS,
  NATURE_LEAF_COLORS,
} from '../../../../../constants/preset-schemas/nature-schema'
import { OptionButton } from '../../../DotMatrixConfigurator/OptionButton'

interface NatureOrganicsTabProps {
  config: NatureLogoConfig
  updateConfig: <K extends keyof NatureLogoConfig>(key: K, value: NatureLogoConfig[K]) => void
  toggleConfig: <K extends keyof NatureLogoConfig>(key: K, value: NatureLogoConfig[K]) => void
}

export function NatureOrganicsTab({ config, updateConfig, toggleConfig }: NatureOrganicsTabProps) {
  return (
    <TabsContent value="nature-organics" className="mt-0 space-y-6">
      {/* Organic Shape */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Leaf className="w-4 h-4 text-green-400" />
          Organic Shape
        </label>
        <div className="grid grid-cols-4 gap-2">
          {ORGANIC_SHAPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateConfig('organicShape', opt.value)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                config.organicShape === opt.value
                  ? 'border-green-500 bg-green-500/20'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className="text-xs text-white">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Leaf Style */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <TreeDeciduous className="w-4 h-4 text-green-400" />
          Style
        </label>
        <div className="grid grid-cols-3 gap-2">
          {LEAF_STYLE_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.leafStyle === opt.value}
              onClick={() => updateConfig('leafStyle', opt.value)}
              className="flex flex-col items-start p-3"
            >
              <span className="text-xs font-medium">{opt.label}</span>
              <span className="text-[10px] text-zinc-500">{opt.description}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Eco Color Palette */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Color Palette</label>
        <div className="grid grid-cols-3 gap-2">
          {ECO_PALETTE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateConfig('ecoColorPalette', opt.value)}
              className={`flex flex-col items-start p-3 rounded-lg border transition-all ${
                config.ecoColorPalette === opt.value
                  ? 'border-green-500 bg-green-500/20'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <div className="flex gap-1 mb-1">
                {opt.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-white">{opt.label}</span>
              <span className="text-[10px] text-zinc-500">{opt.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Primary Leaf Color */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Primary Color</label>
        <div className="flex flex-wrap gap-2">
          {NATURE_LEAF_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => updateConfig('primaryLeafColor', color)}
              className={`w-8 h-8 rounded-lg border-2 transition-all ${
                config.primaryLeafColor?.value === color.value
                  ? 'border-white scale-110'
                  : 'border-zinc-700 hover:border-zinc-500'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Nature Texture */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Texture</label>
        <div className="flex flex-wrap gap-2">
          {NATURE_TEXTURE_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.natureTexture === opt.value}
              onClick={() => updateConfig('natureTexture', opt.value)}
              className="px-3 py-2"
            >
              <span className="text-xs">{opt.label}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Growth Effect */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Growth Effect</label>
        <div className="flex flex-wrap gap-2">
          {GROWTH_EFFECT_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.growthEffect === opt.value}
              onClick={() => updateConfig('growthEffect', opt.value)}
              className="px-3 py-2"
            >
              <span className="text-xs">{opt.label}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Water Element */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Droplet className="w-4 h-4 text-blue-400" />
          Water Element
        </label>
        <div className="flex flex-wrap gap-2">
          {WATER_ELEMENT_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.waterElement === opt.value}
              onClick={() => updateConfig('waterElement', opt.value)}
              className="px-3 py-2"
            >
              <span className="text-xs">{opt.label}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Toggle Options */}
      <div className="space-y-3 pt-2 border-t border-zinc-700">
        <label className="text-sm font-medium text-zinc-300">Nature Elements</label>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.hasSunRays || false}
              onChange={(e) => updateConfig('hasSunRays', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-green-500 focus:ring-green-500"
            />
            <Sun className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-zinc-300">Sun Rays</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.hasEarthElement || false}
              onChange={(e) => updateConfig('hasEarthElement', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-green-500 focus:ring-green-500"
            />
            <span className="text-xs text-zinc-300">Earth Element</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.isOrganic || false}
              onChange={(e) => updateConfig('isOrganic', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-green-500 focus:ring-green-500"
            />
            <span className="text-xs text-zinc-300">Organic Badge Style</span>
          </label>
        </div>
      </div>
    </TabsContent>
  )
}
