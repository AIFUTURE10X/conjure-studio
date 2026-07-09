"use client"

import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, Eraser, Grid2X2 } from 'lucide-react'
import { GOLD_GRADIENT } from '../../constants/logo-constants'
import type { BgRemovalMethod, LogoResolution } from '../../hooks/useLogoGeneration'
import type { BatchGenerationOptions } from '../../hooks/useBatchGeneration'

interface LogoGenerateSectionProps {
  // Generation state
  isGenerating: boolean
  isRemovingRefBg: boolean
  removeBackgroundOnly: boolean
  hasPrompt: boolean
  hasReferenceImage: boolean

  // Handlers
  onGenerate: () => void
  onOpenBatchGenerator: () => void

  // Error display
  error?: string | null
}

export function LogoGenerateSection({
  isGenerating,
  isRemovingRefBg,
  removeBackgroundOnly,
  hasPrompt,
  hasReferenceImage,
  onGenerate,
  onOpenBatchGenerator,
  error,
}: LogoGenerateSectionProps) {
  const isDisabled = isGenerating || isRemovingRefBg ||
    (removeBackgroundOnly ? !hasReferenceImage : (!hasPrompt && !hasReferenceImage))

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={onGenerate}
          disabled={isDisabled}
          className="flex-1 h-9 text-sm font-semibold text-black disabled:opacity-50"
          style={{ background: GOLD_GRADIENT }}
        >
          {isGenerating || isRemovingRefBg ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              {isRemovingRefBg ? 'Removing Background...' : 'Generating...'}
            </>
          ) : removeBackgroundOnly ? (
            <>
              <Eraser className="w-4 h-4 mr-1.5" />
              Remove Background
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-1.5" />
              Generate Logo
            </>
          )}
        </Button>
        {!removeBackgroundOnly && (
          <Button
            onClick={onOpenBatchGenerator}
            disabled={isGenerating || !hasPrompt}
            variant="outline"
            className="h-9 px-3 border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500 disabled:opacity-50"
            title="Generate 4 variations"
          >
            <Grid2X2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
          {error}
        </div>
      )}
    </>
  )
}
