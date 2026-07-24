"use client"

/**
 * ResultsCanvas
 *
 * Scrollable center canvas for image mode: optional upload section,
 * analyzing indicator, generated-image grid (reusing GeneratedImageCard),
 * empty state, and generation errors.
 */

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ImageIcon } from 'lucide-react'
import { UploadPanel } from '../UploadPanel'
import { NextStepNudge } from '../Concierge'
import { GeneratedImageCard } from '../GeneratedImageCard'
import { ImageEditModal } from '../ImageEditor'
import { useStudioCore, useStudioMode, useStudioReset } from '../../context/useStudio'
import { useImageGenerationEngine } from '../../context/ImageGenerationProvider'
import { useEditChat } from '../../context/EditChatProvider'
import { normalizeCreativeDirection } from '../../constants/creative-direction-options'
import { ANNOTATION_REFERENCE_PROMPT_NOTE, dataUrlToImageFile, imageUrlToImageFile } from '../../utils/annotation-reference'

export function ResultsCanvas() {
  const {
    uploadState, analyzing, state, isFavorite, toggleFavorite,
    handleResetAll, handleRestoreParameters, openLightbox,
  } = useStudioCore()
  const {
    isGenerating, error, clearImages, downloadImage, removeBackground,
    upscaleToFourK, getImageMetadata, applyEditedImage, generateVariation,
    setImageBgRemovalMethod,
  } = useImageGenerationEngine()
  const { startEditChat } = useEditChat()
  const { setMode } = useStudioMode()
  const { registerReset } = useStudioReset()

  // Reset the Image tab to defaults. handleResetAll clears the prompt,
  // negative prompt, settings, analysis results, and the generated-image grid
  // (via setGeneratedImages([]) — note clearImages() is a no-op for the grid
  // here because the studio wires an *appending* onImagesUpdate; we only use
  // it to clear the error banner). We add what handleResetAll leaves untouched:
  // uploads, the reference image (revoking its blob URL), analysis mode, and
  // the background-removal method.
  const handleResetImageTab = useCallback(() => {
    handleResetAll()
    uploadState.clearAllImages()
    const refPreview = state.referenceImage?.preview
    if (typeof refPreview === 'string' && refPreview.startsWith('blob:')) {
      URL.revokeObjectURL(refPreview)
    }
    state.setReferenceImage(null)
    state.setAnalysisMode('fast')
    setImageBgRemovalMethod('fal')
    clearImages()
  }, [
    handleResetAll, uploadState.clearAllImages, state.referenceImage,
    state.setReferenceImage, state.setAnalysisMode, setImageBgRemovalMethod, clearImages,
  ])

  useEffect(() => registerReset('image', handleResetImageTab), [registerReset, handleResetImageTab])

  const handleAnimate = (index: number) => {
    const url = state.generatedImages[index]?.url
    if (!url) return
    state.setVideoStartFrame(url)
    if (state.videoEndFrame === url) state.setVideoEndFrame(null)
    setMode('video')
  }

  const handleSetEndFrame = (index: number) => {
    const url = state.generatedImages[index]?.url
    if (!url) return
    state.setVideoEndFrame(url)
    if (state.videoStartFrame) {
      toast.success('End frame set — start/end pair ready in the Video tab')
    } else {
      toast.success('End frame set — now press "Animate" on your starting image')
    }
  }

  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const { generatedImages } = state
  const creativeDirection = normalizeCreativeDirection(state.creativeDirection)
  const cardParameters = (prompt?: string) => ({
    mainPrompt: prompt,
    aspectRatio: state.aspectRatio,
    selectedStylePreset: state.selectedStylePreset,
    imageCount: state.imageCount,
    negativePrompt: state.negativePrompt,
    selectedCameraAngle: state.selectedCameraAngle,
    selectedCameraLens: state.selectedCameraLens,
    styleStrength: state.styleStrength,
    creativeDirection,
  })

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {state.showUploadSection && (
        <UploadPanel
          subjectImages={uploadState.subjectImages}
          sceneImage={uploadState.sceneImage}
          styleImage={uploadState.styleImage}
          isDragging={uploadState.isDragging}
          setIsDragging={uploadState.setIsDragging}
          addSubjectImages={uploadState.addSubjectImages}
          setSceneImageFile={uploadState.setSceneImageFile}
          setStyleImageFile={uploadState.setStyleImageFile}
          removeSubjectImage={uploadState.removeSubjectImage}
          toggleSubjectSelection={uploadState.toggleSubjectSelection}
          clearSceneImage={uploadState.clearSceneImage}
          clearStyleImage={uploadState.clearStyleImage}
          clearAllImages={uploadState.clearAllImages}
          onClearAll={handleResetAll}
        />
      )}

      {analyzing && (
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-[#c99850] border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-300">Analyzing uploaded images...</p>
          </div>
        </Card>
      )}

      {generatedImages.length === 0 && !analyzing && (
        <div className="h-full min-h-[40vh] flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-zinc-600" />
          </div>
          <p className="text-sm text-zinc-400">
            {isGenerating ? 'Generating…' : 'Generated images appear here'}
          </p>
          <p className="text-xs text-zinc-600 max-w-xs leading-5">
            Write a prompt below, tune settings in the right rail, or ask the
            AI helper for a starting point.
          </p>
        </div>
      )}

      {generatedImages.length > 0 && (
        <Card className="bg-zinc-900 border-[#c99850]/30 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Generated Images ({generatedImages.length})</h3>
            <Button
              onClick={() => { clearImages(); state.setMainPrompt('') }}
              variant="ghost"
              size="sm"
              className="bg-zinc-800 text-[#c99850]"
              disabled={isGenerating}
            >
              Clear All
            </Button>
          </div>
          <div className="mb-4">
            <NextStepNudge nudgeKey="image-to-video">
              Any image here can become a video: <span className="font-semibold text-[#dbb56e]">Animate</span> makes
              it the start frame, <span className="font-semibold text-[#dbb56e]">End Frame</span> makes it where the
              clip lands — set both and the video morphs between them.
            </NextStepNudge>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {generatedImages.map((img, i) => (
              <GeneratedImageCard
                key={i}
                imageUrl={img.url}
                imagePrompt={img.prompt}
                imageTimestamp={img.timestamp}
                index={i}
                aspectRatio={state.aspectRatio}
                selectedStylePreset={state.selectedStylePreset}
                parameters={cardParameters(img.prompt)}
                isFavorite={isFavorite(img.url)}
                onToggleFavorite={async () => {
                  const m = await getImageMetadata(img.url)
                  toggleFavorite(img.url, {
                    ratio: state.aspectRatio,
                    style: state.selectedStylePreset,
                    ...m,
                    params: cardParameters(img.prompt),
                  })
                }}
                onDownload={() => downloadImage(img.url, i, img.prompt)}
                onOpenLightbox={() => openLightbox(i)}
                onRestoreParameters={handleRestoreParameters}
                onRemoveBackground={removeBackground}
                onUpscale={upscaleToFourK}
                onEdit={() => setEditingIndex(i)}
                onEditInChat={() => startEditChat(i, img.url)}
                onSetEndFrame={handleSetEndFrame}
                onAnimate={handleAnimate}
                onMoreLikeThis={generateVariation}
                onSaveAnnotated={async (index, dataUrl, instruction, maskDataUrl) => {
                  const timestamp = Date.now()
                  const source = generatedImages[index]
                  state.setGeneratedImages(current => {
                    const currentSource = current[index] || source
                    return [
                      ...current,
                      {
                        url: dataUrl,
                        prompt: `${currentSource?.prompt || 'Image'} annotated`,
                        timestamp,
                      },
                    ]
                  })
                  const sourceUrl = source?.url || dataUrl
                  const [file, maskFile] = await Promise.all([
                    imageUrlToImageFile(sourceUrl, `conjure-source-${timestamp}.png`),
                    maskDataUrl ? dataUrlToImageFile(maskDataUrl, `conjure-edit-mask-${timestamp}.png`) : Promise.resolve(undefined),
                  ])
                  state.setReferenceImage({
                    file,
                    preview: sourceUrl,
                    mode: 'inspire',
                    source: 'annotation',
                    instruction,
                    maskFile,
                    annotatedPreview: dataUrl,
                  })
                  if (!/annotated reference image/i.test(state.mainPrompt)) {
                    const trimmed = state.mainPrompt.trim()
                    state.setMainPrompt(
                      trimmed ? `${trimmed}\n\n${ANNOTATION_REFERENCE_PROMPT_NOTE}` : ANNOTATION_REFERENCE_PROMPT_NOTE,
                    )
                  }
                }}
              />
            ))}
          </div>
        </Card>
      )}

      {error && (
        <Card className="bg-red-900/20 border-red-900/50 p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </Card>
      )}

      {editingIndex !== null && generatedImages[editingIndex] && (
        <ImageEditModal
          imageUrl={generatedImages[editingIndex].url}
          onApply={(url, editPrompt) => applyEditedImage(editingIndex, url, editPrompt)}
          onClose={() => setEditingIndex(null)}
        />
      )}
    </div>
  )
}
