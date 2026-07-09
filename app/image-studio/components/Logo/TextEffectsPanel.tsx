"use client"

import { useState } from 'react'
import { Sparkles, Circle, Sun, Layers } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import {
  type TextOutline,
  type GlowEffect,
  type TextTexture,
  type LetterEffect,
  TEXT_OUTLINE_OPTIONS,
  GLOW_EFFECT_OPTIONS,
  TEXT_TEXTURE_OPTIONS,
  LETTER_EFFECT_OPTIONS,
} from '../../constants/text-effects-options'

// Re-export types and options for backwards compatibility
export type { TextOutline, GlowEffect, TextTexture, LetterEffect }
export { TEXT_OUTLINE_OPTIONS, GLOW_EFFECT_OPTIONS, TEXT_TEXTURE_OPTIONS, LETTER_EFFECT_OPTIONS }
export {
  getTextOutlinePrompt,
  getGlowEffectPrompt,
  getTextTexturePrompt,
  getLetterEffectPrompt,
} from '../../constants/text-effects-options'

// ============================================
// COMPONENT PROPS
// ============================================

interface TextEffectsPanelProps {
  textOutline: TextOutline | null
  glowEffect: GlowEffect | null
  textTexture: TextTexture | null
  letterEffect: LetterEffect | null
  glowIntensity: number // 0-100
  onTextOutlineChange: (outline: TextOutline | null) => void
  onGlowEffectChange: (glow: GlowEffect | null) => void
  onTextTextureChange: (texture: TextTexture | null) => void
  onLetterEffectChange: (effect: LetterEffect | null) => void
  onGlowIntensityChange: (intensity: number) => void
}

// ============================================
// COMPONENT
// ============================================

