"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Upload, Wand2, Loader2 } from 'lucide-react'
import { TooltipProvider } from "@/components/ui/tooltip"
import { AnalysisModeSelector } from './AnalysisModeSelector'
import { ToolbarHintBar } from './ToolbarHintBar'
import { AspectRatioPopover, StylePopover, CreativeDirectionPopover, AdvancedSettingsPopover } from './Toolbar'
import type { CreativeDirectionState } from '../constants/creative-direction-options'

interface ToolbarProps {
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
  onStylePresetChange: (style: string) => void
  stylePopoverOpen: boolean
  onStylePopoverOpenChange: (open: boolean) => void
  stylePresets: Array<{ value: string; label: string; thumbnail: string; description: string }>
  creativeDirection: CreativeDirectionState
  onCreativeDirectionChange: (creativeDirection: CreativeDirectionState) => void
  onGenerate: () => void
  isGenerating?: boolean
  selectedCameraAngle: string
  onCameraAngleChange: (angle: string) => void
  selectedCameraLens: string
  onCameraLensChange: (lens: string) => void
  styleStrength: 'subtle' | 'moderate' | 'strong'
  onStyleStrengthChange: (strength: 'subtle' | 'moderate' | 'strong') => void
}

export function ImageStudioToolbar({
  showUploadSection, onToggleUpload, analysisMode, onAnalysisModeChange,
  imageCount, onImageCountChange, aspectRatio, onAspectRatioChange,
  ratiosPopoverOpen, onRatiosPopoverOpenChange, selectedStylePreset, onStylePresetChange,
  stylePopoverOpen, onStylePopoverOpenChange, stylePresets, creativeDirection, onCreativeDirectionChange, onGenerate, isGenerating = false,
  selectedCameraAngle, onCameraAngleChange, selectedCameraLens, onCameraLensChange,
  styleStrength, onStyleStrengthChange,
}: ToolbarProps) {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)

  return (
    <>
      <ToolbarHintBar hoveredButton={hoveredButton} onHoverChange={setHoveredButton} />

      <TooltipProvider>
        <div className="flex gap-2 mb-3 p-1 bg-zinc-900 rounded-lg border border-zinc-800 flex-wrap">
          {/* Upload Button */}
          <Button
            onClick={onToggleUpload}
            className={`px-6 py-3 font-medium flex items-center gap-2 ${
              showUploadSection
                ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                : 'bg-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload
          </Button>

          <div className="w-px bg-zinc-700 mx-2" />

          <AnalysisModeSelector mode={analysisMode} onChange={onAnalysisModeChange} />

          <div className="w-px bg-zinc-700 mx-2" />

          {/* Image Count */}
          <div className="flex items-center gap-2 px-4">
            <span className="text-xs text-zinc-400 whitespace-nowrap">Images:</span>
            <div className="flex gap-1">
              {[1, 2].map(count => (
                <button
                  key={count}
                  onClick={() => onImageCountChange(count)}
                  className={`w-8 h-8 rounded-md text-sm font-bold transition-colors ${
                    imageCount === count
                      ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px bg-zinc-700 mx-2" />

          <AspectRatioPopover
            aspectRatio={aspectRatio}
            onAspectRatioChange={onAspectRatioChange}
            open={ratiosPopoverOpen}
            onOpenChange={onRatiosPopoverOpenChange}
          />

          <div className="w-px bg-zinc-700 mx-2" />

          <StylePopover
            selectedStyle={selectedStylePreset}
            onStyleChange={onStylePresetChange}
            stylePresets={stylePresets}
            open={stylePopoverOpen}
            onOpenChange={onStylePopoverOpenChange}
            onHover={(h) => setHoveredButton(h ? 'style' : null)}
          />

          <div className="w-px bg-zinc-700 mx-2" />

          <CreativeDirectionPopover
            creativeDirection={creativeDirection}
            onCreativeDirectionChange={onCreativeDirectionChange}
            onHover={(h) => setHoveredButton(h ? 'creative' : null)}
          />

          <div className="w-px bg-zinc-700 mx-2" />

          {/* Generate Button */}
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            className={`px-6 py-3 font-medium flex items-center gap-2 bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850] transition-all ${
              isGenerating ? 'animate-pulse cursor-not-allowed opacity-80' : ''
            }`}
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
            ) : (
              <><Wand2 className="w-4 h-4" />Generate</>
            )}
          </Button>

          <div className="w-px bg-zinc-700 mx-2" />

          <AdvancedSettingsPopover
            selectedCameraAngle={selectedCameraAngle}
            onCameraAngleChange={onCameraAngleChange}
            selectedCameraLens={selectedCameraLens}
            onCameraLensChange={onCameraLensChange}
            styleStrength={styleStrength}
            onStyleStrengthChange={onStyleStrengthChange}
            onHover={(h) => setHoveredButton(h ? 'advanced' : null)}
          />
        </div>
      </TooltipProvider>
    </>
  )
}
