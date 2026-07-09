"use client"

/**
 * TechElementsTab - Technology category specific settings
 *
 * Used by presets: tech-circuit, tech-ai, tech-cube
 * Provides settings for circuit patterns, glow effects, digital elements
 */

import { TabsContent } from '@/components/ui/tabs'
import { Cpu, Zap, Grid3X3, Binary } from 'lucide-react'
import {
  TechLogoConfig,
  CIRCUIT_DENSITY_OPTIONS,
  DIGITAL_EFFECT_OPTIONS,
  TECH_PATTERN_OPTIONS,
  DATA_VIZ_OPTIONS,
  TECH_GLOW_OPTIONS,
  TECH_GLOW_COLORS,
} from '../../../../../constants/preset-schemas/tech-schema'
import { OptionButton } from '../../../DotMatrixConfigurator/OptionButton'

interface TechElementsTabProps {
  config: TechLogoConfig
  updateConfig: <K extends keyof TechLogoConfig>(key: K, value: TechLogoConfig[K]) => void
  toggleConfig: <K extends keyof TechLogoConfig>(key: K, value: TechLogoConfig[K]) => void
}

export function TechElementsTab({ config, updateConfig, toggleConfig }: TechElementsTabProps) {
  return (
    <TabsContent value="tech-elements" className="mt-0 space-y-6">
      {/* Tech Pattern */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-cyan-400" />
          Tech Pattern
        </label>
        <p className="text-xs text-zinc-500">Choose the primary tech pattern style</p>
        <div className="grid grid-cols-3 gap-2">
          {TECH_PATTERN_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.techPattern === opt.value}
              onClick={() => updateConfig('techPattern', opt.value)}
              className="flex flex-col items-start p-3"
            >
              <span className="text-xs font-medium">{opt.label}</span>
              <span className="text-[10px] text-zinc-500">{opt.description}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Circuit Density */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Circuit Density
        </label>
        <div className="flex flex-wrap gap-2">
          {CIRCUIT_DENSITY_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.circuitDensity === opt.value}
              onClick={() => updateConfig('circuitDensity', opt.value)}
              className="px-3 py-2"
            >
              <span className="text-xs">{opt.label}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Glow Color */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          Glow Color
        </label>
        <div className="flex flex-wrap gap-2">
          {TECH_GLOW_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => updateConfig('glowColor', color)}
              className={`w-8 h-8 rounded-lg border-2 transition-all ${
                config.glowColor?.value === color.value
                  ? 'border-white scale-110'
                  : 'border-zinc-700 hover:border-zinc-500'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Tech Glow Style */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Glow Style</label>
        <div className="flex flex-wrap gap-2">
          {TECH_GLOW_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.techGlowStyle === opt.value}
              onClick={() => updateConfig('techGlowStyle', opt.value)}
              className="px-3 py-2"
            >
              <span className="text-xs">{opt.label}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Digital Effect */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Binary className="w-4 h-4 text-cyan-400" />
          Digital Effect
        </label>
        <div className="grid grid-cols-3 gap-2">
          {DIGITAL_EFFECT_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.digitalEffect === opt.value}
              onClick={() => updateConfig('digitalEffect', opt.value)}
              className="flex flex-col items-start p-3"
            >
              <span className="text-xs font-medium">{opt.label}</span>
              <span className="text-[10px] text-zinc-500">{opt.description}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Data Visualization */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Data Visualization</label>
        <div className="flex flex-wrap gap-2">
          {DATA_VIZ_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.dataVisualization === opt.value}
              onClick={() => updateConfig('dataVisualization', opt.value)}
              className="px-3 py-2"
            >
              <span className="text-xs">{opt.label}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Toggle Options */}
      <div className="space-y-3 pt-2 border-t border-zinc-700">
        <label className="text-sm font-medium text-zinc-300">Additional Effects</label>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.hasHolographicEffect || false}
              onChange={(e) => updateConfig('hasHolographicEffect', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-xs text-zinc-300">Holographic Effect</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.codeElements || false}
              onChange={(e) => updateConfig('codeElements', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-xs text-zinc-300">Code Elements {"</>"}</span>
          </label>
        </div>
      </div>
    </TabsContent>
  )
}
