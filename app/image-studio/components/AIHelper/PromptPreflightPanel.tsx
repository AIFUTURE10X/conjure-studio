'use client'

import { AlertTriangle, CheckCircle2, Send, Wand2 } from 'lucide-react'
import type { AIHelperMode } from '../../hooks/useAIHelper'
import type { CreativeDirectionState } from '../../constants/creative-direction-options'

interface PromptPreflightPanelProps {
  mode: AIHelperMode
  currentPromptSettings?: {
    currentPrompt?: string
    currentNegativePrompt?: string
    currentStyle?: string
    currentAspectRatio?: string
    creativeDirection?: CreativeDirectionState
  }
  uploadedImages: string[]
  onAskHelper: (prompt: string) => void
  onRunFix?: (prompt: string) => void
}

interface PromptPreflightIssue {
  label: string
  detail: string
  fixPrompt: string
}

const hasText = (value?: string) => Boolean(value && value.trim())

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term))
}

export function getPromptPreflightIssues({ mode, currentPromptSettings = {}, uploadedImages }: Omit<PromptPreflightPanelProps, 'onAskHelper'>): PromptPreflightIssue[] {
  const prompt = currentPromptSettings.currentPrompt?.toLowerCase() || ''
  const negativePrompt = currentPromptSettings.currentNegativePrompt?.toLowerCase() || ''
  const issues: PromptPreflightIssue[] = []

  if (hasText(currentPromptSettings.currentPrompt) && !includesAny(prompt, ['background', 'transparent', 'white', 'black', 'plain', 'scene', 'backdrop'])) {
    issues.push({
      label: 'Background unclear',
      detail: 'Prompt does not clearly say what background to use or avoid.',
      fixPrompt: 'Tighten my prompt with an explicit background requirement and add contradictions to the negative prompt.',
    })
  }

  if (mode === 'logo' && includesAny(prompt, ['text', 'wordmark', 'lettering', 'brand name', 'logo']) && !includesAny(prompt, ['exact text', 'exact spelling', 'symbol-only', 'text overlay'])) {
    issues.push({
      label: 'Exact text risk',
      detail: 'Logo text may drift unless exact-text handling is spelled out.',
      fixPrompt: 'Revise this logo prompt for exact text handling, preserving spelling and recommending symbol-only plus text overlay when needed.',
    })
  }

  if (uploadedImages.length > 0 && !includesAny(prompt, ['reference', 'match', 'same style', 'uploaded image', 'similar to'])) {
    issues.push({
      label: 'Reference not mentioned',
      detail: 'A reference image is loaded, but the prompt does not explicitly tell the model to match it.',
      fixPrompt: 'Rewrite my prompt to explicitly match the uploaded reference image while preserving my requested changes.',
    })
  }

  if (!hasText(currentPromptSettings.currentNegativePrompt) || negativePrompt.length < 40) {
    issues.push({
      label: 'Negative prompt weak',
      detail: 'Negative prompt is empty or too light to block common failures.',
      fixPrompt: 'Create a stronger negative prompt for this generation, blocking wrong background, wrong text, misspellings, artifacts, clutter, and style drift.',
    })
  }

  return issues.slice(0, 4)
}

export function PromptPreflightPanel(props: PromptPreflightPanelProps) {
  const issues = getPromptPreflightIssues(props)
  const hasPrompt = hasText(props.currentPromptSettings?.currentPrompt)

  if (!hasPrompt && props.uploadedImages.length === 0) return null

  return (
    <div className="border-b border-[#c99850]/20 bg-zinc-950/40 px-4 py-3 sm:px-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          {issues.length > 0 ? (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          )}
          Prompt Preflight
        </span>
        <span className="text-xs font-medium text-zinc-500">{issues.length > 0 ? `${issues.length} to review` : 'Looks ready'}</span>
      </div>

      {issues.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {issues.map((issue) => (
            <div
              key={issue.label}
              className="group rounded-md border border-amber-500/20 bg-amber-500/5 p-2 text-left transition-colors hover:border-amber-400/40 hover:bg-amber-500/10"
              title={issue.detail}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-amber-200">{issue.label}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#f0d49b] opacity-80 group-hover:opacity-100">
                  <Wand2 className="h-3 w-3" />
                  Fix with helper
                </span>
              </div>
              <p className="line-clamp-2 text-xs leading-5 text-zinc-400">{issue.detail}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => props.onAskHelper(issue.fixPrompt)}
                  className="inline-flex h-7 items-center gap-1.5 rounded border border-[#c99850]/30 px-2 text-[11px] font-semibold text-[#f0d49b] transition-colors hover:bg-zinc-800"
                >
                  <Wand2 className="h-3 w-3" />
                  Edit ask
                </button>
                {props.onRunFix && (
                  <button
                    type="button"
                    onClick={() => props.onRunFix?.(issue.fixPrompt)}
                    className="inline-flex h-7 items-center gap-1.5 rounded border border-amber-400/30 px-2 text-[11px] font-semibold text-amber-100 transition-colors hover:bg-amber-500/10"
                    title="Run now"
                    aria-label={`Run now: ${issue.label}`}
                  >
                    <Send className="h-3 w-3" />
                    Run now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs font-medium text-emerald-200">
          Prompt has clear enough context to iterate.
        </div>
      )}
    </div>
  )
}
