"use client"

/**
 * LogoSettingsRail
 *
 * Logo-mode body of the settings rail: model, resolution, ratio, text
 * mode, logo type, visual style, render treatment, typography, background
 * removal, reference image, and seed — bound to the lifted logo state.
 * SettingField wrappers surface pending AI-suggestion diffs per field.
 */

import { useRef } from 'react'
import { RotateCcw, Upload, X } from 'lucide-react'
import { SettingField } from './SettingField'
import { RailSection } from './RailSection'
import { ChipSelect, type ChipOption } from './ChipSelect'
import { useStudioLogoState, usePendingSuggestion } from '../../../context/useStudio'
import {
  DEFAULT_LOGO_GENERATION_SETTINGS,
  LOGO_ASPECT_RATIOS,
  LOGO_RESOLUTIONS,
} from '@/lib/logo-generation-contract'
import {
  LOGO_RENDER_TREATMENT_OPTIONS,
  LOGO_TYPE_OPTIONS,
  LOGO_TYPOGRAPHY_DIRECTION_OPTIONS,
  LOGO_VISUAL_STYLE_OPTIONS,
} from '../../../constants/logo-constants'
import type { LogoSettingsSuggestionPatch } from '../../../context/suggestion-patch'

const LOGO_MODEL_OPTIONS = [
  { value: 'gpt-image-2', label: 'ChatGPT Images 2.0' },
] as const

const TEXT_MODE_OPTIONS = [
  { value: 'ai-text', label: 'AI Text' },
  { value: 'exact-text-overlay', label: 'Exact Text Overlay' },
] as const

const BG_REMOVAL_CHIPS: ChipOption[] = [
  { value: 'fal', label: 'fal · BiRefNet' },
  { value: 'photoroom', label: 'PhotoRoom' },
  { value: 'none', label: 'Off' },
]

// Chip option lists derived from the shared logo constants.
const RESOLUTION_CHIPS: ChipOption[] = LOGO_RESOLUTIONS.map((r) => ({ value: r, label: r }))
const LOGO_ASPECT_RATIO_CHIPS: ChipOption[] = LOGO_ASPECT_RATIOS.map((r) => ({ value: r, label: r }))
const LOGO_TYPE_CHIPS: ChipOption[] = LOGO_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
const LOGO_VISUAL_STYLE_CHIPS: ChipOption[] = LOGO_VISUAL_STYLE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
const LOGO_RENDER_TREATMENT_CHIPS: ChipOption[] = LOGO_RENDER_TREATMENT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
const LOGO_TYPOGRAPHY_CHIPS: ChipOption[] = LOGO_TYPOGRAPHY_DIRECTION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))

