'use client'

import { Brain, FileText, ImageIcon, Layers, MonitorCheck, Sparkles, X } from 'lucide-react'
import type { AIHelperLatestOutput, AIHelperMemorySnapshot, AIHelperMode } from '../../hooks/useAIHelper'
import type { CreativeDirectionState } from '../../constants/creative-direction-options'

interface ContextSnapshotProps {
  mode: AIHelperMode
  currentPromptSettings?: {
    activeTab?: string
    currentPrompt?: string
    currentNegativePrompt?: string
    currentStyle?: string
    currentCameraAngle?: string
    currentCameraLens?: string
    currentAspectRatio?: string
    styleStrength?: string
    selectedModel?: string
    imageSize?: string
    imageCount?: number
    seed?: number | null
    analysisMode?: string
    hasReferenceImage?: boolean
    referenceImageMode?: string
    promptMode?: string
    creativeDirection?: CreativeDirectionState
  }
  uploadedImages: string[]
  preferenceCount?: number
  preferenceMemory?: AIHelperMemorySnapshot[]
  activeDesignBrief?: string
  onForgetPreference?: (timestamp: number) => void
  latestOutputs?: {
    image?: AIHelperLatestOutput | null
    logo?: AIHelperLatestOutput | null
  }
}

const hasPromptText = (value?: string) => Boolean(value && value.trim())

const formatModelLabel = (model?: string) => {
  if (!model) return 'No model'
  if (model === 'gpt-image-2') return 'Model: ChatGPT Images 2.0'
  if (model === 'gemini-3-pro-image-preview') return 'Model: Gemini 3 Pro'
  if (model === 'gemini-3.1-flash-image-preview') return 'Model: Gemini 3.1 Flash'
  return `Model: ${model}`
}

function ContextChip({ icon: Icon, label, active }: { icon: typeof FileText; label: string; active: boolean }) {
  return (
    <span
      className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium ${
        active
          ? 'border-[#c99850]/40 bg-[#c99850]/10 text-[#f0d49b]'
          : 'border-zinc-700 bg-zinc-800/70 text-zinc-500'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

export function ContextSnapshot({
  mode,
  currentPromptSettings = {},
  uploadedImages,
  preferenceCount = 0,
  preferenceMemory = [],
  activeDesignBrief,
  onForgetPreference,
  latestOutputs = {},
}: ContextSnapshotProps) {
  const latestOutput = mode === 'logo' ? latestOutputs.logo : latestOutputs.image
  const hasPrompt = hasPromptText(currentPromptSettings.currentPrompt)
  const hasNegativePrompt = hasPromptText(currentPromptSettings.currentNegativePrompt)
  const hasStyle = hasPromptText(currentPromptSettings.currentStyle)
  const hasReferenceImage = uploadedImages.length > 0
  const hasGeneratorReferenceImage = Boolean(currentPromptSettings.hasReferenceImage)
  const hasLatestOutput = Boolean(latestOutput?.url)
  const hasActiveDesignBrief = hasPromptText(activeDesignBrief)

  return (
    <div className="border-b border-[#c99850]/20 bg-zinc-950/50 px-4 py-3 sm:px-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Current Context</span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400">
          <Sparkles className="h-3.5 w-3.5 text-[#c99850]" />
          Mode: {mode === 'logo' ? 'Logo' : 'Image'}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <ContextChip icon={FileText} label={hasPrompt ? 'Prompt loaded' : 'No prompt'} active={hasPrompt} />
        <ContextChip icon={Layers} label={hasNegativePrompt ? 'Negative prompt' : 'No negative prompt'} active={hasNegativePrompt} />
        <ContextChip icon={MonitorCheck} label={hasStyle ? currentPromptSettings.currentStyle || 'Style set' : 'No style'} active={hasStyle} />
        <ContextChip icon={MonitorCheck} label={formatModelLabel(currentPromptSettings.selectedModel)} active={Boolean(currentPromptSettings.selectedModel)} />
        <ContextChip icon={MonitorCheck} label={currentPromptSettings.imageSize ? `Resolution: ${currentPromptSettings.imageSize}` : 'No resolution'} active={Boolean(currentPromptSettings.imageSize)} />
        <ContextChip icon={Layers} label={currentPromptSettings.imageCount ? `Count: ${currentPromptSettings.imageCount}` : 'No count'} active={Boolean(currentPromptSettings.imageCount)} />
        <ContextChip icon={ImageIcon} label={hasReferenceImage ? `Reference image x${uploadedImages.length}` : 'No reference image'} active={hasReferenceImage} />
        <ContextChip icon={ImageIcon} label={hasGeneratorReferenceImage ? `Generator ref: ${currentPromptSettings.referenceImageMode || 'loaded'}` : 'No generator ref'} active={hasGeneratorReferenceImage} />
        <ContextChip icon={Sparkles} label={hasLatestOutput ? 'Latest output' : 'No latest output'} active={hasLatestOutput} />
        <ContextChip icon={Brain} label={hasActiveDesignBrief ? 'Active brief' : 'No active brief'} active={hasActiveDesignBrief} />
        <ContextChip icon={Brain} label={preferenceCount > 0 ? `Preference memory x${preferenceCount}` : 'No preference memory'} active={preferenceCount > 0} />
      </div>
      {preferenceMemory.length > 0 && (
        <div className="mt-3 border-t border-zinc-800 pt-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Saved Preferences</div>
          <div className="flex flex-wrap gap-2">
            {preferenceMemory.map((preference) => (
              <span
                key={preference.timestamp}
                className="inline-flex min-h-8 max-w-full items-center gap-2 rounded-md border border-[#c99850]/30 bg-[#c99850]/10 px-2.5 py-1 text-xs font-medium text-[#f0d49b]"
                title={preference.preference || 'Saved preference'}
              >
                <Brain className="h-3.5 w-3.5 shrink-0" />
                <span className="max-w-[360px] truncate">{preference.preference}</span>
                <button
                  type="button"
                  onClick={() => onForgetPreference?.(preference.timestamp)}
                  className="rounded p-0.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                  title="Forget preference"
                  aria-label="Forget preference"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
