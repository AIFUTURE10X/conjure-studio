"use client"

/**
 * Wizard Questionnaire View Component
 *
 * Shows the step-by-step questionnaire flow.
 * Supports Quick/Advanced modes with AI suggestion indicators.
 */

import { ChevronLeft, ChevronRight, Sparkles, Settings, X, Zap, Sliders, Undo2 } from 'lucide-react'
import { WizardProgressBar } from './WizardProgress'
import { QuestionCard } from './QuestionCard'
import { WizardMode, WizardQuestion } from './questions/questionnaire-data'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface WizardQuestionnaireViewProps {
  currentStep: number
  totalSteps: number
  currentQuestion: WizardQuestion | null
  answer: string | string[] | number | undefined
  extrusionDepth: number
  tiltAngle: number
  canGoNext: boolean
  mode: WizardMode
  onSetMode: (mode: WizardMode) => void
  isAIFilled: (questionId: string) => boolean
  hasAISuggestions: boolean
  onUndoAISuggestions: () => void
  onGoToStep: (step: number) => void
  onAnswer: (questionId: string, value: string | string[] | undefined) => void
  onToggleMulti: (questionId: string, optionId: string) => void
  onExtrusionChange: (depth: number) => void
  onTiltAngleChange: (angle: number) => void
  onBack: () => void
  onNext: () => void
  onSwitchToExpert: () => void
  onClose: () => void
}

export function WizardQuestionnaireView({
  currentStep,
  totalSteps,
  currentQuestion,
  answer,
  extrusionDepth,
  tiltAngle,
  canGoNext,
  mode,
  onSetMode,
  isAIFilled,
  hasAISuggestions,
  onUndoAISuggestions,
  onGoToStep,
  onAnswer,
  onToggleMulti,
  onExtrusionChange,
  onTiltAngleChange,
  onBack,
  onNext,
  onSwitchToExpert,
  onClose,
}: WizardQuestionnaireViewProps) {
  // Check if current question was filled by AI
  const currentIsAIFilled = currentQuestion ? isAIFilled(currentQuestion.id) : false

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Logo Wizard
                <span className="ml-2 text-xs font-normal text-zinc-400">
                  {mode === 'quick' ? 'Quick Mode' : 'Advanced'}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                {mode === 'quick'
                  ? '6 essential questions for fast logo creation'
                  : 'Full questionnaire with all customization options'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex items-center bg-zinc-800 rounded-lg p-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSetMode('quick')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all ${
                      mode === 'quick'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    aria-label="Switch to Quick Mode"
                  >
                    <Zap className="w-3 h-3" />
                    Quick
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">6 questions (~2 min)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSetMode('advanced')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all ${
                      mode === 'advanced'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    aria-label="Switch to Advanced Mode"
                  >
                    <Sliders className="w-3 h-3" />
                    Advanced
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Full customization (5+ min)</TooltipContent>
              </Tooltip>
            </div>

            {/* AI Undo Button */}
            {hasAISuggestions && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onUndoAISuggestions}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                    aria-label="Reset AI suggestions"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Reset AI suggestions</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onSwitchToExpert}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-300 hover:text-white transition-colors"
                  aria-label="Switch to Expert Mode"
                >
                  <Settings className="w-4 h-4" />
                  Expert
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Full configurator with all settings</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onClose}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                  aria-label="Close wizard"
                >
                  <X className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Close wizard</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Progress Bar with Clickable Steps */}
        <div className="px-6 pt-4">
          <WizardProgressBar
            currentStep={currentStep}
            totalSteps={totalSteps}
            onStepClick={onGoToStep}
          />
        </div>

        {/* Question Content */}
        <div className="px-6 py-8 min-h-[300px]">
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              answer={answer}
              onAnswer={(value) => onAnswer(currentQuestion.id, value)}
              onToggleMulti={(optionId) => onToggleMulti(currentQuestion.id, optionId)}
              extrusionDepth={extrusionDepth}
              onExtrusionChange={onExtrusionChange}
              tiltAngle={tiltAngle}
              onTiltAngleChange={onTiltAngleChange}
              isAIFilled={currentIsAIFilled}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-white hover:bg-zinc-800"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <span className="text-sm text-zinc-500">
            {currentStep + 1} / {totalSteps}
          </span>

          <button
            onClick={onNext}
            disabled={!canGoNext}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
              canGoNext
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {currentStep === totalSteps - 1 ? (
              <>
                <Sparkles className="w-4 h-4" />
                See Results
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
