"use client"

/**
 * ImageSettingsRail
 *
 * Image-mode body of the settings rail: model, size, ratio, style, camera,
 * strength, creative direction, seed, reference image, background removal,
 * and the upload-section toggle — all bound to studio context. SettingField
 * wrappers surface pending AI-suggestion diffs per field.
 */

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Upload } from 'lucide-react'
import { SeedControlDropdown } from '../../SeedControlDropdown'
import { ReferenceImageUpload } from '../../GeneratePanel/ReferenceImageUpload'
import { CreativeDirectionPopover } from '../../Toolbar'
import { SettingField } from './SettingField'
import { useStudioCore, usePendingSuggestion } from '../../../context/useStudio'
import { useImageGenerationEngine } from '../../../context/ImageGenerationProvider'
import { ASPECT_RATIO_OPTIONS } from '../../../constants/toolbar-options'
import {
  cameraAngleOptions,
  cameraLensOptions,
  stylePresets,
} from '../../../constants/camera-options'
import type { ImageSettingsPatch } from '../../../context/suggestion-patch'

const MODEL_OPTIONS = [
  { value: 'gemini-3.1-flash-image-preview', label: 'Gemini 3.1 Flash' },
  { value: 'gpt-image-2', label: 'ChatGPT Images 2.0' },
  { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro' },
] as const

const IMAGE_SIZES = ['1K', '2K', '4K'] as const
const STYLE_STRENGTHS = ['subtle', 'moderate', 'strong'] as const
const NONE_VALUE = '__none__'

const selectTriggerClass = 'w-full h-8 bg-zinc-900 border-zinc-700 text-xs text-zinc-200'
const selectContentClass = 'bg-zinc-900 border-zinc-700 text-zinc-200'

export function ImageSettingsRail() {
  const { state } = useStudioCore()
  const { pendingSuggestion } = usePendingSuggestion()
  const { photoRoomBgRemovalEnabled, setPhotoRoomBgRemovalEnabled } = useImageGenerationEngine()

  const patch: ImageSettingsPatch | null =
    pendingSuggestion?.patch.mode === 'image' ? pendingSuggestion.patch.image : null

  const diff = (field: keyof ImageSettingsPatch, current: string) => {
    const suggested = patch?.[field]
    if (suggested === undefined || suggested === null) return null
    const suggestedText = String(suggested)
    return suggestedText !== current ? { current, suggested: suggestedText } : null
  }

  return (
    <div className="p-4 space-y-4">
      <SettingField label="AI Model" suggestion={diff('selectedModel', state.selectedModel)}>
        <Select value={state.selectedModel} onValueChange={(v) => state.setSelectedModel(v as any)}>
          <SelectTrigger className={selectTriggerClass}><SelectValue /></SelectTrigger>
          <SelectContent className={selectContentClass}>
            {MODEL_OPTIONS.map((m) => (
              <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingField>

      <SettingField label="Image Size" suggestion={diff('resolution', state.imageSize)}>
        <div className="grid grid-cols-3 gap-1">
          {IMAGE_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => state.setImageSize(size)}
              className={`h-8 rounded-md text-xs font-bold transition-colors ${
                state.imageSize === size
                  ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </SettingField>

      <SettingField label="Aspect Ratio" suggestion={diff('aspectRatio', state.aspectRatio)}>
        <Select value={state.aspectRatio} onValueChange={state.setAspectRatio}>
          <SelectTrigger className={selectTriggerClass}><SelectValue /></SelectTrigger>
          <SelectContent className={selectContentClass}>
            {ASPECT_RATIO_OPTIONS.map((r) => (
              <SelectItem key={r.value} value={r.value} className="text-xs">
                {r.label} — {r.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingField>

      <SettingField label="Style" suggestion={diff('style', state.selectedStylePreset)}>
        <Select value={state.selectedStylePreset} onValueChange={state.setSelectedStylePreset}>
          <SelectTrigger className={selectTriggerClass}><SelectValue /></SelectTrigger>
          <SelectContent className={selectContentClass}>
            {stylePresets.map((s) => (
              <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingField>

      <Separator className="bg-zinc-800" />

      <SettingField label="Camera Angle" suggestion={diff('cameraAngle', state.selectedCameraAngle)}>
        <Select
          value={state.selectedCameraAngle || NONE_VALUE}
          onValueChange={(v) => state.setSelectedCameraAngle(v === NONE_VALUE ? '' : v)}
        >
          <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="None" /></SelectTrigger>
          <SelectContent className={selectContentClass}>
            <SelectItem value={NONE_VALUE} className="text-xs">None</SelectItem>
            {cameraAngleOptions.map((angle) => (
              <SelectItem key={angle} value={angle} className="text-xs">{angle}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingField>

      <SettingField label="Camera Lens" suggestion={diff('cameraLens', state.selectedCameraLens)}>
        <Select
          value={state.selectedCameraLens || NONE_VALUE}
          onValueChange={(v) => state.setSelectedCameraLens(v === NONE_VALUE ? '' : v)}
        >
          <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="None" /></SelectTrigger>
          <SelectContent className={selectContentClass}>
            <SelectItem value={NONE_VALUE} className="text-xs">None</SelectItem>
            {cameraLensOptions.map((lens) => (
              <SelectItem key={lens} value={lens} className="text-xs">{lens}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingField>

      <SettingField label="Style Strength" suggestion={diff('styleStrength', state.styleStrength)}>
        <div className="grid grid-cols-3 gap-1">
          {STYLE_STRENGTHS.map((strength) => (
            <button
              key={strength}
              onClick={() => state.setStyleStrength(strength)}
              className={`h-8 rounded-md text-xs font-medium capitalize transition-colors ${
                state.styleStrength === strength
                  ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              {strength}
            </button>
          ))}
        </div>
      </SettingField>

      <SettingField label="Creative Direction">
        <CreativeDirectionPopover
          creativeDirection={state.creativeDirection}
          onCreativeDirectionChange={state.setCreativeDirection}
        />
      </SettingField>

      <Separator className="bg-zinc-800" />

      <SettingField label="Seed">
        <SeedControlDropdown seed={state.seed} onSeedChange={state.setSeed} />
      </SettingField>

      <SettingField label="Background Removal" suggestion={diff('bgRemovalMethod', photoRoomBgRemovalEnabled ? 'photoroom' : 'none')}>
        <label
          className={`flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition-colors cursor-pointer ${
            photoRoomBgRemovalEnabled
              ? 'border-[#c99850]/60 bg-[#c99850]/10 text-[#f2d39d]'
              : 'border-zinc-700 bg-zinc-900 text-zinc-300'
          }`}
        >
          <input
            type="checkbox"
            checked={photoRoomBgRemovalEnabled}
            onChange={(e) => setPhotoRoomBgRemovalEnabled(e.target.checked)}
            aria-label="Turn PhotoRoom background removal on or off"
            className="h-3.5 w-3.5 accent-[#c99850]"
          />
          PhotoRoom BG
        </label>
      </SettingField>

      <SettingField label="Reference Image">
        <ReferenceImageUpload
          referenceImage={state.referenceImage}
          onImageChange={state.setReferenceImage}
        />
      </SettingField>

      <Separator className="bg-zinc-800" />

      <Button
        onClick={() => state.setShowUploadSection(!state.showUploadSection)}
        variant="ghost"
        className={`w-full h-9 text-xs justify-start gap-2 ${
          state.showUploadSection
            ? 'bg-[#c99850]/10 text-[#f2d39d] hover:bg-[#c99850]/20'
            : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
        }`}
      >
        <Upload className="w-3.5 h-3.5" />
        {state.showUploadSection ? 'Hide upload & analysis' : 'Upload & analyze images'}
      </Button>
    </div>
  )
}
