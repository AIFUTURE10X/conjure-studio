/**
 * Pending suggestion patch types
 *
 * A PendingSuggestion is a normalized, previewable set of setting changes
 * proposed by the AI helper. It flows: helper chat → settings rail preview
 * (diff chips) → Apply / Apply & Generate / Dismiss.
 */

import type { LogoGeneratorSettingsPatch } from '../components/LogoPanel'
import type { StudioMode } from './studio-types'

/** Image-mode settings the helper can propose (mirrors useAISuggestionsHandler inputs). */
export interface ImageSettingsPatch {
  prompt?: string
  negativePrompt?: string
  stylePreset?: string
  aspectRatio?: string
  cameraAngle?: string
  cameraLens?: string
  styleStrength?: number
  imageSize?: string
  selectedModel?: string
  imageCount?: number
  seed?: number | null
  bgRemovalMethod?: string
}

/** Logo-mode settings: the existing generator patch plus prompt text. */
export interface LogoSettingsSuggestionPatch extends LogoGeneratorSettingsPatch {
  prompt?: string
  negativePrompt?: string
}

export type SuggestionPatch =
  | { mode: 'image'; image: ImageSettingsPatch }
  | { mode: 'logo'; logo: LogoSettingsSuggestionPatch }

export interface PendingSuggestion {
  id: string
  /** Chat message the suggestion came from, for scroll-back affordances. */
  sourceMessageId?: string
  mode: Extract<StudioMode, 'image' | 'logo'>
  patch: SuggestionPatch
}
