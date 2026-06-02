"use client"

import { Settings2, ChevronDown, ChevronUp, Lock, Unlock } from 'lucide-react'
import { DEFAULT_LOGO_GENERATION_SETTINGS } from '@/lib/logo-generation-contract'
import type { BgRemovalMethod, LogoAspectRatio, LogoGenerationModel, LogoTextMode } from '../../hooks/useLogoGeneration'
import {
  LogoResolution,
  RESOLUTION_OPTIONS,
  LOGO_MODEL_OPTIONS,
  LOGO_TEXT_MODE_OPTIONS
} from '../../constants/logo-constants'
import { ASPECT_RATIO_OPTIONS, getAspectRatioDimensions } from '../../constants/toolbar-options'

interface LogoAdvancedSettingsProps {
  showAdvanced: boolean
  setShowAdvanced: (show: boolean) => void
  resolution: LogoResolution
  setResolution: (res: LogoResolution) => void
  aspectRatio: LogoAspectRatio
  setAspectRatio: (ratio: LogoAspectRatio) => void
  selectedModel: LogoGenerationModel
  setSelectedModel: (model: LogoGenerationModel) => void
  textMode: LogoTextMode
  setTextMode: (mode: LogoTextMode) => void
  seedLocked: boolean
  setSeedLocked: (locked: boolean) => void
  seedValue: number | undefined
  setSeedValue: (value: number | undefined) => void
  bgRemovalMethod: BgRemovalMethod
  setBgRemovalMethod: (method: BgRemovalMethod) => void
  isGenerating: boolean
  isRemovingBackground: boolean
}

