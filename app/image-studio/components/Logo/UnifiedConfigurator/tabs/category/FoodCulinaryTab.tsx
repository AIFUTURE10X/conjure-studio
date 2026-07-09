"use client"

/**
 * FoodCulinaryTab - Food & Dining category specific settings
 *
 * Used by presets: food-restaurant, food-coffee
 * Provides settings for cuisine style, warmth, food icons, textures
 */

import { TabsContent } from '@/components/ui/tabs'
import { UtensilsCrossed, Flame, Coffee } from 'lucide-react'
import {
  FoodLogoConfig,
  CUISINE_STYLE_OPTIONS,
  FOOD_ICON_OPTIONS,
  WARMTH_LEVEL_OPTIONS,
  FOOD_TEXTURE_OPTIONS,
  ATMOSPHERE_OPTIONS,
  FOOD_WARM_COLORS,
  CUISINE_TYPES,
} from '../../../../../constants/preset-schemas/food-schema'
import { OptionButton } from '../../../DotMatrixConfigurator/OptionButton'

interface FoodCulinaryTabProps {
  config: FoodLogoConfig
  updateConfig: <K extends keyof FoodLogoConfig>(key: K, value: FoodLogoConfig[K]) => void
  toggleConfig: <K extends keyof FoodLogoConfig>(key: K, value: FoodLogoConfig[K]) => void
}

export function FoodCulinaryTab({ config, updateConfig, toggleConfig }: FoodCulinaryTabProps) {
  return (
    <TabsContent value="food-culinary" className="mt-0 space-y-6">
      {/* Cuisine Style */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-orange-400" />
          Cuisine Style
        </label>
        <div className="grid grid-cols-3 gap-2">
          {CUISINE_STYLE_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.cuisineStyle === opt.value}
              onClick={() => updateConfig('cuisineStyle', opt.value)}
              className="flex flex-col items-start p-3"
            >
              <span className="text-xs font-medium">{opt.label}</span>
              <span className="text-[10px] text-zinc-500">{opt.description}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Food Icon */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Food Icon</label>
        <div className="grid grid-cols-5 gap-2">
          {FOOD_ICON_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateConfig('foodIcon', opt.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                config.foodIcon === opt.value
                  ? 'border-orange-500 bg-orange-500/20'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className="text-[10px] text-white">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Warmth Level */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          Warmth Level
        </label>
        <div className="flex flex-wrap gap-2">
          {WARMTH_LEVEL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateConfig('warmthLevel', opt.value)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                config.warmthLevel === opt.value
                  ? 'border-orange-500 bg-orange-500/20'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: opt.colorHint }}
              />
              <span className="text-xs text-white">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Atmosphere Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Atmosphere</label>
        <div className="grid grid-cols-3 gap-2">
          {ATMOSPHERE_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.atmosphereType === opt.value}
              onClick={() => updateConfig('atmosphereType', opt.value)}
              className="flex flex-col items-start p-3"
            >
              <span className="text-xs font-medium">{opt.label}</span>
              <span className="text-[10px] text-zinc-500">{opt.description}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Food Texture */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Texture Style</label>
        <div className="flex flex-wrap gap-2">
          {FOOD_TEXTURE_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.foodTexture === opt.value}
              onClick={() => updateConfig('foodTexture', opt.value)}
              className="px-3 py-2"
            >
              <span className="text-xs">{opt.label}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Warm Color Accent */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Warm Accent Color</label>
        <div className="flex flex-wrap gap-2">
          {FOOD_WARM_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => updateConfig('primaryWarmColor', color)}
              className={`w-8 h-8 rounded-lg border-2 transition-all ${
                config.primaryWarmColor?.value === color.value
                  ? 'border-white scale-110'
                  : 'border-zinc-700 hover:border-zinc-500'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Cuisine Type Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Coffee className="w-4 h-4 text-orange-400" />
          Cuisine Type (Optional)
        </label>
        <div className="flex flex-wrap gap-2">
          <OptionButton
            selected={config.showCuisineType === null}
            onClick={() => updateConfig('showCuisineType', null)}
            className="px-3 py-2"
          >
            <span className="text-xs">None</span>
          </OptionButton>
          {CUISINE_TYPES.slice(0, 8).map((type) => (
            <OptionButton
              key={type}
              selected={config.showCuisineType === type}
              onClick={() => updateConfig('showCuisineType', type)}
              className="px-3 py-2"
            >
              <span className="text-xs">{type}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Toggle Options */}
      <div className="space-y-3 pt-2 border-t border-zinc-700">
        <label className="text-sm font-medium text-zinc-300">Extra Elements</label>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.hasPlateElement || false}
              onChange={(e) => updateConfig('hasPlateElement', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500"
            />
            <span className="text-xs text-zinc-300">Plate Border</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.hasSteamEffect || false}
              onChange={(e) => updateConfig('hasSteamEffect', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500"
            />
            <span className="text-xs text-zinc-300">Steam Effect</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.isOrganic || false}
              onChange={(e) => updateConfig('isOrganic', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500"
            />
            <span className="text-xs text-zinc-300">Organic/Farm-to-Table</span>
          </label>
        </div>
      </div>
    </TabsContent>
  )
}