export function TextEffectsPanel({
  textOutline,
  glowEffect,
  textTexture,
  letterEffect,
  glowIntensity,
  onTextOutlineChange,
  onGlowEffectChange,
  onTextTextureChange,
  onLetterEffectChange,
  onGlowIntensityChange,
}: TextEffectsPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('outline')

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const handleOptionToggle = <T,>(
    currentValue: T | null,
    newValue: T,
    onChange: (value: T | null) => void,
    noneValue: T
  ) => {
    if (currentValue === newValue) {
      onChange(noneValue)
    } else {
      onChange(newValue)
    }
  }

  return (
    <div className="space-y-3">
      {/* Text Outline Section */}
      <div className="border border-zinc-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('outline')}
          className={`w-full flex items-center justify-between p-3 transition-colors ${
            expandedSection === 'outline' ? 'bg-zinc-800' : 'bg-zinc-800/50 hover:bg-zinc-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-white">Text Outline</span>
            {textOutline && textOutline !== 'none' && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                {TEXT_OUTLINE_OPTIONS.find(o => o.id === textOutline)?.label}
              </span>
            )}
          </div>
          <span className="text-zinc-500">{expandedSection === 'outline' ? '−' : '+'}</span>
        </button>

        {expandedSection === 'outline' && (
          <div className="p-3 bg-zinc-900/50 border-t border-zinc-700">
            <div className="grid grid-cols-4 gap-1.5">
              {TEXT_OUTLINE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleOptionToggle(textOutline, opt.id, onTextOutlineChange, 'none')}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    textOutline === opt.id
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  {opt.icon && <div className="text-lg mb-0.5">{opt.icon}</div>}
                  <div className="text-[10px] text-white">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Glow Effect Section */}
      <div className="border border-zinc-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('glow')}
          className={`w-full flex items-center justify-between p-3 transition-colors ${
            expandedSection === 'glow' ? 'bg-zinc-800' : 'bg-zinc-800/50 hover:bg-zinc-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-white">Glow Effect</span>
            {glowEffect && glowEffect !== 'none' && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300">
                {GLOW_EFFECT_OPTIONS.find(o => o.id === glowEffect)?.label}
              </span>
            )}
          </div>
          <span className="text-zinc-500">{expandedSection === 'glow' ? '−' : '+'}</span>
        </button>

        {expandedSection === 'glow' && (
          <div className="p-3 bg-zinc-900/50 border-t border-zinc-700 space-y-3">
            <div className="grid grid-cols-4 gap-1.5">
              {GLOW_EFFECT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleOptionToggle(glowEffect, opt.id, onGlowEffectChange, 'none')}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    glowEffect === opt.id
                      ? 'border-yellow-500 bg-yellow-500/20'
                      : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  {opt.icon && <div className="text-lg mb-0.5">{opt.icon}</div>}
                  <div className="text-[10px] text-white">{opt.label}</div>
                </button>
              ))}
            </div>

            {/* Glow Intensity Slider */}
            {glowEffect && glowEffect !== 'none' && (
              <div className="pt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-zinc-400">Glow Intensity</span>
                  <span className="text-xs text-yellow-400 font-mono">{glowIntensity}%</span>
                </div>
                <Slider
                  value={[glowIntensity]}
                  onValueChange={(v) => onGlowIntensityChange(v[0])}
                  min={10}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Text Texture Section */}
      <div className="border border-zinc-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('texture')}
          className={`w-full flex items-center justify-between p-3 transition-colors ${
            expandedSection === 'texture' ? 'bg-zinc-800' : 'bg-zinc-800/50 hover:bg-zinc-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-white">Surface Texture</span>
            {textTexture && textTexture !== 'smooth' && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-300">
                {TEXT_TEXTURE_OPTIONS.find(o => o.id === textTexture)?.label}
              </span>
            )}
          </div>
          <span className="text-zinc-500">{expandedSection === 'texture' ? '−' : '+'}</span>
        </button>

        {expandedSection === 'texture' && (
          <div className="p-3 bg-zinc-900/50 border-t border-zinc-700">
            <div className="grid grid-cols-4 gap-1.5">
              {TEXT_TEXTURE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleOptionToggle(textTexture, opt.id, onTextTextureChange, 'smooth')}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    textTexture === opt.id
                      ? 'border-green-500 bg-green-500/20'
                      : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <div className="text-[10px] text-white">{opt.label}</div>
                  <div className="text-[8px] text-zinc-500">{opt.description.split(' ')[0]}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Letter Effect Section */}
      <div className="border border-zinc-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('letter')}
          className={`w-full flex items-center justify-between p-3 transition-colors ${
            expandedSection === 'letter' ? 'bg-zinc-800' : 'bg-zinc-800/50 hover:bg-zinc-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-white">Letter Effect</span>
            {letterEffect && letterEffect !== 'none' && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                {LETTER_EFFECT_OPTIONS.find(o => o.id === letterEffect)?.label}
              </span>
            )}
          </div>
          <span className="text-zinc-500">{expandedSection === 'letter' ? '−' : '+'}</span>
        </button>

        {expandedSection === 'letter' && (
          <div className="p-3 bg-zinc-900/50 border-t border-zinc-700">
            <div className="grid grid-cols-4 gap-1.5">
              {LETTER_EFFECT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleOptionToggle(letterEffect, opt.id, onLetterEffectChange, 'none')}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    letterEffect === opt.id
                      ? 'border-cyan-500 bg-cyan-500/20'
                      : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  {opt.icon && <div className="text-lg mb-0.5">{opt.icon}</div>}
                  <div className="text-[10px] text-white">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active Effects Summary */}
      {(textOutline !== 'none' || glowEffect !== 'none' || textTexture !== 'smooth' || letterEffect !== 'none') && (
        <div className="p-2 bg-zinc-800/30 rounded-lg">
          <div className="text-[10px] text-zinc-500 mb-1">Active Effects:</div>
          <div className="flex flex-wrap gap-1">
            {textOutline && textOutline !== 'none' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                {TEXT_OUTLINE_OPTIONS.find(o => o.id === textOutline)?.label} Outline
              </span>
            )}
            {glowEffect && glowEffect !== 'none' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300">
                {GLOW_EFFECT_OPTIONS.find(o => o.id === glowEffect)?.label} Glow
              </span>
            )}
            {textTexture && textTexture !== 'smooth' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-300">
                {TEXT_TEXTURE_OPTIONS.find(o => o.id === textTexture)?.label} Texture
              </span>
            )}
            {letterEffect && letterEffect !== 'none' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                {LETTER_EFFECT_OPTIONS.find(o => o.id === letterEffect)?.label} Effect
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
