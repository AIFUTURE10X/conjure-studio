import { useState, useMemo, useEffect, useCallback } from 'react'
import { UploadedImage } from '../../types'
import { usePromptBuilder } from '../../hooks/usePromptBuilder'
import { useImageGeneration } from '../../hooks/useImageGeneration'
import { useGenerationHistory } from '../../hooks/useGenerationHistory'
import type { GenerationModel, ImageSize } from './ModelSelector'
import type { ReferenceImage } from './ReferenceImageUpload'

interface UseGeneratePanelLogicProps {
  subjectImages: UploadedImage[]
  analysisResults: {
    subjects: any[]
    scene: any | null
    style: any | null
  }
  aspectRatio: string
  selectedStylePreset: string
  imageCount: number
  selectedCameraAngle: string
  selectedCameraLens: string
  styleStrength: 'subtle' | 'moderate' | 'strong'
  negativePrompt: string
  mainPrompt: string
  referenceImage: ReferenceImage | null
  seed?: number | null
  setSeed?: (seed: number | null) => void
  imageSize: ImageSize
  selectedModel: GenerationModel
  setGeneratedImages: (images: Array<{ url: string; prompt?: string; timestamp?: number }>) => void
  onParametersSave?: (params: any) => void
  onClearPrompt?: () => void
}

export function useGeneratePanelLogic({
  subjectImages,
  analysisResults,
  aspectRatio,
  selectedStylePreset,
  imageCount,
  selectedCameraAngle,
  selectedCameraLens,
  styleStrength,
  negativePrompt,
  mainPrompt,
  referenceImage,
  seed: controlledSeedProp,
  setSeed: setControlledSeedProp,
  imageSize,
  selectedModel,
  setGeneratedImages,
  onParametersSave,
  onClearPrompt,
}: UseGeneratePanelLogicProps) {
  const { combinedPrompt, hasPrompt } = usePromptBuilder(subjectImages, analysisResults)
  const { isGenerating, error, generateImages, clearImages } = useImageGeneration(setGeneratedImages)
  const { saveToHistory } = useGenerationHistory()

  const [internalSeed, setInternalSeed] = useState<number | null>(controlledSeedProp ?? null)
  const [editedSubject, setEditedSubject] = useState('')
  const [editedScene, setEditedScene] = useState('')
  const [editedStyle, setEditedStyle] = useState('')
  const [editedCombined, setEditedCombined] = useState('')

  useEffect(() => {
    if (controlledSeedProp !== undefined) {
      setInternalSeed(controlledSeedProp)
    }
  }, [controlledSeedProp])

  const seed = controlledSeedProp !== undefined ? controlledSeedProp : internalSeed
  const setSeed = setControlledSeedProp ?? setInternalSeed

  // Compute analysis texts
  const subjectAnalysisText = useMemo(() => {
    if (editedSubject) return editedSubject
    const selectedSubjectIds = subjectImages.filter((img) => img.selected).map((img) => img.id)
    return analysisResults.subjects
      .filter((subj) => selectedSubjectIds.includes(subj.id) && subj.analysis?.trim())
      .map((subj) => subj.analysis)
      .join('\n\n')
  }, [subjectImages, analysisResults.subjects, editedSubject])

  const sceneAnalysisText = useMemo(() => {
    return editedScene || analysisResults.scene?.analysis || ''
  }, [analysisResults.scene, editedScene])

  const styleAnalysisText = useMemo(() => {
    return editedStyle || analysisResults.style?.analysis || ''
  }, [analysisResults.style, editedStyle])

  const getImageMetadata = useCallback(async (url: string) => {
    return new Promise<{ dimensions: string; fileSize: string }>((resolve) => {
      const img = new Image()
      img.onload = async () => {
        const dimensions = `${img.width}×${img.height}`
        let fileSize = '~2 MB'
        try {
          if (url.startsWith('data:')) {
            const base64Data = url.split(',')[1]
            if (base64Data) {
              const bytes = Math.ceil((base64Data.length * 3) / 4)
              fileSize = `~${(bytes / (1024 * 1024)).toFixed(1)} MB`
            }
          } else {
            const response = await fetch(url, { method: 'HEAD' })
            const contentLength = response.headers.get('content-length')
            if (contentLength) {
              fileSize = `~${(parseInt(contentLength, 10) / (1024 * 1024)).toFixed(1)} MB`
            }
          }
        } catch (error) {
          console.error('[v0] Failed to get file size:', error)
        }
        resolve({ dimensions, fileSize })
      }
      img.onerror = () => resolve({ dimensions: 'Unknown', fileSize: 'Unknown' })
      img.src = url
    })
  }, [])

  const handleGenerate = useCallback(async () => {
    const finalPrompt = mainPrompt.trim() || combinedPrompt.trim() || 'a beautiful scene'

    if (onParametersSave) {
      onParametersSave({
        mainPrompt: finalPrompt,
        aspectRatio,
        selectedStylePreset,
        imageCount,
        negativePrompt,
        selectedCameraAngle,
        selectedCameraLens,
        styleStrength,
        seed,
      })
    }

    let enhancedPrompt = finalPrompt
    if (selectedStylePreset !== 'Realistic') enhancedPrompt += `. Style: ${selectedStylePreset}`
    if (selectedCameraAngle) enhancedPrompt += `. Camera angle: ${selectedCameraAngle}`
    if (selectedCameraLens) enhancedPrompt += `. Camera lens: ${selectedCameraLens}`

    const strengthModifier = { subtle: 'subtle style influence', moderate: 'moderate style influence', strong: 'strong style influence' }[styleStrength]
    enhancedPrompt += `. ${strengthModifier}`

    if (negativePrompt.trim()) {
      enhancedPrompt += `\n\nIMPORTANT: Do NOT include any of these elements: ${negativePrompt.trim()}`
    }

    try {
      const newImages = await generateImages({
        prompt: enhancedPrompt,
        count: imageCount,
        aspectRatio,
        seed,
        referenceImage: referenceImage?.file,
        model: selectedModel,
        imageSize,
      })

      if (newImages && newImages.length > 0) {
        const imageUrls = newImages.map((img) => img.url)
        const metadataResults = await Promise.all(imageUrls.map((url) => getImageMetadata(url)))

        for (let i = 0; i < imageUrls.length; i++) {
          await saveToHistory(finalPrompt, aspectRatio, [imageUrls[i]], {
            style: selectedStylePreset || 'Realistic',
            dimensions: metadataResults[i].dimensions,
            fileSize: metadataResults[i].fileSize,
          })
        }
      }
    } catch (err) {
      console.error('[v0] Image generation error:', err)
    }
  }, [
    mainPrompt, combinedPrompt, aspectRatio, selectedStylePreset, imageCount,
    negativePrompt, selectedCameraAngle, selectedCameraLens, styleStrength,
    seed, referenceImage, selectedModel, imageSize, generateImages,
    getImageMetadata, saveToHistory, onParametersSave
  ])

  const handleClearAll = useCallback(() => {
    clearImages()
    if (onClearPrompt) onClearPrompt()
  }, [clearImages, onClearPrompt])

  return {
    // State
    combinedPrompt,
    hasPrompt,
    isGenerating,
    error,
    seed,
    setSeed,
    // Analysis texts
    subjectAnalysisText,
    sceneAnalysisText,
    styleAnalysisText,
    editedCombined,
    // Setters
    setEditedSubject,
    setEditedScene,
    setEditedStyle,
    setEditedCombined,
    // Actions
    handleGenerate,
    handleClearAll,
    getImageMetadata,
  }
}
