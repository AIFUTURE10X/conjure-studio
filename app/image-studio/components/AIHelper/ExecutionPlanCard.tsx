'use client'

import { ListChecks } from 'lucide-react'

interface ExecutionPlanCardProps {
  executionPlan?: string[]
}

export function ExecutionPlanCard({ executionPlan }: ExecutionPlanCardProps) {
  const visibleSteps = (executionPlan || [])
    .map((step) => step.trim())
    .filter(Boolean)
    .slice(0, 4)

  if (visibleSteps.length === 0) return null

  return (
    <div className="mt-3 rounded-lg border border-[#c99850]/30 bg-zinc-800/80 p-4">
      <div className="mb-3 flex items-center gap-2 border-b border-[#c99850]/20 pb-2">
        <ListChecks className="h-4 w-4 text-[#c99850]" />
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#f0d49b]">Creative plan</span>
      </div>
      <ol className="space-y-2">
        {visibleSteps.map((step, index) => (
          <li key={`${index}-${step}`} className="flex gap-3 rounded-md border border-zinc-700/70 bg-zinc-900/60 px-3 py-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#c99850] text-[11px] font-bold text-black">
              {index + 1}
            </span>
            <p className="text-sm leading-6 text-zinc-200">
              <span className="sr-only">Plan step {index + 1}: </span>
              {step}
            </p>
          </li>
        ))}
      </ol>
    </div>
  )
}
