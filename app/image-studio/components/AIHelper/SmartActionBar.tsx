'use client'

import { Clipboard, CornerDownRight, GitCompare, ImageIcon, RefreshCw, SearchCheck, Settings2, Sparkles } from 'lucide-react'
import type { AIHelperAction } from '../../hooks/useAIHelper'

interface SmartActionBarProps {
  actions: AIHelperAction[]
  onRunAction: (action: AIHelperAction) => void
}

const ACTION_ICONS: Record<AIHelperAction['type'], typeof Settings2> = {
  apply_suggestions: CornerDownRight,
  apply_and_generate: Sparkles,
  apply_logo_config: Settings2,
  critique_last_output: SearchCheck,
  make_variation: RefreshCw,
  compare_to_reference: GitCompare,
  copy_prompt: Clipboard,
  switch_to_image: ImageIcon,
  switch_to_logo: Sparkles,
  ask_follow_up: CornerDownRight,
}

export function SmartActionBar({ actions, onRunAction }: SmartActionBarProps) {
  if (actions.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {actions.slice(0, 5).map((action, index) => {
        const Icon = ACTION_ICONS[action.type] || CornerDownRight
        return (
          <button
            key={`${action.type}-${index}`}
            onClick={() => onRunAction(action)}
            className="inline-flex items-center gap-2 rounded-md border border-[#c99850]/30 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-100 transition-colors hover:border-[#c99850]/60 hover:bg-zinc-700"
            title={action.description || action.label}
          >
            <Icon className="h-3.5 w-3.5 text-[#c99850]" />
            {action.label}
          </button>
        )
      })}
    </div>
  )
}
