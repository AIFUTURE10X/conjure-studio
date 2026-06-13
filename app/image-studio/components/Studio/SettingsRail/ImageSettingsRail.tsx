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
import { Separator } from '@/components/ui/separator'
import { Upload } from 'lucide-react'
import { SeedControlDropdown } from '../../SeedControlDropdown'
import { ReferenceImageUpload } from '../../GeneratePanel/ReferenceImageUpload'
import { PresetControls } from '../../GeneratePanel/PresetControls'
import { CreativeDirectionPopover } from '../../Toolbar'
import { SettingField } from './SettingField'
import { ChipSelect, type ChipOption } from './ChipSelect'
import { normalizeCreativeDirection } from '../../../constants/creative-direction-options'
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

// Chip options derived from the shared constants.
const ASPECT_RATIO_CHIPS: ChipOption[] = ASPECT_RATIO_OPTIONS.map((r) => ({ value: r.value, label: r.value }))
const STYLE_CHIPS: ChipOption[] = stylePresets.map((s) => ({
  value: s.value,
  label: s.label,
  thumbnail: s.thumbnail,
  description: s.description,
}))
const CAMERA_ANGLE_CHIPS: ChipOption[] = [{ value: '', label: 'None' }, ...cameraAngleOptions.map((a) => ({ value: a, label: a }))]
const CAMERA_LENS_CHIPS: ChipOption[] = [{ value: '', label: 'None' }, ...cameraLensOptions.map((l) => ({ value: l, label: l }))]

export function ImageSettingsRail() {
  const { state, presets, savePreset, handleLoadPreset } = useStudioCore()
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
        <ChipSelect
          options={MODEL_OPTIONS}
          value={state.selectedModel}
          onChange={(v) => state.setSelectedModel(v as any)}
        />
      </SettingField>

      <SettingField label="Image Size" suggestion={diff('resolution', state.imageSize)}>
        <ChipSelect
          options={IMAGE_SIZES.map((s) => ({ value: s, label: s }))}
          value={state.imageSize}
          onChange={(v) => state.setImageSize(v as typeof state.imageSize)}
        />
      </SettingField>

      <SettingField label="Aspect Ratio" suggestion={diff('aspectRatio', state.aspectRatio)}>
        <ChipSelect options={ASPECT_RATIO_CHIPS} value={state.aspectRatio} onChange={state.setAspectRatio} />
      </SettingField>

      <SettingField label="Style" suggestion={diff('style', state.selectedStylePreset)}>
        <ChipSelect options={STYLE_CHIPS} value={state.selectedStylePreset} onChange={state.setSelectedStylePreset} />
      </SettingField>

      <Separator className="bg-zinc-800" />

      <SettingField label="Camera Angle" suggestion={diff('cameraAngle', state.selectedCameraAngle)}>
        <ChipSelect options={CAMERA_ANGLE_CHIPS} value={state.selectedCameraAngle} onChange={state.setSelectedCameraAngle} />
      </SettingField>

      <SettingField label="Camera Lens" suggestion={diff('cameraLens', state.selectedCameraLens)}>
        <ChipSelect options={CAMERA_LENS_CHIPS} value={state.selectedCameraLens} onChange={state.setSelectedCameraLens} />
      </SettingField>

      <SettingField label="Style Strength" suggestion={diff('styleStrength', state.styleStrength)}>
        <ChipSelect
          options={STYLE_STRENGTHS.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
          value={state.styleStrength}
          onChange={(v) => state.setStyleStrength(v as typeof state.styleStrength)}
        />
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

      <SettingField label="Presets">
        <PresetControls
          mainPrompt={state.mainPrompt}
          negativePrompt={state.negativePrompt}
          aspectRatio={state.aspectRatio}
          selectedStylePreset={state.selectedStylePreset}
          selectedCameraAngle={state.selectedCameraAngle}
          selectedCameraLens={state.selectedCameraLens}
          styleStrength={state.styleStrength}
          imageSize={state.imageSize}
          selectedModel={state.selectedModel}
          creativeDirection={normalizeCreativeDirection(state.creativeDirection)}
          presets={presets}
          onSavePreset={savePreset}
          onLoadPreset={handleLoadPreset}
          onSetMainPrompt={state.setMainPrompt}
          onSetNegativePrompt={state.setNegativePrompt}
        />
      </SettingField>

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
