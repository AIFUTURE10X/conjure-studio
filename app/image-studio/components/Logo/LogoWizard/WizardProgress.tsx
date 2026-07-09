"use client"

/**
 * WizardProgress Component
 *
 * Shows step progress indicator for the questionnaire
 */

import { Check } from 'lucide-react'
import { WIZARD_QUESTIONS } from './questions/questionnaire-data'

interface WizardProgressProps {
  currentStep: number
  totalSteps: number
  onStepClick?: (step: number) => void
  answers: Record<string, string | string[] | undefined>
}

export function WizardProgress({
  currentStep,
  totalSteps,
  onStepClick,
  answers,
}: WizardProgressProps) {
  const isStepComplete = (step: number) => {
    const question = WIZARD_QUESTIONS[step]
    if (!question) return false
    const answer = answers[question.id]
    if (!question.required) return true
    if (question.type === 'text') return typeof answer === 'string' && answer.trim().length > 0
    if (question.type === 'multi') return Array.isArray(answer) && answer.length > 0
    return typeof answer === 'string' && answer.length > 0
  }

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isActive = index === currentStep
        const isCompleted = index < currentStep && isStepComplete(index)
        const isPast = index < currentStep

        return (
          <button
            key={index}
            onClick={() => onStepClick?.(index)}
            disabled={index > currentStep && !isStepComplete(index - 1)}
            className={`
              relative w-10 h-10 rounded-full flex items-center justify-center
              transition-all duration-200
              ${
                isActive
                  ? 'bg-linear-to-r from-purple-500 to-pink-500 text-white scale-110'
                  : isCompleted
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : isPast
                  ? 'bg-zinc-600 text-zinc-300 hover:bg-zinc-500'
                  : 'bg-zinc-800 text-zinc-500'
              }
              ${index <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
            `}
          >
            {isCompleted ? (
              <Check className="w-5 h-5" />
            ) : (
              <span className="text-sm font-medium">{index + 1}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * WizardProgressBar Component
 *
 * Alternative linear progress bar display with clickable step numbers
 */
interface WizardProgressBarProps {
  currentStep: number
  totalSteps: number
  onStepClick?: (step: number) => void
}

export function WizardProgressBar({ currentStep, totalSteps, onStepClick }: WizardProgressBarProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className="w-full mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-zinc-400">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-xs text-zinc-400">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-linear-to-r from-purple-500 to-pink-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      {/* Clickable Step Numbers */}
      <div className="flex justify-between items-center px-1">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isActive = index === currentStep
          const isPast = index < currentStep
          const canClick = index <= currentStep

          return (
            <button
              key={index}
              onClick={() => canClick && onStepClick?.(index)}
              disabled={!canClick}
              className={`
                text-[10px] font-medium transition-all
                ${isActive
                  ? 'text-purple-400 font-bold'
                  : isPast
                  ? 'text-zinc-400 hover:text-purple-400 cursor-pointer'
                  : 'text-zinc-600 cursor-not-allowed'
                }
              `}
              title={canClick ? `Go to step ${index + 1}` : `Complete previous steps first`}
            >
              {index + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}
