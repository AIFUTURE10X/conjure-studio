"use client"

import { TabsContent } from '@/components/ui/tabs'
import { Sparkles } from 'lucide-react'
import { DotMatrixConfig, SWOOSH_STYLE_OPTIONS, SWOOSH_POSITION_OPTIONS } from '../../../constants/dot-matrix-config'
import { TextEffectsPanel, TextOutline, GlowEffect, TextTexture, LetterEffect } from '../TextEffectsPanel'
import { OptionButton, OptionButtonSmall } from './OptionButton'

interface AdvancedTabProps {
  config: DotMatrixConfig
  toggleConfig: <K extends keyof DotMatrixConfig>(key: K, value: DotMatrixConfig[K]) => void
  updateConfig: <K extends keyof DotMatrixConfig>(key: K, value: DotMatrixConfig[K]) => void
}

export function AdvancedTab({ config, toggleConfig, updateConfig }: AdvancedTabProps) {
  return (
    <TabsContent value="advanced" className="mt-0 space-y-6">
      {/* Text Effects Panel Header */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Text Effects
        </label>
        <p className="text-xs text-zinc-500">
          Add outlines, glow, textures, and special letter effects
        </p>
      </div>

      <TextEffectsPanel
        textOutline={config.textOutline as TextOutline | null}
        glowEffect={config.glowEffect as GlowEffect | null}
        textTexture={config.textTexture as TextTexture | null}
        letterEffect={config.letterEffect as LetterEffect | null}
        glowIntensity={config.glowIntensity}
        onTextOutlineChange={(outline) => updateConfig('textOutline', outline)}
        onGlowEffectChange={(glow) => updateConfig('glowEffect', glow)}
        onTextTextureChange={(texture) => updateConfig('textTexture', texture)}
        onLetterEffectChange={(effect) => updateConfig('letterEffect', effect)}
        onGlowIntensityChange={(intensity) => updateConfig('glowIntensity', intensity)}
      />

      {/* Divider */}
      <div className="border-t border-zinc-700 pt-4">
        <p className="text-xs text-zinc-500 mb-4">Decorative Elements</p>
      </div>

      {/* Swoosh Style */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Swoosh / Arc Style</label>
        <div className="grid grid-cols-3 gap-2">
          {SWOOSH_STYLE_OPTIONS.map((opt) => (
            <OptionButton key={opt.value} selected={config.swooshStyle === opt.value} onClick={() => toggleConfig('swooshStyle', opt.value)} className="text-left">
              <div className="text-xs font-medium">{opt.label}</div>
              <div className="text-[10px] text-zinc-500">{opt.description}</div>
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Swoosh Position */}
      {config.swooshStyle && config.swooshStyle !== 'none' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Swoosh Position</label>
          <div className="flex flex-wrap gap-2">
            {SWOOSH_POSITION_OPTIONS.map((opt) => (
              <OptionButtonSmall key={opt.value} selected={config.swooshPosition === opt.value} onClick={() => toggleConfig('swooshPosition', opt.value)} label={opt.label} />
            ))}
          </div>
        </div>
      )}
    </TabsContent>
  )
}
