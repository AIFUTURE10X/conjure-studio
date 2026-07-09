"use client"

import { TabsContent } from '@/components/ui/tabs'
import {
  DotMatrixConfig,
  DOT_SIZE_OPTIONS,
  DOT_SPACING_OPTIONS,
  DOT_SHAPE_OPTIONS,
  PATTERN_STYLE_OPTIONS,
  PATTERN_COVERAGE_OPTIONS,
} from '../../../constants/dot-matrix-config'
import { OptionButton, OptionButtonSmall, ToggleSwitch } from './OptionButton'

interface DotsTabProps {
  config: DotMatrixConfig
  toggleConfig: <K extends keyof DotMatrixConfig>(key: K, value: DotMatrixConfig[K]) => void
  updateConfig: <K extends keyof DotMatrixConfig>(key: K, value: DotMatrixConfig[K]) => void
}

export function DotsTab({ config, toggleConfig, updateConfig }: DotsTabProps) {
  return (
    <TabsContent value="dots" className="mt-0 space-y-6">
      {/* Dot Size */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Dot Size</label>
        <div className="flex flex-wrap gap-2">
          {DOT_SIZE_OPTIONS.map((opt) => (
            <OptionButton key={opt.value} selected={config.dotSize === opt.value} onClick={() => toggleConfig('dotSize', opt.value)}>
              <div className="text-xs font-medium">{opt.label}</div>
              <div className="text-[10px] text-zinc-500">{opt.description}</div>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Dot Spacing */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Dot Spacing</label>
        <div className="flex flex-wrap gap-2">
          {DOT_SPACING_OPTIONS.map((opt) => (
            <OptionButton key={opt.value} selected={config.dotSpacing === opt.value} onClick={() => toggleConfig('dotSpacing', opt.value)}>
              <div className="text-xs font-medium">{opt.label}</div>
              <div className="text-[10px] text-zinc-500">{opt.description}</div>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Dot Shape */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Dot Shape</label>
        <div className="flex gap-2">
          {DOT_SHAPE_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={config.dotShape === opt.value}
              onClick={() => toggleConfig('dotShape', opt.value)}
              className="px-4 py-3 flex flex-col items-center"
            >
              <span className="text-xl mb-1">{opt.icon}</span>
              <span className="text-xs">{opt.label}</span>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Pattern Style */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Pattern Style</label>
        <div className="grid grid-cols-2 gap-2">
          {PATTERN_STYLE_OPTIONS.map((opt) => (
            <OptionButton key={opt.value} selected={config.patternStyle === opt.value} onClick={() => toggleConfig('patternStyle', opt.value)} className="text-left">
              <div className="text-xs font-medium">{opt.label}</div>
              <div className="text-[10px] text-zinc-500">{opt.description}</div>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Pattern Coverage */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Pattern Coverage</label>
        <div className="flex flex-wrap gap-2">
          {PATTERN_COVERAGE_OPTIONS.map((opt) => (
            <OptionButtonSmall key={opt.value} selected={config.patternCoverage === opt.value} onClick={() => toggleConfig('patternCoverage', opt.value)} label={opt.label} />
          ))}
        </div>
      </div>

      {/* Dot Gradient Toggle */}
      <ToggleSwitch
        enabled={config.dotGradient}
        onChange={() => updateConfig('dotGradient', !config.dotGradient)}
        label="Dot Gradient (dots fade from large to small)"
      />
    </TabsContent>
  )
}