export function LogoSettingsRail() {
  const state = useStudioLogoState()
  const { pendingSuggestion } = usePendingSuggestion()
  const referenceInputRef = useRef<HTMLInputElement>(null)

  const handleReferenceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onloadend = () => state.setReferenceImage({ file, preview: reader.result as string })
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const patch: LogoSettingsSuggestionPatch | null =
    pendingSuggestion?.patch.mode === 'logo' ? pendingSuggestion.patch.logo : null

  const diff = (field: keyof LogoSettingsSuggestionPatch, current: string) => {
    const suggested = patch?.[field]
    if (suggested === undefined || suggested === null) return null
    const suggestedText = String(suggested)
    return suggestedText !== current ? { current, suggested: suggestedText } : null
  }

  // Section-level resets restore only that group's fields to their defaults,
  // leaving the prompt and any generated logo untouched.
  const resetOutput = () => {
    state.setSelectedModel(DEFAULT_LOGO_GENERATION_SETTINGS.model)
    state.setResolution('1K')
    state.setAspectRatio('1:1')
    state.setTextMode('ai-text')
  }
  const resetDesign = () => {
    state.setLogoType('icon-wordmark')
    state.setLogoVisualStyle('modern')
    state.setLogoRenderTreatment('flat-vector')
    state.setLogoTypographyDirection('clean-sans')
  }
  const resetAdvanced = () => {
    state.setBgRemovalMethod(DEFAULT_LOGO_GENERATION_SETTINGS.bgRemovalMethod)
    state.setSeedLocked(false)
    state.setSeedValue(undefined)
  }
  const resetReference = () => {
    state.setReferenceImage(null)
    state.setReferenceMode('replicate')
    state.setRemoveBackgroundOnly(false)
  }
  const resetAllSettings = () => {
    resetOutput()
    resetDesign()
    resetAdvanced()
    resetReference()
  }

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-300">Logo settings</span>
        <button
          type="button"
          onClick={resetAllSettings}
          title="Reset all logo settings to defaults"
          className="flex h-7 items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-[11px] font-medium text-zinc-300 transition-colors hover:border-[#c99850]/50 hover:bg-zinc-800 hover:text-[#f2d39d]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset all
        </button>
      </div>

      <RailSection title="Model & Output" onReset={resetOutput}>
        <SettingField label="AI Model" suggestion={diff('selectedModel', state.selectedModel)}>
          <ChipSelect
            options={LOGO_MODEL_OPTIONS}
            value={state.selectedModel}
            onChange={(v) => state.setSelectedModel(v as typeof state.selectedModel)}
          />
        </SettingField>

        <SettingField label="Resolution" suggestion={diff('resolution', state.resolution)}>
          <ChipSelect
            options={RESOLUTION_CHIPS}
            value={state.resolution}
            onChange={(v) => state.setResolution(v as typeof state.resolution)}
          />
        </SettingField>

        <SettingField label="Aspect Ratio" suggestion={diff('aspectRatio', state.aspectRatio)}>
          <ChipSelect
            options={LOGO_ASPECT_RATIO_CHIPS}
            value={state.aspectRatio}
            onChange={(v) => state.setAspectRatio(v as typeof state.aspectRatio)}
          />
        </SettingField>

        <SettingField label="Text Mode" suggestion={diff('textMode', state.textMode)}>
          <ChipSelect
            options={TEXT_MODE_OPTIONS}
            value={state.textMode}
            onChange={(v) => state.setTextMode(v as typeof state.textMode)}
            columns={2}
          />
        </SettingField>
      </RailSection>

      <RailSection title="Logo Design" onReset={resetDesign}>
        <SettingField label="Logo Type" suggestion={diff('logoType', state.logoType)}>
          <ChipSelect options={LOGO_TYPE_CHIPS} value={state.logoType} onChange={(v) => state.setLogoType(v as typeof state.logoType)} />
        </SettingField>

        <SettingField label="Visual Style" suggestion={diff('logoVisualStyle', state.logoVisualStyle)}>
          <ChipSelect options={LOGO_VISUAL_STYLE_CHIPS} value={state.logoVisualStyle} onChange={(v) => state.setLogoVisualStyle(v as typeof state.logoVisualStyle)} />
        </SettingField>

        <SettingField label="Render Treatment" suggestion={diff('logoRenderTreatment', state.logoRenderTreatment)}>
          <ChipSelect options={LOGO_RENDER_TREATMENT_CHIPS} value={state.logoRenderTreatment} onChange={(v) => state.setLogoRenderTreatment(v as typeof state.logoRenderTreatment)} />
        </SettingField>

        <SettingField label="Typography" suggestion={diff('logoTypographyDirection', state.logoTypographyDirection)}>
          <ChipSelect options={LOGO_TYPOGRAPHY_CHIPS} value={state.logoTypographyDirection} onChange={(v) => state.setLogoTypographyDirection(v as typeof state.logoTypographyDirection)} />
        </SettingField>
      </RailSection>

      <RailSection title="Advanced" onReset={resetAdvanced}>
        <SettingField label="Background Removal" suggestion={diff('bgRemovalMethod', state.bgRemovalMethod)}>
          <ChipSelect
            options={BG_REMOVAL_CHIPS}
            value={state.bgRemovalMethod}
            onChange={(v) => state.setBgRemovalMethod(v as typeof state.bgRemovalMethod)}
          />
          <p className="mt-1.5 text-[10px] leading-4 text-zinc-500">
            fal · BiRefNet (default) — pay-as-you-go, top-tier edges. Off keeps the generated background.
          </p>
        </SettingField>

        <SettingField label="Seed">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={state.seedValue ?? ''}
              placeholder="Random"
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10)
                state.setSeedValue(Number.isInteger(parsed) ? parsed : undefined)
              }}
              className="h-8 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-200 placeholder:text-zinc-600"
            />
            <button
              onClick={() => state.setSeedLocked(!state.seedLocked)}
              className={`h-8 shrink-0 rounded-md px-3 text-xs font-medium transition-colors ${
                state.seedLocked
                  ? 'bg-[#c99850]/15 text-[#f2d39d] border border-[#c99850]/50'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
              }`}
            >
              {state.seedLocked ? 'Locked' : 'Lock'}
            </button>
          </div>
        </SettingField>
      </RailSection>

      <RailSection title="Reference Logo" onReset={resetReference}>
        <SettingField label="Reference Logo">
        <input
          ref={referenceInputRef}
          type="file"
          accept="image/*"
          onChange={handleReferenceUpload}
          className="hidden"
        />
        {state.referenceImage ? (
          <div className="space-y-2">
            <div className="relative rounded-md border border-zinc-700 bg-zinc-900 p-2">
              <img
                src={state.referenceImage.preview}
                alt="Logo reference"
                className="max-h-24 w-full object-contain"
              />
              <button
                onClick={() => state.setReferenceImage(null)}
                className="absolute top-1 right-1 rounded-full bg-zinc-950/80 p-1 text-zinc-400 hover:text-white"
                title="Remove reference"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {(['replicate', 'inspire'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => state.setReferenceMode(m)}
                  className={`h-7 rounded-md text-[11px] font-medium capitalize transition-colors ${
                    state.referenceMode === m
                      ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-[11px] text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={state.removeBackgroundOnly}
                onChange={(e) => state.setRemoveBackgroundOnly(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#c99850]"
              />
              Remove background only (no regeneration)
            </label>
          </div>
        ) : (
          <button
            onClick={() => referenceInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-md border border-dashed border-zinc-700 bg-zinc-900 text-xs text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload reference logo
          </button>
        )}
        </SettingField>
      </RailSection>
    </div>
  )
}
