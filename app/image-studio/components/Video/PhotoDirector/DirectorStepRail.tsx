"use client"

import { Check } from 'lucide-react'
import { DIRECTOR_STEPS } from '../../../constants/photo-director'
import type { DirectorStep } from '@/lib/video/photo-director-schema'

interface DirectorStepRailProps {
  current: DirectorStep
  onStepClick: (step: DirectorStep) => void
}

/**
 * Compact progress rail. Completed steps are clickable (backwards is always
 * free); future steps are not — each is unlocked by finishing the one before.
 */
export function DirectorStepRail({ current, onStepClick }: DirectorStepRailProps) {
  const currentIndex = DIRECTOR_STEPS.findIndex((step) => step.key === current)

  return (
    <div className="flex items-center gap-1 flex-wrap" role="navigation" aria-label="Video director steps">
      {DIRECTOR_STEPS.map((step, index) => {
        const isDone = index < currentIndex
        const isCurrent = index === currentIndex
        return (
          <button
            key={step.key}
            onClick={() => isDone && onStepClick(step.key)}
            disabled={!isDone}
            aria-current={isCurrent ? 'step' : undefined}
            title={isDone ? `Go back to ${step.label}` : step.label}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
              isCurrent
                ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                : isDone
                  ? 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 cursor-pointer'
                  : 'bg-zinc-900 text-zinc-600 cursor-default'
            }`}
          >
            {isDone && <Check className="w-2.5 h-2.5" />}
            {step.label}
          </button>
        )
      })}
    </div>
  )
}
