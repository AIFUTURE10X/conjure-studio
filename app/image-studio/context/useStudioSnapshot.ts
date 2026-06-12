"use client"

/**
 * useStudioSnapshot
 *
 * Builds the AI helper's currentPromptSettings + latestOutputs from studio
 * context — the reactive replacement for the one-way snapshot prop that
 * page.tsx assembles inline. Logo generator fields use defaults until logo
 * state lifts into the provider (workspace step 7), after which they become
 * live values.
 */

import { useMemo } from 'react'
import type { AIHelperLatestOutputs, AIHelperPromptSettings } from '../components/AIHelper/useAIHelperChatController'
import { useStudioCore } from './useStudio'

// Mirrors DEFAULT_LOGO_GENERATOR_CONTEXT in page.tsx; replaced by lifted
// logo state in workspace step 7.
const DEFAULT_LOGO_SNAPSHOT = {
  bgRemovalMethod: 'photoroom',
  bgRemovalEnabled: true,
  removeBackgroundOnly: false,
  selectedModel: 'gpt-image-2',
  resolution: '1K',
  aspectRatio: '1:1',
  textMode: 'ai-text',
  logoType: 'icon-wordmark',
  logoVisualStyle: 'modern',
  logoRenderTreatment: 'flat-vector',
  logoTypographyDirection: 'clean-sans',
  hasReferenceImage: false,
  referenceMode: 'none',
}

function formatBackgroundRemovalProvider(method: string) {
  if (method === 'photoroom') return 'PhotoRoom'
  if (method === 'native-transparent') return 'Native transparent PNG'
  if (method === 'none') return 'No background removal'
  return method
}

export function useStudioSnapshot(): {
  currentPromptSettings: AIHelperPromptSettings
  latestOutputs: AIHelperLatestOutputs
} {
  const { state } = useStudioCore()

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
    logoBgRemovalEnabled: DEFAULT_LOGO_SNAPSHOT.bgRemovalEnabled,
    logoBgRemovalMethod: DEFAULT_LOGO_SNAPSHOT.bgRemovalMethod,
    logoBgRemovalProvider: formatBackgroundRemovalProvider(DEFAULT_LOGO_SNAPSHOT.bgRemovalMethod),
    logoRemoveBackgroundOnly: DEFAULT_LOGO_SNAPSHOT.removeBackgroundOnly,
    logoSelectedModel: DEFAULT_LOGO_SNAPSHOT.selectedModel,
    logoResolution: DEFAULT_LOGO_SNAPSHOT.resolution,
    logoAspectRatio: DEFAULT_LOGO_SNAPSHOT.aspectRatio,
    logoTextMode: DEFAULT_LOGO_SNAPSHOT.textMode,
    logoType: DEFAULT_LOGO_SNAPSHOT.logoType,
    logoVisualStyle: DEFAULT_LOGO_SNAPSHOT.logoVisualStyle,
    logoRenderTreatment: DEFAULT_LOGO_SNAPSHOT.logoRenderTreatment,
    logoTypographyDirection: DEFAULT_LOGO_SNAPSHOT.logoTypographyDirection,
    logoHasReferenceImage: DEFAULT_LOGO_SNAPSHOT.hasReferenceImage,
    logoReferenceMode: DEFAULT_LOGO_SNAPSHOT.referenceMode,
    hasReferenceImage: Boolean(state.referenceImage),
    referenceImageMode: state.referenceImage?.mode || 'none',
    creativeDirection: state.creativeDirection,
    latestImageOutput: latestImageOutput ? {
      hasOutput: true,
      prompt: latestImageOutput.prompt || state.mainPrompt,
      timestamp: latestImageOutput.timestamp,
    } : { hasOutput: false },
    latestLogoOutput: { hasOutput: false },
  }), [state, latestImageOutput])

  const latestOutputs = useMemo<AIHelperLatestOutputs>(() => ({
    image: latestImageOutput,
    logo: null,
  }), [latestImageOutput])

  return { currentPromptSettings, latestOutputs }
}
