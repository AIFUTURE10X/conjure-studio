"use client"

/**
 * SportsEnergyTab - Sports/Fitness category specific settings
 *
 * Used by presets: sports-fitness
 * Provides settings for energy level, motion effects, sports elements
 */

import { TabsContent } from '@/components/ui/tabs'
import { Dumbbell, Zap, Flame, Medal } from 'lucide-react'
import {
  SportsLogoConfig,
  SPORTS_TYPE_OPTIONS,
  ENERGY_LEVEL_OPTIONS,
  MOTION_EFFECT_OPTIONS,
  SPORTS_ELEMENT_OPTIONS,
  MUSCLE_STYLE_OPTIONS,
  SPORTS_COLORS,
} from '../../../../../constants/preset-schemas/sports-schema'
import { OptionButton } from '../../../DotMatrixConfigurator/OptionButton'

interface SportsEnergyTabProps {
  config: SportsLogoConfig
  updateConfig: <K extends keyof SportsLogoConfig>(key: K, value: SportsLogoConfig[K]) => void
  toggleConfig: <K extends keyof SportsLogoConfig>(key: K, value: SportsLogoConfig[K]) => void
}

export function SportsEnergyTab({ config, updateConfig, toggleConfig }: SportsEnergyTabProps) {
  return (
    <TabsContent value="sports-energy" className="mt-0 space-y-6">
      {/* Sports Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-red-400" />
          Sports Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {SPORTS_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateConfig('sportsType', opt.value)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                config.sportsType === opt.value
                  ? 'border-red-500 bg-red-500/20'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className="text-xs text-white">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Energy Level */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          Energy Level
        </label>
        <div className="grid grid-cols-5 gap-2">
          {ENERGY_LEVEL_OPTIONS.map((opt, index) => (
            <button
              key={opt.value}
              onClick={() => updateConfig('energyLevel', opt.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                config.energyLevel === opt.value
                  ? 'border-red-500 bg-red-500/20'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <div className="flex gap-0.5">
                {Array.from({ length: index + 1 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-3 rounded-sm ${
                      config.energyLevel === opt.value ? 'bg-red-400' : 'bg-zinc-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-white">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Motion Effect */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Motion Effect</label>
        <div className="grid grid-cols-3 gap-2">
          {MOTION_EFFECT_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.motionEffect === opt.value}
              onClick={() => updateConfig('motionEffect', opt.value)}
              className="flex flex-col items-start p-3"
            >
              <span className="text-xs font-medium">{opt.label}</span>
              <span className="text-[10px] text-zinc-500">{opt.description}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Sports Element */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Medal className="w-4 h-4 text-amber-400" />
          Sports Element
        </label>
        <div className="grid grid-cols-4 gap-2">
          {SPORTS_ELEMENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateConfig('sportsElement', opt.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                config.sportsElement === opt.value
                  ? 'border-red-500 bg-red-500/20'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className="text-[10px] text-white">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Muscle Style */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Muscle/Figure Style</label>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_STYLE_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.muscleStyle === opt.value}
              onClick={() => updateConfig('muscleStyle', opt.value)}
              className="px-3 py-2"
            >
              <span className="text-xs">{opt.label}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Primary Sports Color */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Primary Color</label>
        <div className="flex flex-wrap gap-2">
          {SPORTS_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => updateConfig('primarySportsColor', color)}
              className={`w-8 h-8 rounded-lg border-2 transition-all ${
                config.primarySportsColor?.value === color.value
                  ? 'border-white scale-110'
                  : 'border-zinc-700 hover:border-zinc-500'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Secondary Sports Color */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Secondary Color</label>
        <div className="flex flex-wrap gap-2">
          {SPORTS_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => updateConfig('secondarySportsColor', color)}
              className={`w-8 h-8 rounded-lg border-2 transition-all ${
                config.secondarySportsColor?.value === color.value
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
        <label className="text-sm font-medium text-zinc-300">Power Effects</label>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.hasFlameEffect || false}
              onChange={(e) => updateConfig('hasFlameEffect', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-red-500 focus:ring-red-500"
            />
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-zinc-300">Flame Effect</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.hasWingsElement || false}
              onChange={(e) => updateConfig('hasWingsElement', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-red-500 focus:ring-red-500"
            />
            <span className="text-xs text-zinc-300">Wings Element</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showChampionStyle || false}
              onChange={(e) => updateConfig('showChampionStyle', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-red-500 focus:ring-red-500"
            />
            <Medal className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-zinc-300">Champion Style</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.isTeamLogo || false}
              onChange={(e) => updateConfig('isTeamLogo', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-red-500 focus:ring-red-500"
            />
            <span className="text-xs text-zinc-300">Team Logo</span>
          </label>
        </div>
      </div>
    </TabsContent>
  )
}
