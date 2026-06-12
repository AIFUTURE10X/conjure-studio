"use client"

/**
 * Generate tab content for Image Studio page
 *
 * Reads all settings/handlers from the studio context; the only props left
 * are the generate trigger plumbing, which the generate controller replaces
 * when the workspace shell lands.
 */

import { RefObject } from 'react'
import { Card } from '@/components/ui/card'
import { UploadPanel } from '../UploadPanel'
import { ImageStudioToolbar } from '../ImageStudioToolbar'
import { GeneratePanel } from '../GeneratePanel'
import { useStudioCore } from '../../context/useStudio'

interface GenerateTabProps {
  generatePanelRef: RefObject<{ triggerGenerate: () => void; isGenerating: boolean } | null>
  onGenerate: () => void
  isGenerating: boolean
}

export function GenerateTab({ generatePanelRef, onGenerate, isGenerating }: GenerateTabProps) {
  const {
    uploadState, analyzing, toggleFavorite, isFavorite, state, settings, saveGenerateParams,
    presets, savePreset, handleRestoreParameters, handleResetAll, openLightbox,
    handleClearSubjectAnalysis, handleClearSceneAnalysis, handleClearStyleAnalysis,
    handleLoadPreset, saveParameters, stylePresets,
  } = useStudioCore()

  return (
    <>
      <ImageStudioToolbar
        showUploadSection={state.showUploadSection}
        onToggleUpload={() => state.setShowUploadSection(!state.showUploadSection)}
        analysisMode={state.analysisMode}
        onAnalysisModeChange={state.setAnalysisMode}
        imageCount={state.imageCount}
        onImageCountChange={state.setImageCount}
        aspectRatio={state.aspectRatio}
        onAspectRatioChange={state.setAspectRatio}
        ratiosPopoverOpen={state.ratiosPopoverOpen}
        onRatiosPopoverOpenChange={state.setRatiosPopoverOpen}
        selectedStylePreset={state.selectedStylePreset}
        onStylePresetChange={state.setSelectedStylePreset}
        stylePopoverOpen={state.stylePopoverOpen}
        onStylePopoverOpenChange={state.setStylePopoverOpen}
        stylePresets={stylePresets}
        creativeDirection={state.creativeDirection}
        onCreativeDirectionChange={state.setCreativeDirection}
        onGenerate={onGenerate}
        isGenerating={isGenerating}
        selectedCameraAngle={state.selectedCameraAngle}
        onCameraAngleChange={state.setSelectedCameraAngle}
        selectedCameraLens={state.selectedCameraLens}
        onCameraLensChange={state.setSelectedCameraLens}
        styleStrength={state.styleStrength}
        onStyleStrengthChange={state.setStyleStrength}
      />

      {state.showUploadSection && (
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
            onClearAll={handleResetAll}
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
          subjectImages={uploadState.subjectImages}
          sceneAnalysis={state.analysisResults.scene}
          styleAnalysis={state.analysisResults.style}
          analysisResults={state.analysisResults}
          onClearSubjectAnalysis={handleClearSubjectAnalysis}
          onClearSceneAnalysis={handleClearSceneAnalysis}
          onClearStyleAnalysis={handleClearStyleAnalysis}
          aspectRatio={state.aspectRatio}
          setAspectRatio={state.setAspectRatio}
          selectedStylePreset={state.selectedStylePreset}
          setSelectedStylePreset={state.setSelectedStylePreset}
          imageCount={state.imageCount}
          setImageCount={state.setImageCount}
          selectedCameraAngle={state.selectedCameraAngle}
          selectedCameraLens={state.selectedCameraLens}
          styleStrength={state.styleStrength}
          negativePrompt={state.negativePrompt}
          setNegativePrompt={state.setNegativePrompt}
          referenceImage={state.referenceImage}
          setReferenceImage={state.setReferenceImage}
          mainPrompt={state.mainPrompt}
          setMainPrompt={state.setMainPrompt}
          isFavorite={isFavorite}
          toggleFavorite={toggleFavorite}
          onParametersSave={(params) => saveParameters({ ...params, analysisMode: state.analysisMode, seed: state.seed, imageSize: state.imageSize, selectedModel: state.selectedModel })}
          onClearPrompt={() => state.setMainPrompt('')}
          onRestoreParameters={handleRestoreParameters}
          generatedImages={state.generatedImages}
          imageSize={state.imageSize}
          setImageSize={state.setImageSize}
          selectedModel={state.selectedModel as any}
          setSelectedModel={state.setSelectedModel}
          useImageBgRemoval={state.useImageBgRemoval}
          onImageBgRemovalChange={state.setUseImageBgRemoval}
          usePhotoRoomBgRemoval={state.usePhotoRoomBgRemoval}
          onPhotoRoomBgRemovalChange={state.setUsePhotoRoomBgRemoval}
          generationMode={state.analysisMode}
          creativeDirection={state.creativeDirection}
          setGeneratedImages={state.setGeneratedImages}
          onOpenLightbox={openLightbox}
          seed={state.seed}
          setSeed={state.setSeed}
          showAdvancedOptions={settings.features.showAdvancedOptions}
          onSaveGenerateParams={saveGenerateParams}
          presets={presets}
          onSavePreset={savePreset}
          onLoadPreset={handleLoadPreset}
        />
      </div>
    </>
  )
}
