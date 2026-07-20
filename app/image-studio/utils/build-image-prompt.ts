/**
 * Final image-prompt assembly shared by the classic GeneratePanel and the
 * v2 studio generation engine. Keep the output byte-identical between both
 * paths — any change here affects every image generation.
 */

import {
  buildCreativeDirectionPrompt,
  type CreativeDirectionState,
} from '../constants/creative-direction-options'
import { stylePresets } from '../constants/camera-options'

/** Presets with a promptHint send the hint; everything else sends the label verbatim. */
function expandStyleForPrompt(styleValue: string): string {
  return stylePresets.find((p) => p.value === styleValue)?.promptHint ?? styleValue
}

export interface BuildImagePromptOptions {
  basePrompt: string
  selectedStylePreset: string
  selectedCameraAngle: string
  selectedCameraLens: string
  styleStrength: 'subtle' | 'moderate' | 'strong'
  creativeDirection: CreativeDirectionState
  negativePrompt: string
}

export function buildFinalImagePrompt({
  basePrompt,
  selectedStylePreset,
  selectedCameraAngle,
  selectedCameraLens,
  styleStrength,
  creativeDirection,
  negativePrompt,
}: BuildImagePromptOptions): string {
  let prompt = basePrompt
  if (selectedStylePreset !== 'Realistic') prompt += `. Style: ${expandStyleForPrompt(selectedStylePreset)}`
  if (selectedCameraAngle) prompt += `. Camera angle: ${selectedCameraAngle}`
  if (selectedCameraLens) prompt += `. Camera lens: ${selectedCameraLens}`
  prompt += `. ${{ subtle: 'subtle', moderate: 'moderate', strong: 'strong' }[styleStrength]} style influence`
  const creativePrompt = buildCreativeDirectionPrompt(creativeDirection)
  if (creativePrompt) prompt += `. ${creativePrompt}`
  if (negativePrompt.trim()) prompt += `\n\nIMPORTANT: Do NOT include: ${negativePrompt.trim()}`
  return prompt
}
