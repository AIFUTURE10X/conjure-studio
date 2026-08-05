'use client'

import { RotateCcw } from 'lucide-react'
import type { AIHelperModelChoice } from '@/lib/ai-helper-models'
import type {
  AIHelperModelAvailability,
  AIHelperModelNames,
} from '../../hooks/useAIHelperModelSelection'

interface AIHelperModelSelectorProps {
  value: AIHelperModelChoice
  availability: AIHelperModelAvailability
  modelNames: AIHelperModelNames
  canRetry: boolean
  isLoading: boolean
  onChange: (choice: AIHelperModelChoice) => void
  onRetryBest: () => void
}

export function AIHelperModelSelector({
  value,
  availability,
  modelNames,
  canRetry,
  isLoading,
  onChange,
  onRetryBest,
}: AIHelperModelSelectorProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 bg-zinc-950/80 px-4 py-2 sm:px-5">
      <label className="flex min-w-0 items-center gap-2 text-xs text-zinc-400">
        <span className="shrink-0">Prompt model</span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as AIHelperModelChoice)}
          disabled={isLoading}
          aria-label="AI helper prompt model"
          className="min-w-0 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs font-medium text-zinc-100 outline-none transition-colors hover:border-[#c99850]/60 focus:border-[#c99850] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="auto">Auto · {modelNames.auto}</option>
          <option value="best">Best · {modelNames.best}</option>
          <option value="opus" disabled={!availability.opus}>
            Opus 5 · {availability.opus ? modelNames.opus : 'API key required'}
          </option>
        </select>
      </label>

      {canRetry && value === 'auto' && (
        <button
          type="button"
          onClick={onRetryBest}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#c99850]/40 bg-[#c99850]/10 px-2.5 py-1.5 text-xs font-semibold text-[#f0d49b] transition-colors hover:bg-[#c99850]/20 disabled:cursor-not-allowed disabled:opacity-50"
          title={`Retry the last request with ${modelNames.best}`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Try stronger model
        </button>
      )}
    </div>
  )
}
