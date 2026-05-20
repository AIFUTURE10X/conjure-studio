"use client"

/**
 * Generate tab content for Image Studio page
 */

import { RefObject } from 'react'
import { Card } from '@/components/ui/card'
import { UploadPanel } from '../UploadPanel'
import { ImageStudioToolbar } from '../ImageStudioToolbar'
import { GeneratePanel } from '../GeneratePanel'
import type { UploadedImage, AnalysisResult } from '../../types'
import type { GeneratePreset, SavedGenerateParams } from '../../constants/settings-defaults'
import type { CreativeDirectionState } from '../../constants/creative-direction-options'

interface GenerateTabProps {
  // Toolbar props
  showUploadSection: boolean
  onToggleUpload: () => void
  analysisMode: 'fast' | 'quality'
  onAnalysisModeChange: (mode: 'fast' | 'quality') => void
  imageCount: number
  onImageCountChange: (count: number) => void
  aspectRatio: string
  onAspectRatioChange: (ratio: string) => void
  ratiosPopoverOpen: boolean
  onRatiosPopoverOpenChange: (open: boolean) => void
  selectedStylePreset: string
  onStylePresetChange: (preset: string) => void
  stylePopoverOpen: boolean
  onStylePopoverOpenChange: (open: boolean) => void
  stylePresets: Array<{ name: string; icon: any; description: string }>
  creativeDirection: CreativeDirectionState
  onCreativeDirectionChange: (creativeDirection: CreativeDirectionState) => void
  onGenerate: () => void
  isGenerating: boolean
  selectedCameraAngle: string
  onCameraAngleChange: (angle: string) => void
  selectedCameraLens: string
  onCameraLensChange: (lens: string) => void
  styleStrength: 'subtle' | 'moderate' | 'strong'
  onStyleStrengthChange: (strength: 'subtle' | 'moderate' | 'strong') => void

  // Upload panel props
  uploadState: any
  onResetAll: () => void

  // Analyzing state
  analyzing: boolean

  // Generate panel props
  generatePanelRef: RefObject<{ triggerGenerate: () => void; isGenerating: boolean } | null>
  subjectImages: UploadedImage[]
  analysisResults: { subjects: any[]; scene: any | null; style: any | null }
  onClearSubjectAnalysis: () => void
  onClearSceneAnalysis: () => void
  onClearStyleAnalysis: () => void
  negativePrompt: string
  setNegativePrompt: (prompt: string) => void
  referenceImage: any
  setReferenceImage: (image: any) => void
  mainPrompt: string
  setMainPrompt: (prompt: string) => void
  isFavorite: (url: string) => boolean
  toggleFavorite: (url: string, metadata: any) => void
  onParametersSave: (params: any) => void
  generatedImages: Array<{ url: string; prompt?: string; timestamp?: number }>
  setGeneratedImages: (images: Array<{ url: string; prompt?: string; timestamp?: number }>) => void
  onOpenLightbox: (index: number) => void
  seed: number | null
  setSeed: (seed: number | null) => void
  imageSize: '1K' | '2K' | '4K'
  setImageSize: (size: '1K' | '2K' | '4K') => void
  selectedModel: string
  setSelectedModel: (model: any) => void
  showAdvancedOptions: boolean
  onSaveGenerateParams: (params: any) => void
  presets: GeneratePreset[]
  onSavePreset: (name: string, params: SavedGenerateParams) => void
  onLoadPreset: (preset: GeneratePreset) => void
  onRestoreParameters: (params: any) => void
}

