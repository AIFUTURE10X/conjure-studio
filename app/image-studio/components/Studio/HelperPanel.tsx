"use client"

/**
 * HelperPanel
 *
 * Left workspace panel hosting the AI helper chat. Builds the helper
 * snapshot from studio context, routes apply/generate callbacks through the
 * shared handlers, and auto-previews the newest image suggestion in the
 * settings rail via the pending-suggestion context.
 */

import { useEffect, useRef } from 'react'
import { Sparkles, Trash2 } from 'lucide-react'
import { AIHelperChat } from '../AIHelper/AIHelperChat'
import { useAIHelperChatController } from '../AIHelper/useAIHelperChatController'
import { useStudioCore, useStudioMode, usePendingSuggestion } from '../../context/useStudio'
import { useStudioSnapshot } from '../../context/useStudioSnapshot'
import { useImageGenerationEngine } from '../../context/ImageGenerationProvider'
import type { ImageSettingsPatch } from '../../context/suggestion-patch'

export function HelperPanel() {
  const { handleApplyAISuggestions, handleApplyLogoSuggestions, handleApplyLogoConfig, state } = useStudioCore()
  const { setMode } = useStudioMode()
  const { setPendingSuggestion } = usePendingSuggestion()
  const { requestGenerate } = useImageGenerationEngine()
  const { currentPromptSettings, latestOutputs } = useStudioSnapshot()

  const controller = useAIHelperChatController({
    currentPromptSettings,
    latestOutputs,
    onApplySuggestions: handleApplyAISuggestions,
    onApplyLogoSuggestions: handleApplyLogoSuggestions,
    onApplyLogoConfig: handleApplyLogoConfig,
    onGenerateFromAIHelper: (generateMode, options) => {
      if (generateMode === 'image') {
        if (options?.imageCount) state.setImageCount(options.imageCount)
        setMode('image')
        requestGenerate()
        return
      }
      // Logo generation joins the workspace with logo mode (step 7).
      setMode('logo')
    },
  })

  const { messages, mode, clearHistory } = controller

  // Auto-preview: the newest assistant image suggestion flows into the
  // settings rail as a pending patch (amber ring + diff chips).
  const lastPreviewedIndexRef = useRef(-1)
  useEffect(() => {
    for (let index = messages.length - 1; index >= 0; index--) {
      const message = messages[index]
      if (message.role !== 'assistant' || !message.suggestions) continue
      if (index === lastPreviewedIndexRef.current) return
      const messageMode = message.mode === 'logo' ? 'logo' : 'image'
      if (messageMode !== 'image') return
      lastPreviewedIndexRef.current = index

      const s = message.suggestions
      const patch: ImageSettingsPatch = {
        ...(typeof s.prompt === 'string' ? { prompt: s.prompt } : {}),
        ...(typeof s.negativePrompt === 'string' ? { negativePrompt: s.negativePrompt } : {}),
        ...(typeof s.style === 'string' ? { style: s.style } : {}),
        ...(typeof s.aspectRatio === 'string' ? { aspectRatio: s.aspectRatio } : {}),
        ...(typeof s.cameraAngle === 'string' ? { cameraAngle: s.cameraAngle } : {}),
        ...(typeof s.cameraLens === 'string' ? { cameraLens: s.cameraLens } : {}),
        ...(typeof s.styleStrength === 'string' ? { styleStrength: s.styleStrength } : {}),
        ...(typeof s.resolution === 'string' ? { resolution: s.resolution } : {}),
        ...(typeof s.selectedModel === 'string' ? { selectedModel: s.selectedModel } : {}),
        ...(typeof s.bgRemovalMethod === 'string' ? { bgRemovalMethod: s.bgRemovalMethod } : {}),
      }
      if (Object.keys(patch).length === 0) return

      setPendingSuggestion({
        id: `helper-msg-${index}`,
        sourceMessageId: String(index),
        mode: 'image',
        patch: { mode: 'image', image: patch },
      })
      return
    }
  }, [messages, setPendingSuggestion])

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-r border-zinc-800">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-[#dbb56e] shrink-0" />
          <span className="text-sm font-medium text-zinc-200">AI Helper</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5">
            {mode}
          </span>
        </div>
        <button
          onClick={() => void clearHistory()}
          className="text-zinc-500 hover:text-zinc-200 transition-colors"
          title="Clear chat history"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <AIHelperChat controller={controller} className="flex min-h-0 flex-1 flex-col bg-zinc-950" />
    </div>
  )
}
