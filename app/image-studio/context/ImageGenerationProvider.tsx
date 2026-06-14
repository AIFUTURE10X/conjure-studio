"use client"

/**
 * ImageGenerationProvider
 *
 * v2 studio image-generation engine. Mirrors GeneratePanel's generate flow
 * (same shared hooks, same buildFinalImagePrompt) but reads everything from
 * the studio context so PromptDock, ResultsCanvas, and the settings rail
 * share one isGenerating state. Mounted only inside StudioShell; the classic
 * page keeps GeneratePanel's internal logic until the shell swap.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { usePromptBuilder } from '../hooks/usePromptBuilder'
import { useImageGeneration } from '../hooks/useImageGeneration'
import { useGenerationHistory } from '../hooks/useGenerationHistory'
import { downloadImageAsFile } from '../utils/export-utils'
import { buildFinalImagePrompt } from '../utils/build-image-prompt'
import { normalizeCreativeDirection } from '../constants/creative-direction-options'
import { useStudioCore } from './useStudio'

export interface ImageMetadata {
  dimensions: string
  fileSize: string
}

export interface ImageGenerationEngine {
  isGenerating: boolean
  error: string | null
  generateNow: () => Promise<void>
  /** Queue a generate that runs in an effect after pending state updates flush. */
  requestGenerate: () => void
  clearImages: () => void
  downloadImage: (url: string, index: number, prompt?: string) => Promise<void>
  removeBackground: (index: number) => Promise<void>
  upscaleToFourK: (index: number) => Promise<void>
  getImageMetadata: (url: string) => Promise<ImageMetadata>
  photoRoomBgRemovalEnabled: boolean
  setPhotoRoomBgRemovalEnabled: (enabled: boolean) => void
}

const ImageGenerationContext = createContext<ImageGenerationEngine | null>(null)

async function getImageMetadata(url: string): Promise<ImageMetadata> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = async () => {
      let fileSize = '~2 MB'
      try {
        if (url.startsWith('data:')) {
          const b64 = url.split(',')[1]
          if (b64) fileSize = `~${(Math.ceil((b64.length * 3) / 4) / 1048576).toFixed(1)} MB`
        } else {
          const r = await fetch(url, { method: 'HEAD' })
          const cl = r.headers.get('content-length')
          if (cl) fileSize = `~${(parseInt(cl) / 1048576).toFixed(1)} MB`
        }
      } catch {}
      resolve({ dimensions: `${img.width}×${img.height}`, fileSize })
    }
    img.onerror = () => resolve({ dimensions: 'Unknown', fileSize: 'Unknown' })
    img.src = url
  })
}

