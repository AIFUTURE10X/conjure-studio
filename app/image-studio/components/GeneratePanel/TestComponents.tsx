"use client"

/**
 * TEST FILE - Remove after testing
 *
 * This file demonstrates and tests the new GeneratePanel sub-components.
 * Import this in page.tsx temporarily to verify components work correctly.
 *
 * Usage in page.tsx:
 * import { TestGeneratePanelComponents } from './components/GeneratePanel/TestComponents'
 *
 * Then add <TestGeneratePanelComponents /> somewhere in your JSX
 */

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { AnalysisCard } from './AnalysisCard'
import { CombinedPromptCard } from './CombinedPromptCard'
import { ModelSelector, type GenerationModel, type ImageSize } from './ModelSelector'
import { ReferenceImageUpload, type ReferenceImage } from './ReferenceImageUpload'
import { PromptInputs } from './PromptInputs'

export function TestGeneratePanelComponents() {
  // State for testing each component
  const [subjectAnalysis, setSubjectAnalysis] = useState('A cute orange cat sitting on a windowsill, looking outside at birds.')
  const [sceneAnalysis, setSceneAnalysis] = useState('Cozy living room with warm afternoon sunlight streaming through the window.')
  const [styleAnalysis, setStyleAnalysis] = useState('Soft watercolor style with gentle brush strokes and pastel colors.')

  const [combinedPrompt, setCombinedPrompt] = useState('A cute orange cat sitting on a windowsill in a cozy living room, soft watercolor style.')

  const [selectedModel, setSelectedModel] = useState<GenerationModel>('gpt-image-2')
  const [imageSize, setImageSize] = useState<ImageSize>('1K')

  const [referenceImage, setReferenceImage] = useState<ReferenceImage | null>(null)

  const [mainPrompt, setMainPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')

  return (
    <Card className="bg-zinc-900 border-[#c99850]/30 p-6 space-y-6">
      <div className="border-b border-[#c99850]/30 pb-4">
        <h2 className="text-xl font-bold text-[#c99850]">🧪 Component Test Panel</h2>
        <p className="text-xs text-white/60 mt-1">Testing new GeneratePanel sub-components</p>
      </div>

      {/* Analysis Cards Test */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3">1. Analysis Cards</h3>
        <div className="grid grid-cols-3 gap-4">
          <AnalysisCard
            title="Subject"
            description="Main subject analysis"
            analysisText={subjectAnalysis}
            onClear={() => setSubjectAnalysis('')}
            onTextChange={setSubjectAnalysis}
          />
          <AnalysisCard
            title="Scene"
            description="Environment analysis"
            analysisText={sceneAnalysis}
            onClear={() => setSceneAnalysis('')}
            onTextChange={setSceneAnalysis}
          />
          <AnalysisCard
            title="Style"
            description="Artistic style"
            analysisText={styleAnalysis}
            onClear={() => setStyleAnalysis('')}
            onTextChange={setStyleAnalysis}
          />
        </div>
      </div>

      {/* Combined Prompt Card Test */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3">2. Combined Prompt Card</h3>
        <div className="max-w-md">
          <CombinedPromptCard
            combinedPrompt={combinedPrompt}
            hasPrompt={combinedPrompt.length > 0}
            onClear={() => setCombinedPrompt('')}
            onPromptChange={setCombinedPrompt}
          />
        </div>
      </div>

      {/* Model Selector Test */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3">3. Model & Resolution Selector</h3>
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          imageSize={imageSize}
          onImageSizeChange={setImageSize}
        />
        <p className="text-xs text-white/50 mt-2">
          Selected: {selectedModel} @ {imageSize}
        </p>
      </div>

      {/* Reference Image Upload Test */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3">4. Reference Image Upload</h3>
        <div className="max-w-md">
          <ReferenceImageUpload
            referenceImage={referenceImage}
            onImageChange={setReferenceImage}
          />
          {referenceImage && (
            <p className="text-xs text-green-400 mt-2">
              ✓ Image uploaded: {referenceImage.file.name}
            </p>
          )}
        </div>
      </div>

      {/* Prompt Inputs Test */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3">5. Prompt Inputs</h3>
        <PromptInputs
          mainPrompt={mainPrompt}
          negativePrompt={negativePrompt}
          onMainPromptChange={setMainPrompt}
          onNegativePromptChange={setNegativePrompt}
        />
        <div className="text-xs text-white/50 mt-2 space-y-1">
          <p>Main: {mainPrompt || '(empty)'}</p>
          <p>Negative: {negativePrompt || '(empty)'}</p>
        </div>
      </div>

      {/* Status Summary */}
      <div className="border-t border-[#c99850]/30 pt-4">
        <h3 className="text-sm font-bold text-green-400 mb-2">✓ All Components Loaded</h3>
        <p className="text-xs text-white/60">
          If you can see all 5 sections above with working interactions, the components are ready for integration.
        </p>
      </div>
    </Card>
  )
}
