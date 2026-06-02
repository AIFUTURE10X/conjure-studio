'use client'

import { Brain, FileText, ImageIcon, Layers, MonitorCheck, Sparkles } from 'lucide-react'
import type { AIHelperLatestOutput, AIHelperMode } from '../../hooks/useAIHelper'
import type { CreativeDirectionState } from '../../constants/creative-direction-options'

interface ContextSnapshotProps {
  mode: AIHelperMode
  currentPromptSettings?: {
    currentPrompt?: string
    currentNegativePrompt?: string
    currentStyle?: string
    currentCameraAngle?: string
    currentCameraLens?: string
    currentAspectRatio?: string
    styleStrength?: string
    promptMode?: string
    creativeDirection?: CreativeDirectionState
  }
  uploadedImages: string[]
  preferenceCount?: number
  latestOutputs?: {
    image?: AIHelperLatestOutput | null
    logo?: AIHelperLatestOutput | null
  }
}

const hasPromptText = (value?: string) => Boolean(value && value.trim())

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

export function ContextSnapshot({ mode, currentPromptSettings = {}, uploadedImages, preferenceCount = 0, latestOutputs = {} }: ContextSnapshotProps) {
  const latestOutput = mode === 'logo' ? latestOutputs.logo : latestOutputs.image
  const hasPrompt = hasPromptText(currentPromptSettings.currentPrompt)
  const hasNegativePrompt = hasPromptText(currentPromptSettings.currentNegativePrompt)
  const hasStyle = hasPromptText(currentPromptSettings.currentStyle)
  const hasReferenceImage = uploadedImages.length > 0
  const hasLatestOutput = Boolean(latestOutput?.url)

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
        <ContextChip icon={ImageIcon} label={hasReferenceImage ? `Reference image x${uploadedImages.length}` : 'No reference image'} active={hasReferenceImage} />
        <ContextChip icon={Sparkles} label={hasLatestOutput ? 'Latest output' : 'No latest output'} active={hasLatestOutput} />
        <ContextChip icon={Brain} label={preferenceCount > 0 ? `Preference memory x${preferenceCount}` : 'No preference memory'} active={preferenceCount > 0} />
      </div>
    </div>
  )
}