export function ImageGenerationProvider({ children }: { children: ReactNode }) {
  const { uploadState, state, saveParameters, saveGenerateParams } = useStudioCore()

  const { combinedPrompt } = usePromptBuilder(uploadState.subjectImages, state.analysisResults)
  const { isGenerating, error, generateImages, clearImages, upscaleImage } = useImageGeneration(
    state.setGeneratedImages,
    (info) => toast.info(info.reason, { duration: 6000 }),
  )
  const { saveToHistory } = useGenerationHistory()

  const photoRoomBgRemovalEnabled = state.useImageBgRemoval && state.usePhotoRoomBgRemoval
  const setPhotoRoomBgRemovalEnabled = useCallback((enabled: boolean) => {
    state.setUseImageBgRemoval(enabled)
    state.setUsePhotoRoomBgRemoval(enabled)
  }, [state.setUseImageBgRemoval, state.setUsePhotoRoomBgRemoval])

  const generateNow = useCallback(async () => {
    const finalPrompt = state.mainPrompt.trim() || combinedPrompt.trim() || 'a beautiful scene'
    const imageQuality = state.analysisMode === 'fast' ? 'low' : 'medium'
    const normalizedCreativeDirection = normalizeCreativeDirection(state.creativeDirection)

    saveParameters({
      mainPrompt: finalPrompt,
      aspectRatio: state.aspectRatio,
      selectedStylePreset: state.selectedStylePreset,
      imageCount: state.imageCount,
      negativePrompt: state.negativePrompt,
      selectedCameraAngle: state.selectedCameraAngle,
      selectedCameraLens: state.selectedCameraLens,
      styleStrength: state.styleStrength,
      seed: state.seed,
      creativeDirection: normalizedCreativeDirection,
      analysisMode: state.analysisMode,
      imageSize: state.imageSize,
      selectedModel: state.selectedModel,
    })
    saveGenerateParams({
      mainPrompt: finalPrompt,
      negativePrompt: state.negativePrompt,
      aspectRatio: state.aspectRatio,
      selectedStylePreset: state.selectedStylePreset,
      selectedCameraAngle: state.selectedCameraAngle,
      selectedCameraLens: state.selectedCameraLens,
      styleStrength: state.styleStrength,
      imageSize: state.imageSize,
      selectedModel: state.selectedModel,
      generationMode: state.analysisMode,
      creativeDirection: normalizedCreativeDirection,
    })

    const prompt = buildFinalImagePrompt({
      basePrompt: finalPrompt,
      selectedStylePreset: state.selectedStylePreset,
      selectedCameraAngle: state.selectedCameraAngle,
      selectedCameraLens: state.selectedCameraLens,
      styleStrength: state.styleStrength,
      creativeDirection: normalizedCreativeDirection,
      negativePrompt: state.negativePrompt,
    })

    try {
      const imgs = await generateImages({
        prompt,
        count: state.imageCount,
        aspectRatio: state.aspectRatio,
        seed: state.seed,
        referenceImage: state.referenceImage?.file,
        referenceMode: state.referenceImage?.mode,
        model: state.selectedModel,
        imageSize: state.imageSize,
        imageQuality,
      })
      if (imgs?.length) {
        let historySaveFailed = false
        for (const img of imgs) {
          const m = await getImageMetadata(img.url)
          const saved = await saveToHistory(finalPrompt, state.aspectRatio, [img.url], {
            style: state.selectedStylePreset,
            dimensions: m.dimensions,
            fileSize: m.fileSize,
            creativeDirection: normalizedCreativeDirection,
          })
          if (!saved) historySaveFailed = true
        }
        if (historySaveFailed) {
          toast.error('Image generated, but saving to history failed')
        }
      }
    } catch (e) {
      console.error('[v0] Generation error:', e)
    }
  }, [state, combinedPrompt, generateImages, saveParameters, saveGenerateParams, saveToHistory])

  // Queued generation: callers that just applied state changes (e.g. a
  // suggestion patch) request a generate; the effect runs it on the next
  // render so generateNow sees the flushed state instead of a stale closure.
  const [generateQueued, setGenerateQueued] = useState(false)
  const requestGenerate = useCallback(() => setGenerateQueued(true), [])
  useEffect(() => {
    if (!generateQueued) return
    setGenerateQueued(false)
    void generateNow()
  }, [generateQueued, generateNow])

  const downloadImage = useCallback(async (url: string, index: number, prompt?: string) => {
    const filename = prompt
      ? `${prompt.substring(0, 50).replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.png`
      : `generated-${index + 1}-${Date.now()}.png`
    try {
      await downloadImageAsFile(url, filename)
      toast.success('Image downloaded')
    } catch (error) {
      console.error('[v0] Download failed:', error)
      toast.error('Download failed')
    }
  }, [])

  const removeBackground = useCallback(async (index: number) => {
    const img = state.generatedImages[index]
    if (!img?.url) return
    if (!photoRoomBgRemovalEnabled) {
      toast.info('PhotoRoom BG is turned off')
      return
    }
    try {
      const response = await fetch(img.url)
      const blob = await response.blob()
      const file = new File([blob], 'image.png', { type: 'image/png' })
      const formData = new FormData()
      formData.append('image', file)
      formData.append('bgRemovalMethod', 'photoroom')
      const result = await fetch('/api/remove-background', { method: 'POST', body: formData })
      const data = await result.json()
      if (!data.success || !data.image) throw new Error(data.error || 'Failed to remove background')
      const updatedImages = [...state.generatedImages]
      updatedImages[index] = { ...updatedImages[index], url: data.image }
      state.setGeneratedImages(updatedImages)
      toast.success('Background removed')
    } catch (error) {
      console.error('[v0] Background removal error:', error)
      toast.error('Background removal failed')
    }
  }, [state.generatedImages, state.setGeneratedImages, photoRoomBgRemovalEnabled])

  const upscaleToFourK = useCallback(async (index: number) => {
    const original = state.generatedImages[index]
    if (!original) return
    try {
      toast.loading('Upscaling to 4K…', { id: `upscale-${index}` })
      const upscaledUrl = await upscaleImage(original.url, '4K')
      const next = [...state.generatedImages]
      next[index] = { ...original, url: upscaledUrl }
      state.setGeneratedImages(next)
      toast.success('Upscaled to 4K', { id: `upscale-${index}` })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upscale failed'
      toast.error(msg, { id: `upscale-${index}` })
    }
  }, [state.generatedImages, state.setGeneratedImages, upscaleImage])

  const value = useMemo<ImageGenerationEngine>(() => ({
    isGenerating,
    error,
    generateNow,
    requestGenerate,
    clearImages,
    downloadImage,
    removeBackground,
    upscaleToFourK,
    getImageMetadata,
    photoRoomBgRemovalEnabled,
    setPhotoRoomBgRemovalEnabled,
  }), [
    isGenerating, error, generateNow, requestGenerate, clearImages, downloadImage,
    removeBackground, upscaleToFourK, photoRoomBgRemovalEnabled, setPhotoRoomBgRemovalEnabled,
  ])

  return (
    <ImageGenerationContext.Provider value={value}>
      {children}
    </ImageGenerationContext.Provider>
  )
}

export function useImageGenerationEngine(): ImageGenerationEngine {
  const engine = useContext(ImageGenerationContext)
  if (engine === null) {
    throw new Error('useImageGenerationEngine must be used within <ImageGenerationProvider>')
  }
  return engine
}
