"use client"

import { useState, useRef, useMemo, forwardRef, useImperativeHandle, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sparkles, Loader2, ChevronDown } from 'lucide-react'
import { GeneratePreset, SavedGenerateParams } from '../constants/settings-defaults'
import { UploadedImage, AnalysisResult } from '../types'
import { usePromptBuilder } from '../hooks/usePromptBuilder'
import { useImageGeneration } from '../hooks/useImageGeneration'
import { GeneratedImageCard } from './GeneratedImageCard'
import { useGenerationHistory } from '../hooks/useGenerationHistory'
import { SeedControlDropdown } from './SeedControlDropdown'
import { AnalysisCard } from './GeneratePanel/AnalysisCard'
import { CombinedPromptCard } from './GeneratePanel/CombinedPromptCard'
import { ModelSelector, type GenerationModel, type ImageSize } from './GeneratePanel/ModelSelector'
import { ReferenceImageUpload, type ReferenceImage } from './GeneratePanel/ReferenceImageUpload'
import { PromptInputs } from './GeneratePanel/PromptInputs'
import { PresetControls } from './GeneratePanel/PresetControls'
import { downloadImageAsFile } from '../utils/export-utils'
import { buildFinalImagePrompt } from '../utils/build-image-prompt'
import {
  normalizeCreativeDirection,
  type CreativeDirectionState,
} from '../constants/creative-direction-options'

export type { GenerationModel, ImageSize, ReferenceImage }

export interface GeneratePanelProps {
  subjectImages: UploadedImage[]
  sceneAnalysis?: AnalysisResult | null
  styleAnalysis?: AnalysisResult | null
  analysisResults: { subjects: any[]; scene: any | null; style: any | null }
  onClearSubjectAnalysis: () => void
  onClearSceneAnalysis: () => void
  onClearStyleAnalysis: () => void
  aspectRatio: string
  setAspectRatio?: (ratio: string) => void
  selectedStylePreset: string
  setSelectedStylePreset?: (preset: string) => void
  imageCount: number
  setImageCount?: (count: number) => void
  selectedCameraAngle: string
  selectedCameraLens: string
  styleStrength: 'subtle' | 'moderate' | 'strong'
  negativePrompt: string
  setNegativePrompt: (prompt: string) => void
  referenceImage: ReferenceImage | null
  setReferenceImage: (image: ReferenceImage | null) => void
  mainPrompt: string
  setMainPrompt: (prompt: string) => void
  isFavorite: (url: string) => boolean
  toggleFavorite: (url: string, metadata: any) => void
  onParametersSave?: (params: any) => void
  onClearPrompt?: () => void
  onRestoreParameters?: (params: any) => void
  generatedImages: Array<{ url: string; prompt?: string; timestamp?: number }>
  setGeneratedImages: (images: Array<{ url: string; prompt?: string; timestamp?: number }>) => void
  onOpenLightbox: (index: number) => void
  seed?: number | null
  setSeed?: (seed: number | null) => void
  imageSize?: ImageSize
  setImageSize?: (size: ImageSize) => void
  selectedModel?: GenerationModel
  setSelectedModel?: (model: GenerationModel) => void
  useImageBgRemoval?: boolean
  onImageBgRemovalChange?: (enabled: boolean) => void
  usePhotoRoomBgRemoval?: boolean
  onPhotoRoomBgRemovalChange?: (enabled: boolean) => void
  generationMode?: 'fast' | 'quality'
  creativeDirection?: CreativeDirectionState
  showAdvancedOptions?: boolean
  onSaveGenerateParams?: (params: any) => void
  presets?: GeneratePreset[]
  onSavePreset?: (name: string, params: SavedGenerateParams) => void
  onLoadPreset?: (preset: GeneratePreset) => void
}

