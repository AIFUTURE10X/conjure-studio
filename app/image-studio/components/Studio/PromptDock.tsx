"use client"

/**
 * PromptDock
 *
 * Prompt entry dock at the bottom of the canvas: main prompt, optional
 * negative prompt, image count, and the Generate button — all bound to
 * studio context + the v2 generation engine.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Minus, Sparkles, Wand2 } from 'lucide-react'
import { useStudioCore, useStudioMode } from '../../context/useStudio'
import { useImageGenerationEngine } from '../../context/ImageGenerationProvider'
import { useLogoGenerationEngine } from '../../context/LogoGenerationProvider'
import { useHelperBridge } from '../../context/HelperBridgeProvider'

export function PromptDock() {
  const { state } = useStudioCore()
  const { mode } = useStudioMode()
  const imageEngine = useImageGenerationEngine()
  const logoEngine = useLogoGenerationEngine()
  const { improveWithHelper } = useHelperBridge()
  const [showNegative, setShowNegative] = useState(false)

  const isLogoMode = mode === 'logo'
  const isGenerating = isLogoMode ? logoEngine.isGenerating : imageEngine.isGenerating
  const generate = isLogoMode ? logoEngine.requestGenerate : imageEngine.requestGenerate
  const hasPrompt = state.mainPrompt.trim().length > 0

  return (
    <div className="border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-sm p-3 space-y-2">
      <Textarea
        value={state.mainPrompt}
        onChange={(e) => state.setMainPrompt(e.target.value)}
        placeholder={isLogoMode ? 'Describe the logo you want to generate…' : 'Describe the image you want to generate…'}
        className="min-h-[64px] max-h-40 bg-zinc-950 border-zinc-700 text-sm text-zinc-100 placeholder:text-zinc-500 resize-y"
      />

      {showNegative && (
        <Textarea
          value={state.negativePrompt}
          onChange={(e) => state.setNegativePrompt(e.target.value)}
          placeholder="Negative prompt — things to avoid…"
          className="min-h-[40px] max-h-28 bg-zinc-950 border-zinc-800 text-xs text-zinc-300 placeholder:text-zinc-600 resize-y"
        />
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNegative(!showNegative)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
              showNegative || state.negativePrompt
                ? 'text-[#dbb56e] bg-[#c99850]/10'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Minus className="w-3 h-3" />
            Negative
          </button>

          {!isLogoMode && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-zinc-500">Images:</span>
              {[1, 2].map(count => (
                <button
                  key={count}
                  onClick={() => state.setImageCount(count)}
                  className={`w-7 h-7 rounded-md text-xs font-bold transition-colors ${
                    state.imageCount === count
                      ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => improveWithHelper(state.mainPrompt)}
            disabled={!hasPrompt || isGenerating}
            title="Send this idea to the AI helper to craft a polished prompt"
            className="flex items-center gap-1.5 rounded-md border border-[#c99850]/40 bg-[#c99850]/10 px-3 py-1.5 text-xs font-medium text-[#f0d49b] transition-colors hover:bg-[#c99850]/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Improve with AI</span>
          </button>

          <Button
            onClick={generate}
            disabled={isGenerating}
            className={`px-6 font-medium bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black hover:from-[#dbb56e] hover:to-[#c99850] ${
              isGenerating ? 'animate-pulse cursor-not-allowed opacity-80' : ''
            }`}
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating…</>
            ) : (
              <><Wand2 className="w-4 h-4 mr-2" />Generate</>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
