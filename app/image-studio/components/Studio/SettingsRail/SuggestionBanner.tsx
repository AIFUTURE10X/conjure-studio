"use client"

/**
 * SuggestionBanner
 *
 * Shows the pending AI helper suggestion at the top of the settings rail:
 * "N suggested changes — Apply | Apply & Generate | Dismiss". The diff
 * preview itself renders per-field via SettingField chips. Cross-mode logo
 * suggestions get a "Switch to Logo & preview" affordance instead of a
 * silent tab jump.
 */

import { Button } from '@/components/ui/button'
import { Sparkles, X } from 'lucide-react'
import { useStudioCore, useStudioMode, usePendingSuggestion } from '../../../context/useStudio'
import { useImageGenerationEngine } from '../../../context/ImageGenerationProvider'
import { useLogoGenerationEngine } from '../../../context/LogoGenerationProvider'

export function SuggestionBanner() {
  const { pendingSuggestion, clearPendingSuggestion } = usePendingSuggestion()
  const { handleApplyAISuggestions, state } = useStudioCore()
  const { mode, setMode } = useStudioMode()
  const imageEngine = useImageGenerationEngine()
  const logoEngine = useLogoGenerationEngine()

  if (!pendingSuggestion) return null

  const isLogoPatch = pendingSuggestion.patch.mode === 'logo'
  const patchFields = pendingSuggestion.patch.mode === 'logo'
    ? pendingSuggestion.patch.logo
    : pendingSuggestion.patch.image
  const changeCount = Object.keys(patchFields).length
  if (changeCount === 0) return null

  const applyPatch = () => {
    if (pendingSuggestion.patch.mode === 'image') {
      handleApplyAISuggestions(pendingSuggestion.patch.image)
      setMode('image')
    } else {
      const { prompt, negativePrompt, ...settings } = pendingSuggestion.patch.logo
      if (prompt !== undefined) state.setMainPrompt(prompt)
      if (negativePrompt !== undefined) state.setNegativePrompt(negativePrompt)
      logoEngine.applyLogoSettingsPatch(settings)
      setMode('logo')
    }
    clearPendingSuggestion()
  }

  const applyAndGenerate = () => {
    const requestGenerate = isLogoPatch ? logoEngine.requestGenerate : imageEngine.requestGenerate
    applyPatch()
    requestGenerate()
  }

  const showSwitchAffordance = isLogoPatch && mode !== 'logo'

  return (
    <div className="m-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-amber-300">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs font-medium">
            {changeCount} suggested change{changeCount !== 1 ? 's' : ''}
            <span className="ml-1 opacity-70">· {isLogoPatch ? 'Logo' : 'Image'}</span>
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

      {showSwitchAffordance && (
        <button
          onClick={() => setMode('logo')}
          className="w-full rounded-md border border-amber-500/40 bg-amber-500/5 px-2 py-1.5 text-left text-[11px] text-amber-200/90 hover:bg-amber-500/15 transition-colors"
        >
          This suggestion targets the logo generator — switch to Logo &amp; preview
        </button>
      )}

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
          onClick={applyAndGenerate}
          className="h-7 px-3 text-xs bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850]"
        >
          Apply &amp; Generate
        </Button>
      </div>
    </div>
  )
}