export function GenerateTab(props: GenerateTabProps) {
  const {
    showUploadSection, onToggleUpload, analysisMode, onAnalysisModeChange, imageCount, onImageCountChange,
    aspectRatio, onAspectRatioChange, ratiosPopoverOpen, onRatiosPopoverOpenChange, selectedStylePreset,
    onStylePresetChange, stylePopoverOpen, onStylePopoverOpenChange, stylePresets, creativeDirection,
    onCreativeDirectionChange, onGenerate, isGenerating,
    selectedCameraAngle, onCameraAngleChange, selectedCameraLens, onCameraLensChange, styleStrength,
    onStyleStrengthChange, uploadState, onResetAll, analyzing, generatePanelRef, subjectImages, analysisResults,
    onClearSubjectAnalysis, onClearSceneAnalysis, onClearStyleAnalysis, negativePrompt, setNegativePrompt,
    referenceImage, setReferenceImage, mainPrompt, setMainPrompt, isFavorite, toggleFavorite, onParametersSave,
    generatedImages, setGeneratedImages, onOpenLightbox, seed, setSeed, imageSize, setImageSize, selectedModel,
    setSelectedModel, showAdvancedOptions, onSaveGenerateParams, presets, onSavePreset, onLoadPreset,
    onRestoreParameters,
  } = props

  return (
    <>
      <ImageStudioToolbar
        showUploadSection={showUploadSection}
        onToggleUpload={onToggleUpload}
        analysisMode={analysisMode}
        onAnalysisModeChange={onAnalysisModeChange}
        imageCount={imageCount}
        onImageCountChange={onImageCountChange}
        aspectRatio={aspectRatio}
        onAspectRatioChange={onAspectRatioChange}
        ratiosPopoverOpen={ratiosPopoverOpen}
        onRatiosPopoverOpenChange={onRatiosPopoverOpenChange}
        selectedStylePreset={selectedStylePreset}
        onStylePresetChange={onStylePresetChange}
        stylePopoverOpen={stylePopoverOpen}
        onStylePopoverOpenChange={onStylePopoverOpenChange}
        stylePresets={stylePresets}
        creativeDirection={creativeDirection}
        onCreativeDirectionChange={onCreativeDirectionChange}
        onGenerate={onGenerate}
        isGenerating={isGenerating}
        selectedCameraAngle={selectedCameraAngle}
        onCameraAngleChange={onCameraAngleChange}
        selectedCameraLens={selectedCameraLens}
        onCameraLensChange={onCameraLensChange}
        styleStrength={styleStrength}
        onStyleStrengthChange={onStyleStrengthChange}
      />

      {showUploadSection && (
        <div className="mb-8">
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
            onClearAll={onResetAll}
          />
        </div>
      )}

      {analyzing && (
        <Card className="bg-zinc-900 border-zinc-800 p-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-[#c99850] border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-300">Analyzing uploaded images...</p>
          </div>
        </Card>
      )}

      <div id="generate-section">
        <GeneratePanel
          ref={generatePanelRef}
          subjectImages={subjectImages}
          sceneAnalysis={analysisResults.scene}
          styleAnalysis={analysisResults.style}
          analysisResults={analysisResults}
          onClearSubjectAnalysis={onClearSubjectAnalysis}
          onClearSceneAnalysis={onClearSceneAnalysis}
          onClearStyleAnalysis={onClearStyleAnalysis}
          aspectRatio={aspectRatio}
          setAspectRatio={onAspectRatioChange}
          selectedStylePreset={selectedStylePreset}
          setSelectedStylePreset={onStylePresetChange}
          imageCount={imageCount}
          setImageCount={onImageCountChange}
          selectedCameraAngle={selectedCameraAngle}
          selectedCameraLens={selectedCameraLens}
          styleStrength={styleStrength}
          negativePrompt={negativePrompt}
          setNegativePrompt={setNegativePrompt}
          referenceImage={referenceImage}
          setReferenceImage={setReferenceImage}
          mainPrompt={mainPrompt}
          setMainPrompt={setMainPrompt}
          isFavorite={isFavorite}
          toggleFavorite={toggleFavorite}
          onParametersSave={onParametersSave}
          onClearPrompt={() => setMainPrompt('')}
          onRestoreParameters={onRestoreParameters}
          generatedImages={generatedImages}
          imageSize={imageSize}
          setImageSize={setImageSize}
          selectedModel={selectedModel as any}
          setSelectedModel={setSelectedModel}
          generationMode={analysisMode}
          creativeDirection={creativeDirection}
          setGeneratedImages={setGeneratedImages}
          onOpenLightbox={onOpenLightbox}
          seed={seed}
          setSeed={setSeed}
          showAdvancedOptions={showAdvancedOptions}
          onSaveGenerateParams={onSaveGenerateParams}
          presets={presets}
          onSavePreset={onSavePreset}
          onLoadPreset={onLoadPreset}
        />
      </div>
    </>
  )
}