export const GeneratePanel = forwardRef<{ triggerGenerate: () => void; isGenerating: boolean }, GeneratePanelProps>(
  function GeneratePanel(props, ref) {
    const {
      subjectImages, analysisResults, onClearSubjectAnalysis, onClearSceneAnalysis, onClearStyleAnalysis,
      aspectRatio, selectedStylePreset, imageCount, selectedCameraAngle, selectedCameraLens, styleStrength,
      negativePrompt, setNegativePrompt, referenceImage, setReferenceImage, mainPrompt, setMainPrompt,
      isFavorite, toggleFavorite, onParametersSave, onClearPrompt, onRestoreParameters,
      generatedImages, setGeneratedImages, onOpenLightbox,
      seed: controlledSeed, setSeed: setControlledSeed,
      imageSize = '1K', setImageSize, selectedModel = 'gemini-3.1-flash-image-preview', setSelectedModel,
      useImageBgRemoval: controlledUseImageBgRemoval, onImageBgRemovalChange,
      usePhotoRoomBgRemoval: controlledUsePhotoRoomBgRemoval, onPhotoRoomBgRemovalChange,
      generationMode = 'quality', creativeDirection,
      showAdvancedOptions = true, onSaveGenerateParams, presets = [], onSavePreset, onLoadPreset,
    } = props

    const { combinedPrompt, hasPrompt } = usePromptBuilder(subjectImages, analysisResults)
    const { isGenerating, error, generateImages, clearImages, upscaleImage } = useImageGeneration(
      setGeneratedImages,
      (info) => toast.info(info.reason, { duration: 6000 }),
    )
    const { saveToHistory } = useGenerationHistory()

    const [showAdvanced, setShowAdvanced] = useState(showAdvancedOptions)
    const [localUseImageBgRemoval, setLocalUseImageBgRemoval] = useState(true)
    const [localUsePhotoRoomBgRemoval, setLocalUsePhotoRoomBgRemoval] = useState(true)
    const [seed, setSeedInternal] = useState<number | null>(controlledSeed ?? null)
    const [editedSubject, setEditedSubject] = useState('')
    const [editedScene, setEditedScene] = useState('')
    const [editedStyle, setEditedStyle] = useState('')
    const [editedCombined, setEditedCombined] = useState('')
    const generatedImagesRef = useRef<HTMLDivElement>(null)

    useEffect(() => { if (controlledSeed !== undefined) setSeedInternal(controlledSeed) }, [controlledSeed])
    useEffect(() => { if (generatedImages.length > 0) setTimeout(() => generatedImagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100) }, [generatedImages.length])

    const activeSeed = controlledSeed ?? seed
    const setSeed = setControlledSeed ?? setSeedInternal
    const useImageBgRemoval = controlledUseImageBgRemoval ?? localUseImageBgRemoval
    const setUseImageBgRemoval = onImageBgRemovalChange ?? setLocalUseImageBgRemoval
    const usePhotoRoomBgRemoval = controlledUsePhotoRoomBgRemoval ?? localUsePhotoRoomBgRemoval
    const setUsePhotoRoomBgRemoval = onPhotoRoomBgRemovalChange ?? setLocalUsePhotoRoomBgRemoval
    const photoRoomBgRemovalEnabled = useImageBgRemoval && usePhotoRoomBgRemoval
    const setPhotoRoomBgRemovalEnabled = (enabled: boolean) => {
      setUseImageBgRemoval(enabled)
      setUsePhotoRoomBgRemoval(enabled)
    }

    const subjectText = useMemo(() => editedSubject || subjectImages.filter(i => i.selected).map(i => analysisResults.subjects.find(s => s.id === i.id)?.analysis).filter(Boolean).join('\n\n'), [subjectImages, analysisResults.subjects, editedSubject])
    const sceneText = useMemo(() => editedScene || analysisResults.scene?.analysis || '', [analysisResults.scene, editedScene])
    const styleText = useMemo(() => editedStyle || analysisResults.style?.analysis || '', [analysisResults.style, editedStyle])

    const getImageMetadata = async (url: string): Promise<{ dimensions: string; fileSize: string }> => {
      return new Promise(resolve => {
        const img = new Image()
        img.onload = async () => {
          let fileSize = '~2 MB'
          try {
            if (url.startsWith('data:')) { const b64 = url.split(',')[1]; if (b64) fileSize = `~${(Math.ceil((b64.length * 3) / 4) / 1048576).toFixed(1)} MB` }
            else { const r = await fetch(url, { method: 'HEAD' }); const cl = r.headers.get('content-length'); if (cl) fileSize = `~${(parseInt(cl) / 1048576).toFixed(1)} MB` }
          } catch {}
          resolve({ dimensions: `${img.width}×${img.height}`, fileSize })
        }
        img.onerror = () => resolve({ dimensions: 'Unknown', fileSize: 'Unknown' })
        img.src = url
      })
    }

    const handleGenerate = async () => {
      const finalPrompt = mainPrompt.trim() || combinedPrompt.trim() || 'a beautiful scene'
      const imageQuality = generationMode === 'fast' ? 'low' : 'auto'
      const normalizedCreativeDirection = normalizeCreativeDirection(creativeDirection)
      onParametersSave?.({ mainPrompt: finalPrompt, aspectRatio, selectedStylePreset, imageCount, negativePrompt, selectedCameraAngle, selectedCameraLens, styleStrength, seed: activeSeed, creativeDirection: normalizedCreativeDirection })
      onSaveGenerateParams?.({ mainPrompt: finalPrompt, negativePrompt, aspectRatio, selectedStylePreset, selectedCameraAngle, selectedCameraLens, styleStrength, imageSize, selectedModel, generationMode, creativeDirection: normalizedCreativeDirection })

      const prompt = buildFinalImagePrompt({
        basePrompt: finalPrompt,
        selectedStylePreset,
        selectedCameraAngle,
        selectedCameraLens,
        styleStrength,
        creativeDirection: normalizedCreativeDirection,
        negativePrompt,
      })

      try {
        const imgs = await generateImages({ prompt, count: imageCount, aspectRatio, seed: activeSeed, referenceImage: referenceImage?.file, referenceMode: referenceImage?.mode, model: selectedModel, imageSize, imageQuality })
        if (imgs?.length) { for (const img of imgs) { const m = await getImageMetadata(img.url); await saveToHistory(finalPrompt, aspectRatio, [img.url], { style: selectedStylePreset, dimensions: m.dimensions, fileSize: m.fileSize, creativeDirection: normalizedCreativeDirection }) } }
      } catch (e) { console.error('[v0] Generation error:', e) }
    }

    const handleDownload = async (url: string, i: number, prompt?: string) => {
      const filename = prompt
        ? `${prompt.substring(0, 50).replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.png`
        : `generated-${i + 1}-${Date.now()}.png`

      try {
        await downloadImageAsFile(url, filename)
        toast.success('Image downloaded')
      } catch (error) {
        console.error('[v0] Download failed:', error)
        toast.error('Download failed')
      }
    }

    const handleRemoveBackground = async (index: number) => {
      const img = generatedImages[index]
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
        const updatedImages = [...generatedImages]
        updatedImages[index] = { ...updatedImages[index], url: data.image }
        setGeneratedImages(updatedImages)
      } catch (error) { console.error('[v0] Background removal error:', error) }
    }

    const handleUpscale = async (i: number) => {
      const original = generatedImages[i]
      if (!original) return
      try {
        toast.loading('Upscaling to 4K…', { id: `upscale-${i}` })
        const upscaledUrl = await upscaleImage(original.url, '4K')
        const next = [...generatedImages]
        next[i] = { ...original, url: upscaledUrl }
        setGeneratedImages(next)
        toast.success('Upscaled to 4K', { id: `upscale-${i}` })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Upscale failed'
        toast.error(msg, { id: `upscale-${i}` })
      }
    }

    useImperativeHandle(ref, () => ({ triggerGenerate: handleGenerate, isGenerating }), [isGenerating])

    const toggleSection = () => setShowAdvanced(!showAdvanced)
    const keyHandler = (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSection() } }

    return (
      <div className="space-y-6">
        <Card className="bg-zinc-900 border-[#c99850]/30">
          <div role="button" tabIndex={0} onClick={toggleSection} onKeyDown={keyHandler} className="w-full flex items-center justify-between p-3 hover:bg-zinc-800/50 transition-colors rounded-t-lg cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#c99850]">Analysis Cards</span>
              <Button onClick={e => { e.stopPropagation(); handleGenerate() }} size="sm" disabled={isGenerating} className={`bg-[#c99850] text-black hover:bg-[#dbb56e] ${isGenerating ? 'animate-pulse' : ''}`}>
                {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate</>}
              </Button>
            </div>
            <ChevronDown className={`w-4 h-4 text-[#c99850] transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </div>
          {showAdvanced && (
            <div className="p-4 pt-0">
              <div className="grid grid-cols-4 gap-4">
                <AnalysisCard title="Subject" description="Main subject" analysisText={subjectText} onClear={() => { setEditedSubject(''); onClearSubjectAnalysis() }} onTextChange={setEditedSubject} />
                <AnalysisCard title="Scene" description="Environment" analysisText={sceneText} onClear={() => { setEditedScene(''); onClearSceneAnalysis() }} onTextChange={setEditedScene} />
                <AnalysisCard title="Style" description="Artistic style" analysisText={styleText} onClear={() => { setEditedStyle(''); onClearStyleAnalysis() }} onTextChange={setEditedStyle} />
                <CombinedPromptCard combinedPrompt={editedCombined || combinedPrompt} hasPrompt={hasPrompt || !!editedCombined} onClear={() => { setEditedCombined(''); setMainPrompt('') }} onPromptChange={setEditedCombined} />
              </div>
            </div>
          )}
        </Card>

        <Card className="bg-zinc-900 border-[#c99850]/30">
          <div role="button" tabIndex={0} onClick={toggleSection} onKeyDown={keyHandler} className="w-full flex items-center justify-between p-3 hover:bg-zinc-800/50 transition-colors rounded-t-lg cursor-pointer">
            <span className="text-xs font-bold text-[#c99850]">Generation Controls</span>
            <ChevronDown className={`w-4 h-4 text-[#c99850] transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </div>
          {showAdvanced && (
            <div className="p-4 pt-0 space-y-4">
              <PromptInputs mainPrompt={mainPrompt} negativePrompt={negativePrompt} onMainPromptChange={setMainPrompt} onNegativePromptChange={setNegativePrompt} />
              <ModelSelector selectedModel={selectedModel} onModelChange={m => setSelectedModel?.(m)} imageSize={imageSize} onImageSizeChange={s => setImageSize?.(s)} />
              <div className="flex items-center gap-2 flex-wrap">
                <SeedControlDropdown seed={activeSeed} onSeedChange={setSeed} />
                <label className={`flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition-colors ${photoRoomBgRemovalEnabled ? 'border-[#c99850]/60 bg-[#c99850]/10 text-[#f2d39d]' : 'border-zinc-700 bg-zinc-900 text-zinc-300'}`}>
                  <input
                    type="checkbox"
                    checked={photoRoomBgRemovalEnabled}
                    onChange={(e) => setPhotoRoomBgRemovalEnabled(e.target.checked)}
                    aria-label="Turn PhotoRoom background removal on or off"
                    className="h-3.5 w-3.5 accent-[#c99850]"
                  />
                  PhotoRoom BG
                </label>
                <PresetControls
                  mainPrompt={mainPrompt}
                  negativePrompt={negativePrompt}
                  aspectRatio={aspectRatio}
                  selectedStylePreset={selectedStylePreset}
                  selectedCameraAngle={selectedCameraAngle}
                  selectedCameraLens={selectedCameraLens}
                  styleStrength={styleStrength}
                  imageSize={imageSize}
                  selectedModel={selectedModel}
                  creativeDirection={normalizeCreativeDirection(creativeDirection)}
                  presets={presets}
                  onSavePreset={onSavePreset}
                  onLoadPreset={onLoadPreset}
                  onSetMainPrompt={setMainPrompt}
                  onSetNegativePrompt={setNegativePrompt}
                />
              </div>
              <ReferenceImageUpload referenceImage={referenceImage} onImageChange={setReferenceImage} />
              {generatedImages.length > 0 && (
                <div className="flex justify-end pt-4 border-t border-zinc-800">
                  <Button onClick={() => { clearImages(); onClearPrompt?.() }} variant="ghost" size="sm" className="bg-zinc-800 text-[#c99850]" disabled={isGenerating}>Clear All</Button>
                </div>
              )}
            </div>
          )}
        </Card>

        {generatedImages.length > 0 && (
          <Card ref={generatedImagesRef} className="bg-zinc-900 border-[#c99850]/30 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Generated Images ({generatedImages.length})</h3>
            <div className="grid grid-cols-2 gap-4">
              {generatedImages.map((img, i) => (
                <GeneratedImageCard key={i} imageUrl={img.url} imagePrompt={img.prompt} imageTimestamp={img.timestamp} index={i} aspectRatio={aspectRatio} selectedStylePreset={selectedStylePreset}
                  parameters={{ mainPrompt: img.prompt, aspectRatio, selectedStylePreset, imageCount, negativePrompt, selectedCameraAngle, selectedCameraLens, styleStrength, creativeDirection: normalizeCreativeDirection(creativeDirection) }}
                  isFavorite={isFavorite(img.url)}
                  onToggleFavorite={async () => { const m = await getImageMetadata(img.url); toggleFavorite(img.url, { ratio: aspectRatio, style: selectedStylePreset, ...m, prompt: img.prompt, timestamp: img.timestamp, params: { mainPrompt: img.prompt, aspectRatio, selectedStylePreset, imageCount, negativePrompt, selectedCameraAngle, selectedCameraLens, styleStrength, creativeDirection: normalizeCreativeDirection(creativeDirection) } }) }}
                  onDownload={() => handleDownload(img.url, i, img.prompt)} onOpenLightbox={() => onOpenLightbox(i)} onRestoreParameters={onRestoreParameters}
                  onRemoveBackground={handleRemoveBackground}
                  onUpscale={handleUpscale}
                />
              ))}
            </div>
          </Card>
        )}
        {error && <Card className="bg-red-900/20 border-red-900/50 p-4"><p className="text-red-400 text-sm">{error}</p></Card>}
      </div>
    )
  }
)
