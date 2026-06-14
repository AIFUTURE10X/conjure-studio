import type { LogoSettingsSuggestionPatch } from '../../../context/suggestion-patch'

/** Helper model tier the user can pick for variation generation. */
export type HelperModelTier = 'fast' | 'hq'

/** One AI-generated logo direction returned by /api/generate-logo-variations. */
export interface LogoVariation {
  id: string
  label: string
  rationale: string
  prompt: string
  negativePrompt?: string
  logoType?: string
  logoVisualStyle?: string
  logoRenderTreatment?: string
  logoTypographyDirection?: string
  textMode?: string
  aspectRatio?: string
  resolution?: string
}

/** Convert a variation into the patch shape consumed by applyLogoSettingsPatch. */
export function variationToPatch(v: LogoVariation): LogoSettingsSuggestionPatch {
  return {
    prompt: v.prompt,
    ...(v.negativePrompt ? { negativePrompt: v.negativePrompt } : {}),
    ...(v.textMode ? { textMode: v.textMode } : {}),
    ...(v.aspectRatio ? { aspectRatio: v.aspectRatio } : {}),
    ...(v.resolution ? { resolution: v.resolution } : {}),
    ...(v.logoType ? { logoType: v.logoType } : {}),
    ...(v.logoVisualStyle ? { logoVisualStyle: v.logoVisualStyle } : {}),
    ...(v.logoRenderTreatment ? { logoRenderTreatment: v.logoRenderTreatment } : {}),
    ...(v.logoTypographyDirection ? { logoTypographyDirection: v.logoTypographyDirection } : {}),
  }
}
