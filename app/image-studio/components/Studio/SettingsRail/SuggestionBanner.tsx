"use client"

/**
 * SuggestionBanner
 *
 * Shows the pending AI helper suggestion at the top of the settings rail:
 * "N suggested changes — Apply | Apply & Generate | Dismiss". The diff
 * preview itself renders per-field via SettingField chips. Image mode only
 * until logo mode joins the workspace.
 */

import { Button } from '@/components/ui/button'
import { Sparkles, X } from 'lucide-react'
import { useStudioCore, usePendingSuggestion } from '../../../context/useStudio'
import { useImageGenerationEngine } from '../../../context/ImageGenerationProvider'

export function SuggestionBanner() {
  const { pendingSuggestion, clearPendingSuggestion } = usePendingSuggestion()
  const { handleApplyAISuggestions } = useStudioCore()
  const { requestGenerate } = useImageGenerationEngine()

  if (!pendingSuggestion || pendingSuggestion.patch.mode !== 'image') return null

  const patch = pendingSuggestion.patch.image
  const changeCount = Object.keys(patch).length
  if (changeCount === 0) return null

  const applyPatch = () => {
    handleApplyAISuggestions(patch)
    clearPendingSuggestion()
  }

  return (
    <div className="m-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-amber-300">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs font-medium">
            {changeCount} suggested change{changeCount !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={clearPendingSuggestion}
          className="text-amber-400/60 hover:text-amber-300 transition-colors"
          title="Dismiss suggestion"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={applyPatch}
          className="h-7 px-3 text-xs bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-500/40"
        >
          Apply
        </Button>
        <Button
          size="sm"
          onClick={() => { applyPatch(); requestGenerate() }}
          className="h-7 px-3 text-xs bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850]"
        >
          Apply & Generate
        </Button>
      </div>
    </div>
  )
}
