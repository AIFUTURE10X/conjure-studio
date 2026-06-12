"use client"

/**
 * useStudioSnapshot
 *
 * Builds the AI helper's currentPromptSettings + latestOutputs from studio
 * context — the reactive replacement for the one-way snapshot prop that
 * page.tsx assembles inline. Logo settings come live from the lifted logo
 * state; the latest logo output is supplied by the logo engine (shell-only)
 * via options.
 */

import { useMemo } from 'react'
import type { AIHelperLatestOutputs, AIHelperPromptSettings } from '../components/AIHelper/useAIHelperChatController'
import type { LogoOutputContext } from '../components/LogoPanel'
import { useStudioCore, useStudioLogoState } from './useStudio'

function formatBackgroundRemovalProvider(method: string) {
  if (method === 'photoroom') return 'PhotoRoom'
  if (method === 'native-transparent') return 'Native transparent PNG'
  if (method === 'none') return 'No background removal'
  return method
}

export function useStudioSnapshot(options?: { latestLogoOutput?: LogoOutputContext | null }): {
  currentPromptSettings: AIHelperPromptSettings
  latestOutputs: AIHelperLatestOutputs
} {
  const { state } = useStudioCore()
  const logo = useStudioLogoState()
  const latestLogoOutput = options?.latestLogoOutput ?? null

  const latestImageOutput = state.generatedImages.length > 0
    ? state.generatedImages[state.generatedImages.length - 1]
    : null

  const currentPromptSettings = useMemo<AIHelperPromptSettings>(() => ({
    activeTab: state.activeTab,
    currentPrompt: state.mainPrompt,
    currentNegativePrompt: state.negativePrompt,
    currentStyle: state.selectedStylePreset,
    currentCameraAngle: state.selectedCameraAngle,
    currentCameraLens: state.selectedCameraLens,
    currentAspectRatio: state.aspectRatio,
    styleStrength: state.styleStrength,
    selectedModel: state.selectedModel,
    imageSize: state.imageSize,
    imageCount: state.imageCount,
    seed: state.seed,
    analysisMode: state.analysisMode,
    imageBgRemovalEnabled: state.useImageBgRemoval,
    imageBgRemovalMethod: state.useImageBgRemoval && state.usePhotoRoomBgRemoval ? 'photoroom' : 'none',
    imageBgRemovalProvider: state.useImageBgRemoval && state.usePhotoRoomBgRemoval ? 'PhotoRoom' : 'No background removal',
    imagePhotoRoomBgRemovalEnabled: state.useImageBgRemoval && state.usePhotoRoomBgRemoval,
    logoBgRemovalEnabled: logo.bgRemovalMethod !== 'none',
    logoBgRemovalMethod: logo.bgRemovalMethod,
    logoBgRemovalProvider: formatBackgroundRemovalProvider(logo.bgRemovalMethod),
    logoRemoveBackgroundOnly: logo.removeBackgroundOnly,
    logoSelectedModel: logo.selectedModel,
    logoResolution: logo.resolution,
    logoAspectRatio: logo.aspectRatio,
    logoTextMode: logo.textMode,
    logoType: logo.logoType,
    logoVisualStyle: logo.logoVisualStyle,
    logoRenderTreatment: logo.logoRenderTreatment,
    logoTypographyDirection: logo.logoTypographyDirection,
    logoHasReferenceImage: Boolean(logo.referenceImage),
    logoReferenceMode: logo.referenceMode,
    hasReferenceImage: Boolean(state.referenceImage),
    referenceImageMode: state.referenceImage?.mode || 'none',
    creativeDirection: state.creativeDirection,
    latestImageOutput: latestImageOutput ? {
      hasOutput: true,
      prompt: latestImageOutput.prompt || state.mainPrompt,
      timestamp: latestImageOutput.timestamp,
    } : { hasOutput: false },
    latestLogoOutput: latestLogoOutput ? {
      hasOutput: true,
      prompt: latestLogoOutput.prompt || state.mainPrompt,
      negativePrompt: latestLogoOutput.negativePrompt,
      timestamp: latestLogoOutput.timestamp,
      source: latestLogoOutput.source,
      aspectRatio: latestLogoOutput.aspectRatio,
      textMode: latestLogoOutput.textMode,
      bgRemovalMethod: latestLogoOutput.bgRemovalMethod,
      seed: latestLogoOutput.seed,
      style: latestLogoOutput.style,
    } : { hasOutput: false },
  }), [state, logo, latestImageOutput, latestLogoOutput])

  const latestOutputs = useMemo<AIHelperLatestOutputs>(() => ({
    image: latestImageOutput,
    logo: latestLogoOutput,
  }), [latestImageOutput, latestLogoOutput])

  return { currentPromptSettings, latestOutputs }
}
