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
import { useLogoGenerationEngine } from '../../context/LogoGenerationProvider'
import type { ImageSettingsPatch, LogoSettingsSuggestionPatch } from '../../context/suggestion-patch'

export function HelperPanel() {
  const { handleApplyAISuggestions, state } = useStudioCore()
  const { setMode } = useStudioMode()
  const { setPendingSuggestion } = usePendingSuggestion()
  const { requestGenerate } = useImageGenerationEngine()
  const logoEngine = useLogoGenerationEngine()
  const { currentPromptSettings, latestOutputs } = useStudioSnapshot({
    latestLogoOutput: logoEngine.latestLogoOutput,
  })

  const controller = useAIHelperChatController({
    currentPromptSettings,
    latestOutputs,
    onApplySuggestions: handleApplyAISuggestions,
    // Logo applies route through the lifted state: prompt/negative go to the
    // shared prompt (one-way sync into logo state), settings to the engine.
    onApplyLogoSuggestions: (suggestions) => {
      if (!suggestions) return
      if (typeof suggestions.prompt === 'string') state.setMainPrompt(suggestions.prompt)
      if (typeof suggestions.negativePrompt === 'string') state.setNegativePrompt(suggestions.negativePrompt)
      logoEngine.applyLogoSettingsPatch(suggestions)
      setMode('logo')
    },
    onApplyLogoConfig: (config) => {
      state.setPendingLogoConfig(config)
      setMode('logo')
    },
    onGenerateFromAIHelper: (generateMode, options) => {
      if (generateMode === 'image') {
        if (options?.imageCount) state.setImageCount(options.imageCount)
        setMode('image')
        requestGenerate()
        return
      }
      setMode('logo')
      logoEngine.requestGenerate()
    },
  })

  const { messages, mode, clearHistory } = controller

  // Auto-preview: the newest assistant suggestion flows into the settings
  // rail as a pending patch (amber ring + diff chips). Logo suggestions get
  // the cross-mode "Switch to Logo & preview" affordance in the banner.
  const lastPreviewedIndexRef = useRef(-1)
  useEffect(() => {
    for (let index = messages.length - 1; index >= 0; index--) {
      const message = messages[index]
      if (message.role !== 'assistant' || !message.suggestions) continue
      if (index === lastPreviewedIndexRef.current) return
      lastPreviewedIndexRef.current = index

      const s = message.suggestions
      const messageMode = message.mode === 'logo' ? 'logo' : 'image'

      if (messageMode === 'image') {
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

      const logoPatch: LogoSettingsSuggestionPatch = {
        ...(typeof s.prompt === 'string' ? { prompt: s.prompt } : {}),
        ...(typeof s.negativePrompt === 'string' ? { negativePrompt: s.negativePrompt } : {}),
        ...(typeof s.textMode === 'string' ? { textMode: s.textMode } : {}),
        ...(typeof s.bgRemovalMethod === 'string' ? { bgRemovalMethod: s.bgRemovalMethod } : {}),
        ...(typeof s.selectedModel === 'string' ? { selectedModel: s.selectedModel } : {}),
        ...(typeof s.resolution === 'string' ? { resolution: s.resolution } : {}),
        ...(typeof s.aspectRatio === 'string' ? { aspectRatio: s.aspectRatio } : {}),
        ...(typeof s.logoType === 'string' ? { logoType: s.logoType } : {}),
        ...(typeof s.logoVisualStyle === 'string' ? { logoVisualStyle: s.logoVisualStyle } : {}),
        ...(typeof s.logoRenderTreatment === 'string' ? { logoRenderTreatment: s.logoRenderTreatment } : {}),
        ...(typeof s.logoTypographyDirection === 'string' ? { logoTypographyDirection: s.logoTypographyDirection } : {}),
      }
      if (Object.keys(logoPatch).length === 0) return
      setPendingSuggestion({
        id: `helper-msg-${index}`,
        sourceMessageId: String(index),
        mode: 'logo',
        patch: { mode: 'logo', logo: logoPatch },
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
