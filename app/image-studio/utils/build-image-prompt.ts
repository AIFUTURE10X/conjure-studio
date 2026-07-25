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

/**
 * Combine the user's typed prompt with the analyzed reference descriptions
 * (subject/scene/style captions). These used to be OR'd, so typing any prompt
 * discarded the analysis entirely; joining keeps both signals. Falls back to a
 * neutral scene only when neither is present. Used identically by both generate
 * paths so they produce the same base prompt for the same inputs.
 */
export function mergePromptWithReferenceAnalysis(mainPrompt: string, referenceAnalysis: string): string {
  return [mainPrompt.trim(), referenceAnalysis.trim()].filter(Boolean).join('. ') || 'a beautiful scene'
}

export interface BuildImagePromptOptions {
  basePrompt: string
  selectedStylePreset: string
  selectedCameraAngle: string
  selectedCameraLens: string
  styleStrength: 'subtle' | 'moderate' | 'strong'
  creativeDirection: CreativeDirectionState
  negativePrompt: string
  /**
   * True when a reference photo is attached to the request. Adds an explicit
   * likeness-lock so a heavy restyle (e.g. claymation) re-renders the SAME
   * person instead of inventing a new one. Conditional phrasing ("if it shows
   * a person") keeps it a no-op for style/scene references with no subject.
   */
  hasReferenceImage?: boolean
}

/**
 * Likeness lock for image-to-image restyles. Without this the model treats the
 * reference as loose inspiration and freely reinvents age/hair/beard — which is
 * exactly how a bald, clean-shaven user came back as a young bearded stranger.
 */
const IDENTITY_PRESERVATION_CLAUSE =
  'Use the attached reference image as the exact likeness of the subject: if it shows a person, keep it recognizably the SAME individual — preserve their facial structure and features, age, skin tone, head shape and hairline (including baldness), eyebrows, and facial hair — and only re-render them in the requested style, pose, and setting.'

/** Append a sentence fragment without doubling the punctuation ("lamp." + fragment → "lamp. …", not "lamp.. …"). */
function appendClause(base: string, fragment: string): string {
  return `${base.replace(/[.\s]+$/, '')}. ${fragment}`
}

export function buildFinalImagePrompt({
  basePrompt,
  selectedStylePreset,
  selectedCameraAngle,
  selectedCameraLens,
  styleStrength,
  creativeDirection,
  negativePrompt,
  hasReferenceImage = false,
}: BuildImagePromptOptions): string {
  let prompt = basePrompt
  // Identity lock goes first so the style clause that follows can't overpower it.
  if (hasReferenceImage) prompt = appendClause(prompt, IDENTITY_PRESERVATION_CLAUSE)
  if (selectedStylePreset !== 'Realistic') prompt = appendClause(prompt, `Style: ${expandStyleForPrompt(selectedStylePreset)}`)
  if (selectedCameraAngle) prompt = appendClause(prompt, `Camera angle: ${selectedCameraAngle}`)
  if (selectedCameraLens) prompt = appendClause(prompt, `Camera lens: ${selectedCameraLens}`)
  prompt = appendClause(prompt, `${styleStrength} style influence`)
  const creativePrompt = buildCreativeDirectionPrompt(creativeDirection)
  if (creativePrompt) prompt = appendClause(prompt, creativePrompt)
  if (negativePrompt.trim()) prompt += `\n\nIMPORTANT: Do NOT include: ${negativePrompt.trim()}`
  return prompt
}
