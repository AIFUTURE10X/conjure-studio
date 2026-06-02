'use client'

import { Lightbulb, MessageSquarePlus, Send } from 'lucide-react'
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
  onRunPrompt?: (prompt: string) => void
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

  chips.push({
    label: 'How can you help?',
    prompt: mode === 'logo'
      ? 'What can you do as my AI logo helper with my current prompt, reference image, latest output, settings, and background removal options?'
      : 'What can you do as my AI image helper with my current prompt, reference image, latest output, settings, and background removal options?',
  })

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

  if (hasPrompt || hasLatestOutput) {
    chips.push({
      label: 'Change only one thing',
      prompt: mode === 'logo'
        ? 'Keep the strongest parts of the current logo and change only one thing: I will describe the single change next. Do not change the composition, exact text, typography style, icon shape, color palette, or background unless that single change requires it.'
        : 'Keep the strongest parts of the current image and change only one thing: I will describe the single change next. Do not change the composition, subject, style, color palette, lighting, or background unless that single change requires it.',
    })
    chips.push({
      label: 'Fix background',
      prompt: mode === 'logo'
        ? 'Keep the strongest parts of the current logo and fix the background only. If I asked for white, use a flat pure white #FFFFFF background. If I asked for true PNG, use transparent PNG/no background. Remove any blue, dark, gradient, textured, or scene backdrop; do not change the composition, exact text, typography, icon, or colors.'
        : 'Keep the strongest parts of the current image and fix the background only. Follow my background request exactly, especially flat pure white #FFFFFF or transparent/no background if requested. Remove any blue, dark, gradient, textured, or unwanted backdrop; do not change the composition, subject, style, or colors.',
    })
  }

  if (mode === 'logo') {
    chips.push({
      label: 'Preserve exact text',
      prompt: 'Preserve exact text, spelling, capitalization, spacing, and line breaks. If the image model may misspell it, create a symbol-only logo prompt ready for exact text overlay, and keep the generated artwork free of extra words or random letters.',
    })
  }

  if (hasReferenceImage || mode === 'logo') {
    chips.push({
      label: 'Match reference font',
      prompt: mode === 'logo'
        ? 'Match reference font style as closely as possible: letter proportions, stroke contrast, script/geometric character, spacing, capitalization, and visual rhythm. Keep the wording exact and do not change the composition unless required to match the reference.'
        : 'Match the reference typography or lettering style as closely as possible: proportions, stroke contrast, spacing, capitalization, and visual rhythm. Keep the rest of the design stable unless required to match the reference.',
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

  return chips.slice(0, 8)
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
          <span
            key={chip.label}
            className="inline-flex h-8 shrink-0 overflow-hidden rounded-md border border-[#c99850]/30 bg-zinc-800 text-xs font-semibold text-zinc-100 transition-colors hover:border-[#c99850]/60"
          >
            <button
              type="button"
              onClick={() => props.onSelectPrompt(chip.prompt)}
              className="inline-flex items-center gap-1.5 px-2.5 transition-colors hover:bg-zinc-700"
              title={chip.prompt}
            >
              <MessageSquarePlus className="h-3.5 w-3.5 text-[#c99850]" />
              {chip.label}
            </button>
            {props.onRunPrompt && (
              <button
                type="button"
                onClick={() => props.onRunPrompt?.(chip.prompt)}
                className="inline-flex items-center gap-1 border-l border-[#c99850]/20 px-2 text-[#f0d49b] transition-colors hover:bg-zinc-700"
                title="Run now"
                aria-label={`Run now: ${chip.label}`}
              >
                <Send className="h-3 w-3" />
                Run now
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
