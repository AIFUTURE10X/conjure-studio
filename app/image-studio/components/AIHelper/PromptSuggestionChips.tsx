'use client'

import { Lightbulb, MessageSquarePlus } from 'lucide-react'
import type { AIHelperLatestOutput, AIHelperMode } from '../../hooks/useAIHelper'
import type { CreativeDirectionState } from '../../constants/creative-direction-options'

interface PromptSuggestionChipsProps {
  mode: AIHelperMode
  currentPromptSettings?: {
    currentPrompt?: string
    currentNegativePrompt?: string
    currentStyle?: string
    currentAspectRatio?: string
    creativeDirection?: CreativeDirectionState
  }
  uploadedImages: string[]
  latestOutputs?: {
    image?: AIHelperLatestOutput | null
    logo?: AIHelperLatestOutput | null
  }
  onSelectPrompt: (prompt: string) => void
}

interface PromptSuggestionChip {
  label: string
  prompt: string
}

const hasText = (value?: string) => Boolean(value && value.trim())

export function getPromptSuggestionChips({
  mode,
  currentPromptSettings = {},
  uploadedImages,
  latestOutputs = {},
}: Omit<PromptSuggestionChipsProps, 'onSelectPrompt'>): PromptSuggestionChip[] {
  const latestOutput = mode === 'logo' ? latestOutputs.logo : latestOutputs.image
  const hasPrompt = hasText(currentPromptSettings.currentPrompt)
  const hasReferenceImage = uploadedImages.length > 0
  const hasLatestOutput = Boolean(latestOutput?.url)

  const chips: PromptSuggestionChip[] = []

  if (hasPrompt) {
    chips.push({
      label: 'Improve this prompt',
      prompt: mode === 'logo'
        ? 'Improve this logo prompt while preserving my exact text, background request, colors, and reference style.'
        : 'Improve this image prompt while preserving my exact subject, background request, style, and constraints.',
    })
  }

  if (hasReferenceImage) {
    chips.push({
      label: 'Match the reference',
      prompt: mode === 'logo'
        ? 'Analyze the uploaded reference and create a logo prompt that matches its typography, spacing, palette, background, and overall composition as closely as possible.'
        : 'Analyze the uploaded reference and create an image prompt that matches its subject, style, composition, palette, lighting, and background as closely as possible.',
    })
  }

  if (hasLatestOutput) {
    chips.push({
      label: 'Critique latest output',
      prompt: mode === 'logo'
        ? 'Critique the latest logo output against my prompt and reference. Identify what missed, then give me a corrected prompt.'
        : 'Critique the latest image output against my prompt and reference. Identify what missed, then give me a corrected prompt.',
    })
  }

  if (mode === 'logo') {
    chips.push({
      label: 'Make exact text logo',
      prompt: 'Create a clean logo prompt with exact text handling. If exact spelling is important, recommend a symbol-only generation plus exact text overlay workflow.',
    })
  } else {
    chips.push({
      label: 'Create 3 options',
      prompt: 'Turn this into a strong image prompt and prepare it for three varied options with the same core subject and constraints.',
    })
  }

  chips.push({
    label: mode === 'logo' ? 'Make premium variation' : 'Make stronger variation',
    prompt: mode === 'logo'
      ? 'Make a premium variation that keeps the strongest idea but improves typography, spacing, color discipline, and production readiness.'
      : 'Make a stronger variation that keeps the core idea but improves composition, lighting, style clarity, and prompt precision.',
  })

  return chips.slice(0, 5)
}

export function PromptSuggestionChips(props: PromptSuggestionChipsProps) {
  const chips = getPromptSuggestionChips(props)
  if (chips.length === 0) return null

  return (
    <div className="border-b border-[#c99850]/20 bg-zinc-900/70 px-4 py-3 sm:px-5">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 text-xs font-semibold text-zinc-400">
          <Lightbulb className="h-3.5 w-3.5 text-[#c99850]" />
          Next
        </span>
        {chips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => props.onSelectPrompt(chip.prompt)}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-[#c99850]/30 bg-zinc-800 px-2.5 text-xs font-semibold text-zinc-100 transition-colors hover:border-[#c99850]/60 hover:bg-zinc-700"
            title={chip.prompt}
          >
            <MessageSquarePlus className="h-3.5 w-3.5 text-[#c99850]" />
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  )
}