export function LogoAdvancedSettings({
  showAdvanced,
  setShowAdvanced,
  resolution,
  setResolution,
  aspectRatio,
  setAspectRatio,
  selectedModel,
  setSelectedModel,
  textMode,
  setTextMode,
  seedLocked,
  setSeedLocked,
  seedValue,
  setSeedValue,
  bgRemovalMethod,
  setBgRemovalMethod,
  isGenerating,
  isRemovingBackground,
}: LogoAdvancedSettingsProps) {
  const isDisabled = isGenerating || isRemovingBackground
  const seedDisabled = isDisabled || selectedModel === 'gpt-image-2'
  const handleBackgroundRemovalToggle = (enabled: boolean) => {
    if (enabled) {
      setBgRemovalMethod(DEFAULT_LOGO_GENERATION_SETTINGS.bgRemovalMethod)
      return
    }

    setBgRemovalMethod('none')
  }

  return (
    <>
      {/* Advanced Settings Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
      >
        <Settings2 className="w-3 h-3" />
        Advanced Settings
        {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {/* Advanced Settings Panel */}
      {showAdvanced && (
        <div className="p-2 bg-zinc-800/50 rounded-lg border border-zinc-700 space-y-2">
          {/* Model Setting */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400">AI Model</label>
            <div className="grid grid-cols-3 gap-1">
              {LOGO_MODEL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedModel(option.value)}
                  disabled={isDisabled}
                  className={`
                    flex min-h-[54px] flex-col items-center justify-center py-2 px-2 rounded-lg border transition-all
                    ${selectedModel === option.value
                      ? 'border-[#c99850] bg-linear-to-b from-[#c99850] to-[#a67c3d] text-black'
                      : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 text-white'
                    }
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span className="text-[11px] font-semibold leading-tight text-center">{option.label}</span>
                  <span className={`text-[9px] leading-tight text-center ${selectedModel === option.value ? 'text-black/70' : 'text-zinc-500'}`}>
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Text Handling Setting */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400">Text Handling</label>
            <div className="grid grid-cols-2 gap-1">
              {LOGO_TEXT_MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTextMode(option.value)}
                  disabled={isDisabled}
                  className={`
                    flex min-h-[54px] flex-col items-center justify-center rounded-lg border px-2 py-2 transition-all
                    ${textMode === option.value
                      ? 'border-[#c99850] bg-[#c99850]/10 text-[#dbb56e]'
                      : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 text-white'
                    }
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span className="text-[11px] font-semibold leading-tight text-center">{option.label}</span>
                  <span className={`text-[9px] leading-tight text-center ${textMode === option.value ? 'text-[#dbb56e]/75' : 'text-zinc-500'}`}>
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[9px] text-zinc-500">
              Exact Text creates a clean symbol first, then uses the Real Font Overlay for readable brand lettering
            </p>
          </div>

          {/* Aspect Ratio Setting */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400">Aspect Ratio</label>
            <div className="grid grid-cols-5 gap-1">
              {ASPECT_RATIO_OPTIONS.map((option) => {
                const dimensions = getAspectRatioDimensions(option.value)
                const isSelected = aspectRatio === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAspectRatio(option.value as LogoAspectRatio)}
                    disabled={isDisabled}
                    className={`
                      flex min-h-[68px] flex-col items-center justify-center rounded-lg border px-1.5 py-2 transition-all
                      ${isSelected
                        ? 'border-[#c99850] bg-[#c99850]/10 text-[#dbb56e]'
                        : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 text-white'
                      }
                      ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    title={`${option.label} ${option.description}`}
                  >
                    <span
                      className={`mb-1 rounded-sm border-2 ${isSelected ? 'border-[#c99850] bg-[#c99850]/15' : 'border-zinc-500 bg-zinc-900'}`}
                      style={dimensions}
                    />
                    <span className="text-[10px] font-semibold leading-tight">{option.label}</span>
                    <span className={`text-[8px] leading-tight ${isSelected ? 'text-[#dbb56e]/75' : 'text-zinc-500'}`}>
                      {option.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Resolution Setting */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400">Resolution</label>
            <div className="grid grid-cols-3 gap-1">
              {RESOLUTION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setResolution(option.value)}
                  disabled={isDisabled}
                  className={`
                    flex flex-col items-center py-2 px-3 rounded-lg border transition-all
                    ${resolution === option.value
                      ? 'border-[#c99850] bg-linear-to-b from-[#c99850] to-[#a67c3d] text-black'
                      : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 text-white'
                    }
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span className="text-sm font-semibold">{option.value}</span>
                  <span className={`text-[9px] ${resolution === option.value ? 'text-black/70' : 'text-zinc-500'}`}>
                    ~{option.value === '1K' ? '1024' : option.value === '2K' ? '2048' : '4096'}px
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[9px] text-zinc-500">
              Higher resolutions may upscale after generation when the model returns a smaller native image
            </p>
          </div>

          {/* Seed Lock Setting */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400">Seed Lock</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSeedLocked(!seedLocked)}
                disabled={seedDisabled}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs
                  ${seedLocked
                    ? 'border-[#c99850] bg-[#c99850]/10 text-[#dbb56e]'
                    : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 text-zinc-400'
                  }
                  ${seedDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {seedLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                {seedLocked ? 'Locked' : 'Unlocked'}
              </button>
              <input
                type="number"
                value={seedValue ?? ''}
                onChange={(e) => setSeedValue(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                placeholder="Auto"
                disabled={seedDisabled}
                className="flex-1 px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:border-[#c99850] placeholder:text-zinc-600"
              />
            </div>
            <p className="text-[9px] text-zinc-500">
              {selectedModel === 'gpt-image-2'
                ? 'Seed lock is unavailable for ChatGPT Images 2.0'
                : seedLocked
                  ? 'Generation will use the seed above for reproducible Gemini results'
                  : seedValue
                    ? `Last seed: ${seedValue} (click Lock to reuse)`
                    : 'Lock seed to reproduce similar logos at different resolutions'}
            </p>
          </div>

          {/* Background Removal */}
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400">Background Removal</label>
            <label className="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-white">
              <input
                type="checkbox"
                checked={bgRemovalMethod !== 'none'}
                onChange={(e) => handleBackgroundRemovalToggle(e.target.checked)}
                disabled={isDisabled}
                className="h-3.5 w-3.5 accent-[#c99850]"
              />
              PhotoRoom BG
            </label>
            <p className="text-[9px] text-zinc-500">
              {bgRemovalMethod === 'none'
                ? 'Off keeps the generated logo background intact.'
                : 'PhotoRoom removes the background after generation for a cleaner PNG.'}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
