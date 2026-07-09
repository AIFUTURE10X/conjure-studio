"use client"

import { TabsContent } from '@/components/ui/tabs'
import { DotMatrixConfig, LIGHTING_OPTIONS, BEVEL_OPTIONS, PERSPECTIVE_OPTIONS, SPARKLE_OPTIONS, SHADOW_STYLE_OPTIONS } from '../../../constants/dot-matrix-config'
import { DepthSlider, DepthLevel } from '../DepthSlider'
import { OptionButton, OptionButtonSmall, ToggleSwitch } from './OptionButton'

interface EffectsTabProps {
  config: DotMatrixConfig
  toggleConfig: <K extends keyof DotMatrixConfig>(key: K, value: DotMatrixConfig[K]) => void
  updateConfig: <K extends keyof DotMatrixConfig>(key: K, value: DotMatrixConfig[K]) => void
}

export function EffectsTab({ config, toggleConfig, updateConfig }: EffectsTabProps) {
  return (
    <TabsContent value="effects" className="mt-0 space-y-6">
      {/* 3D Depth Slider */}
      <DepthSlider
        depthAmount={config.depthAmount}
        onDepthChange={(amount) => updateConfig('depthAmount', amount)}
        depthLevel={config.depthLevel as DepthLevel | null}
        onDepthLevelChange={(level) => updateConfig('depthLevel', level)}
      />

      {/* Lighting Direction */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Lighting Direction</label>
        <div className="flex gap-2">
          {LIGHTING_OPTIONS.map((opt) => (
            <OptionButton key={opt.value} selected={config.lightingDirection === opt.value} onClick={() => toggleConfig('lightingDirection', opt.value)} className="flex items-center gap-2">
              <span className="text-lg">{opt.icon}</span>
              <span className="text-xs">{opt.label}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Bevel Style */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Bevel Style</label>
        <div className="flex gap-2">
          {BEVEL_OPTIONS.map((opt) => (
            <OptionButton key={opt.value} selected={config.bevelStyle === opt.value} onClick={() => toggleConfig('bevelStyle', opt.value)} className="px-4 py-2 text-xs">
              {opt.label}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Perspective */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Perspective</label>
        <div className="flex gap-2">
          {PERSPECTIVE_OPTIONS.map((opt) => (
            <OptionButton key={opt.value} selected={config.perspective === opt.value} onClick={() => toggleConfig('perspective', opt.value)} className="px-4 py-2 text-xs">
              {opt.label}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Sparkle Intensity */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Sparkle Effects</label>
        <div className="flex gap-2">
          {SPARKLE_OPTIONS.map((opt) => (
            <OptionButton key={opt.value} selected={config.sparkleIntensity === opt.value} onClick={() => toggleConfig('sparkleIntensity', opt.value)} className="px-4 py-2 text-xs">
              {opt.label}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Shadow Style */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Shadow</label>
        <div className="flex flex-wrap gap-2">
          {SHADOW_STYLE_OPTIONS.map((opt) => (
            <OptionButtonSmall key={opt.value} selected={config.shadowStyle === opt.value} onClick={() => toggleConfig('shadowStyle', opt.value)} label={opt.label} />
          ))}
        </div>
      </div>

      {/* Reflection Toggle */}
      <ToggleSwitch
        enabled={config.hasReflection}
        onChange={() => updateConfig('hasReflection', !config.hasReflection)}
        label="Mirror Reflection"
      />
    </TabsContent>
  )
}
