"use client"

import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, ChevronUp, ListChecks, X } from 'lucide-react'
import { useStudioCore, useStudioMode } from '../../context/useStudio'
import {
  clearConciergePlan, toggleConciergeStep, useActiveConciergePlan,
} from '../../hooks/useConciergePlan'
import { getConciergePlanById, VIDEO_COMPLETED_EVENT, type ConciergeStep } from '../../constants/concierge-tree'

/**
 * Pinned progress checklist for the active Concierge plan. Floats over the
 * canvas; steps tick themselves from real studio state (mode, generated
 * images, start frame, finished clips) and can be toggled by hand.
 */
export function ConciergeChecklist() {
  const active = useActiveConciergePlan()
  const { mode } = useStudioMode()
  const { state } = useStudioCore()
  const [collapsed, setCollapsed] = useState(false)
  const [clipCompletedAt, setClipCompletedAt] = useState<number | null>(null)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    const onCompleted = () => setClipCompletedAt(Date.now())
    window.addEventListener(VIDEO_COMPLETED_EVENT, onCompleted)
    return () => window.removeEventListener(VIDEO_COMPLETED_EVENT, onCompleted)
  }, [])

  // Freshly applied plan: glow for a few seconds so the pinned checklist
  // can't be missed among the mode switch and settings changes.
  useEffect(() => {
    if (!active || Date.now() - active.startedAt > 8000) return
    setFlash(true)
    const timer = setTimeout(() => setFlash(false), 5000)
    return () => clearTimeout(timer)
  }, [active?.planId, active?.startedAt])

  const plan = active ? getConciergePlanById(active.planId) ?? active.plan ?? null : null

  const hasNewImage = useMemo(() => {
    if (!active) return false
    return state.generatedImages.some(
      (image) => typeof image.timestamp === 'number' && image.timestamp > active.startedAt,
    )
  }, [active, state.generatedImages])

  if (!active || !plan) return null

  const isAutoDone = (step: ConciergeStep): boolean => {
    switch (step.auto) {
      case 'mode':
        return mode === plan.mode
      case 'image-generated':
        return hasNewImage
      case 'start-frame':
        return state.videoStartFrame !== null
      case 'clip-completed':
        return clipCompletedAt !== null && clipCompletedAt > active.startedAt
      default:
        return false
    }
  }

  const isDone = (step: ConciergeStep) => active.done.includes(step.key) || isAutoDone(step)
  const doneCount = plan.steps.filter(isDone).length
  const allDone = doneCount === plan.steps.length

  return (
    <div
      className={`absolute bottom-4 right-4 z-40 w-72 rounded-lg border bg-zinc-950/95 shadow-xl backdrop-blur-sm animate-in slide-in-from-bottom-4 fade-in duration-500 transition-shadow ${
        flash
          ? 'border-[#dbb56e] ring-2 ring-[#dbb56e]/60 shadow-[0_0_28px_rgba(219,181,110,0.35)]'
          : 'border-[#c99850]/40'
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
        <ListChecks className="w-3.5 h-3.5 text-[#dbb56e] shrink-0" />
        <span className="min-w-0 truncate text-xs font-semibold text-zinc-100">{plan.title}</span>
        <span className="ml-auto shrink-0 text-[10px] font-bold text-zinc-500">
          {doneCount}/{plan.steps.length}
        </span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-0.5 text-zinc-500 hover:text-zinc-200 transition-colors"
          title={collapsed ? 'Expand checklist' : 'Collapse checklist'}
        >
          {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={clearConciergePlan}
          className="p-0.5 text-zinc-500 hover:text-zinc-200 transition-colors"
          title="Dismiss this plan"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {!collapsed && (
        <ul className="p-2 space-y-1">
          {plan.steps.map((step) => {
            const done = isDone(step)
            return (
              <li key={step.key}>
                <button
                  onClick={() => toggleConciergeStep(step.key)}
                  className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-zinc-900"
                  title={step.auto ? 'Ticks automatically — click to override' : 'Click to tick off'}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      done
                        ? 'border-[#c99850] bg-[#c99850] text-black'
                        : 'border-zinc-700 bg-zinc-900'
                    }`}
                  >
                    {done && <Check className="w-3 h-3" />}
                  </span>
                  <span
                    className={`text-[11px] leading-4 ${
                      done ? 'text-zinc-500 line-through' : 'text-zinc-300'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              </li>
            )
          })}
          {allDone && (
            <li className="px-2 pt-1 pb-0.5 text-[11px] font-medium text-[#dbb56e]">
              All done — dismiss this plan or start another from the top bar.
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
