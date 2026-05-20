"use client"

import { useRef } from "react"
import { Card } from "@/components/ui/card"
import { Sparkles, ImageIcon } from 'lucide-react'
import { MockupPhotoGenerator } from './components/Logo/MockupPreview/MockupPhotoGenerator'
import { ProductMockupsPanel } from './components/Logo/MockupPreview/ProductMockupsPanel'
import { ImageStudioHeader } from './components/ImageStudioHeader'
import { ImageLightbox } from './components/ImageLightbox'
import { LogoPanel } from './components/LogoPanel'
import { BackgroundRemoverPanel } from './components/BackgroundRemover'
import { AIHelperSidebar } from './components/AIHelperSidebar'
import { FavoritesModal } from './components/SimpleFavorites'
import { ParameterHistoryPanel } from './components/ParameterHistoryPanel'
import { SettingsPanel } from './components/Settings'
import { GenerateTab } from './components/PageTabs'
import { usePageState } from './hooks/usePageState'

export default function ImageStudioPage() {
  const generatePanelRef = useRef<{ triggerGenerate: () => void; isGenerating: boolean }>(null)

  const {
    uploadState, analyzing, favorites, toggleFavorite, isFavorite, clearAll, state, hasStoredParams,
    settings, updateSetting, resetSettings, saveGenerateParams, presets, savePreset, deletePreset,
    updatePreset, clearAllPresets, handleRestoreParameters, handleResetAll, openLightbox, closeLightbox,
    navigateLightbox, handleDownloadFromLightbox, handleClearSubjectAnalysis, handleClearSceneAnalysis,
    handleClearStyleAnalysis, handleApplyAISuggestions, handleApplyLogoConfig, handleLoadPreset,
    saveParameters, showPhotoGenerator, setShowPhotoGenerator, stylePresets,
  } = usePageState()

  const handleGenerate = () => {
    if (generatePanelRef.current?.triggerGenerate) {
      generatePanelRef.current.triggerGenerate()
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-950 via-black to-zinc-950">
      <ImageStudioHeader
        activeTab={state.activeTab}
        onTabChange={state.setActiveTab}
        favoritesCount={favorites.length}
        hasStoredParams={hasStoredParams}
        onShowHistory={() => state.setShowParameterHistory(true)}
        onRestoreParameters={handleRestoreParameters}
        onShowFavorites={() => state.setShowFavorites(true)}
      />

      <main className="max-w-7xl mx-auto px-6 pt-3 pb-2">
        {state.activeTab === 'generate' && (
          <GenerateTab
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
            onGenerate={handleGenerate}
            isGenerating={generatePanelRef.current?.isGenerating || false}
            selectedCameraAngle={state.selectedCameraAngle}
            onCameraAngleChange={state.setSelectedCameraAngle}
            selectedCameraLens={state.selectedCameraLens}
            onCameraLensChange={state.setSelectedCameraLens}
            styleStrength={state.styleStrength}
            onStyleStrengthChange={state.setStyleStrength}
            uploadState={uploadState}
            onResetAll={handleResetAll}
            analyzing={analyzing}
            generatePanelRef={generatePanelRef}
            subjectImages={uploadState.subjectImages}
            analysisResults={state.analysisResults}
            onClearSubjectAnalysis={handleClearSubjectAnalysis}
            onClearSceneAnalysis={handleClearSceneAnalysis}
            onClearStyleAnalysis={handleClearStyleAnalysis}
            negativePrompt={state.negativePrompt}
            setNegativePrompt={state.setNegativePrompt}
            referenceImage={state.referenceImage}
            setReferenceImage={state.setReferenceImage}
            mainPrompt={state.mainPrompt}
            setMainPrompt={state.setMainPrompt}
            isFavorite={isFavorite}
            toggleFavorite={toggleFavorite}
            onParametersSave={(params) => saveParameters({ ...params, analysisMode: state.analysisMode, seed: state.seed, imageSize: state.imageSize, selectedModel: state.selectedModel })}
            generatedImages={state.generatedImages}
            setGeneratedImages={state.setGeneratedImages}
            onOpenLightbox={openLightbox}
            seed={state.seed}
            setSeed={state.setSeed}
            imageSize={state.imageSize}
            setImageSize={state.setImageSize}
            selectedModel={state.selectedModel}
            setSelectedModel={state.setSelectedModel}
            showAdvancedOptions={settings.features.showAdvancedOptions}
            onSaveGenerateParams={saveGenerateParams}
            presets={presets}
            onSavePreset={savePreset}
            onLoadPreset={handleLoadPreset}
            onRestoreParameters={handleRestoreParameters}
          />
        )}

        {state.activeTab === 'logo' && (
          <LogoPanel
            externalPrompt={state.mainPrompt}
            externalNegativePrompt={state.negativePrompt}
            pendingLogoConfig={state.pendingLogoConfig}
            onClearPendingConfig={() => state.setPendingLogoConfig(null)}
          />
        )}

        <Card
          className={`bg-zinc-900/90 border border-zinc-800 overflow-hidden ${state.activeTab !== 'mockups' ? 'hidden' : ''}`}
          style={{ height: 'calc(100vh - 120px)' }}
        >
          <ProductMockupsPanel />
        </Card>

        <div className={state.activeTab !== 'bg-remover' ? 'hidden' : ''}>
          <BackgroundRemoverPanel />
        </div>

        {state.activeTab === 'settings' && (
          <SettingsPanel
            settings={settings}
            onUpdateSetting={updateSetting}
            onResetSettings={resetSettings}
            onBack={() => state.setActiveTab('generate')}
            presets={presets}
            onLoadPreset={handleLoadPreset}
            onDeletePreset={deletePreset}
            onUpdatePreset={updatePreset}
            onClearAllPresets={clearAllPresets}
          />
        )}
      </main>

      {state.activeTab === 'logo' && (
        <button
          onClick={() => setShowPhotoGenerator(true)}
          className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-linear-to-br from-purple-600 via-purple-500 to-pink-500 hover:from-purple-500 hover:via-pink-500 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40 group"
          title="Generate Product Photos for Mockups"
        >
          <ImageIcon className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        </button>
      )}

      {!state.showAIHelper && (
        <button
          onClick={() => state.setShowAIHelper(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-linear-to-br from-[#FFD700] via-[#FFA500] to-[#FFD700] hover:from-[#FFED4E] hover:via-[#FFD700] hover:to-[#FFA500] shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40 group"
          title="AI Prompt Helper"
        >
          <Sparkles className="w-6 h-6 text-black group-hover:scale-110 transition-transform" />
        </button>
      )}

      <AIHelperSidebar
        isOpen={state.showAIHelper}
        onClose={() => state.setShowAIHelper(false)}
        currentPromptSettings={{
          currentPrompt: state.mainPrompt,
          currentNegativePrompt: state.negativePrompt,
          currentStyle: state.selectedStylePreset,
          currentCameraAngle: state.selectedCameraAngle,
          currentCameraLens: state.selectedCameraLens,
          currentAspectRatio: state.aspectRatio,
          styleStrength: state.styleStrength,
          creativeDirection: state.creativeDirection,
        }}
        onApplySuggestions={handleApplyAISuggestions}
        onApplyLogoConfig={handleApplyLogoConfig}
      />

      {state.showFavorites && (
        <FavoritesModal
          favorites={favorites}
          onClose={() => state.setShowFavorites(false)}
          onRemove={toggleFavorite}
          onClearAll={clearAll}
          onRestoreParameters={handleRestoreParameters}
        />
      )}

      {state.showParameterHistory && (
        <ParameterHistoryPanel
          isOpen={state.showParameterHistory}
          onClose={() => state.setShowParameterHistory(false)}
          onRestoreParameters={handleRestoreParameters}
        />
      )}

      <ImageLightbox
        isOpen={state.lightboxOpen}
        images={state.generatedImages}
        currentIndex={state.lightboxIndex}
        onClose={closeLightbox}
        onNavigate={navigateLightbox}
        onDownload={handleDownloadFromLightbox}
      />

      {showPhotoGenerator && (
        <MockupPhotoGenerator onClose={() => setShowPhotoGenerator(false)} />
      )}
    </div>
  )
}
