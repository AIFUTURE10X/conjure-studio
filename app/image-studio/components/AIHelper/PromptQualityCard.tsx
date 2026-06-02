'use client'

import { ShieldCheck } from 'lucide-react'

interface PromptQualityCardProps {
  plannerDecision?: string
  checklist?: string[]
}

function formatPlannerDecision(value?: string): string {
  if (!value?.trim()) return 'suggest prompt'
  return value.replace(/_/g, ' ')
}

export function PromptQualityCard({ plannerDecision, checklist }: PromptQualityCardProps) {
  const visibleItems = (checklist || [])
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5)

  if (visibleItems.length === 0) return null

  return (
    <div className="mt-3 rounded-lg border border-emerald-500/25 bg-emerald-950/15 p-4">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-emerald-500/20 pb-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-300" />
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-200">Prompt self-check</span>
        </div>
        <span className="rounded border border-emerald-500/30 px-2 py-1 text-[11px] font-semibold capitalize text-emerald-100">
          Planner: {formatPlannerDecision(plannerDecision)}
        </span>
      </div>
      <ul className="space-y-2">
        {visibleItems.map((item, index) => (
          <li key={`${index}-${item}`} className="flex gap-2 text-sm leading-6 text-zinc-200">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
