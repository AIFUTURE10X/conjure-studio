"use client"

import { Check } from 'lucide-react'
import { DIRECTOR_STEPS } from '../../../constants/photo-director'
import { isDirectorStepReachable } from '@/lib/video/director-project'
import type { DirectorProject, DirectorStep } from '@/lib/video/photo-director-schema'

interface DirectorStepRailProps {
  project: DirectorProject
  onStepClick: (step: DirectorStep) => void
}

/**
 * Progress rail. Navigation is driven by what the project HOLDS, not by how
 * far the user has walked: every step whose work exists stays clickable in
 * both directions, so stepping back to the photos never strands the analysis.
 */
export function DirectorStepRail({ project, onStepClick }: DirectorStepRailProps) {
  const currentIndex = DIRECTOR_STEPS.findIndex((step) => step.key === project.step)

  return (
    <div className="flex items-center gap-1.5 flex-wrap" role="navigation" aria-label="Video director steps">
      {DIRECTOR_STEPS.map((step, index) => {
        const isCurrent = step.key === project.step
        const isReachable = isDirectorStepReachable(project, step.key)
        const isBehind = index < currentIndex
        return (
          <button
            key={step.key}
            onClick={() => !isCurrent && isReachable && onStepClick(step.key)}
            disabled={!isReachable || isCurrent}
            aria-current={isCurrent ? 'step' : undefined}
            title={isCurrent
              ? step.label
              : isReachable
                ? `Go to ${step.label} — your work there is saved`
                : `${step.label} — finish the earlier steps first`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              isCurrent
                ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                : isReachable
                  ? 'bg-zinc-800 text-white hover:bg-zinc-700 cursor-pointer'
                  : 'bg-zinc-900 text-zinc-500 cursor-default'
            }`}
          >
            {isReachable && !isCurrent && isBehind && <Check className="w-3 h-3 text-[#dbb56e]" />}
            {step.label}
          </button>
        )
      })}
    </div>
  )
}
