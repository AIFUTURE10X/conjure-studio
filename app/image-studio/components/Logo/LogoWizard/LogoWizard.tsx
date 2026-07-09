"use client"

/**
 * LogoWizard Component
 *
 * Main wizard container that guides users through logo creation
 * with a step-by-step questionnaire flow, including optional logo reference upload.
 * Supports Quick Mode (6 questions) and Advanced Mode (full questionnaire).
 */

import { useState, useEffect } from 'react'
import { X, Settings, Upload, Zap, Sliders, Undo2 } from 'lucide-react'
import { useQuestionnaireFlow } from './questions/useQuestionnaireFlow'
import { LogoReferenceStep } from './LogoReferenceStep'
import { WizardResultsView } from './WizardResultsView'
import { WizardQuestionnaireView } from './WizardQuestionnaireView'
import {
  mapAnalysisToWizardAnswers,
  mapAnalysisToConfig,
  getPresetsFromAnalysis,
  AnalysisResult,
} from './useLogoAnalysisWizard'
import { WizardMode } from './questions/questionnaire-data'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { LogoResolution } from '../../../constants/logo-constants'

interface LogoWizardProps {
  isOpen: boolean
  onClose: () => void
  onSelectPreset: (presetId: string, config: Record<string, any>) => void
  onGenerateNow?: (presetId: string, config: Record<string, any>, resolution?: LogoResolution) => void
  onSwitchToExpert: () => void
  resolution?: LogoResolution
  onResolutionChange?: (resolution: LogoResolution) => void
}

// Get saved wizard mode from localStorage
function getSavedWizardMode(): WizardMode {
  if (typeof window === 'undefined') return 'quick'
  return (localStorage.getItem('logoWizardMode') as WizardMode) || 'quick'
}

export function LogoWizard({
  isOpen,
  onClose,
  onSelectPreset,
  onGenerateNow,
  onSwitchToExpert,
  resolution: externalResolution = '1K',
  onResolutionChange,
}: LogoWizardProps) {
  const [showResults, setShowResults] = useState(false)
  const [showReferenceStep, setShowReferenceStep] = useState(true)
  const [showModeSelector, setShowModeSelector] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisPresets, setAnalysisPresets] = useState<Array<{ presetId: string; score: number }> | null>(null)
  const [analysisConfig, setAnalysisConfig] = useState<Record<string, any> | null>(null)
  const [localResolution, setLocalResolution] = useState<LogoResolution>(externalResolution)

  // Handle resolution change - update local state and notify parent
  const handleResolutionChange = (newRes: LogoResolution) => {
    setLocalResolution(newRes)
    onResolutionChange?.(newRes)
  }

  const flow = useQuestionnaireFlow(getSavedWizardMode())

  // Save mode preference to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('logoWizardMode', flow.mode)
    }
  }, [flow.mode])

  if (!isOpen) return null

  // Handle analysis complete - skip to variations
  const handleAnalysisComplete = (analysis: AnalysisResult, brandName: string) => {
    const wizardAnswers = mapAnalysisToWizardAnswers(analysis, brandName)
    const config = mapAnalysisToConfig(analysis, brandName)
    const presets = getPresetsFromAnalysis(analysis)

    flow.setAnswersFromAnalysis(wizardAnswers)
    setAnalysisConfig(config)
    setAnalysisPresets(presets)
    setShowReferenceStep(false)
    setShowResults(true)
  }

  // Handle start over - go back to reference step
  const handleStartOver = () => {
    flow.resetWizard()
    setShowResults(false)
    setShowReferenceStep(true)
    setAnalysisPresets(null)
    setAnalysisConfig(null)
  }

  // Show variation results when complete
  if (showResults || flow.isComplete) {
    const recommendedPresets = analysisPresets || flow.getRecommendedPresets()
    const baseConfig = analysisConfig || flow.getConfigFromAnswers()

    return (
      <WizardResultsView
        recommendedPresets={recommendedPresets}
        baseConfig={baseConfig}
        hasAnalysisPresets={!!analysisPresets}
        onBack={() => {
          if (analysisPresets) {
            setShowResults(false)
            setShowReferenceStep(true)
            setAnalysisPresets(null)
            setAnalysisConfig(null)
          } else {
            setShowResults(false)
          }
        }}
        onStartOver={handleStartOver}
        onClose={onClose}
        onSelectVariation={(presetId) => {
          onSelectPreset(presetId, baseConfig)
          onClose()
        }}
        onGenerateNow={onGenerateNow ? (presetId, config) => {
          onGenerateNow(presetId, config, localResolution)
          onClose()
        } : undefined}
        resolution={localResolution}
        onResolutionChange={handleResolutionChange}
      />
    )
  }

  // Show reference step (Step 0) - optional logo upload
  if (showReferenceStep) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="relative w-full max-w-2xl bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Logo Wizard</h2>
                <p className="text-xs text-zinc-400">
                  Upload a reference or answer questions to get started
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* AI Undo Button */}
              {flow.hasAISuggestions && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={flow.undoAISuggestions}
                      className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                      aria-label="Reset AI suggestions"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      Reset AI
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Undo all AI-suggested settings
                  </TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onSwitchToExpert}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-300 hover:text-white transition-colors"
                    aria-label="Switch to Expert Mode for advanced settings"
                  >
                    <Settings className="w-4 h-4" />
                    Expert Mode
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Full configurator with all advanced settings
                </TooltipContent>
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
                <TooltipContent side="bottom">
                  Close wizard
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => flow.setMode('quick')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  flow.mode === 'quick'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
              >
                <Zap className="w-4 h-4" />
                Quick Mode
                <span className="text-xs opacity-75">(~2 min)</span>
              </button>
              <button
                onClick={() => flow.setMode('advanced')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  flow.mode === 'advanced'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
              >
                <Sliders className="w-4 h-4" />
                Advanced
                <span className="text-xs opacity-75">(5+ min)</span>
              </button>
            </div>
            <p className="text-center text-xs text-zinc-500 mt-2">
              {flow.mode === 'quick'
                ? '6 essential questions for fast logo creation'
                : 'Full questionnaire with all customization options'}
            </p>
          </div>

          {/* Reference Step Content */}
          <div className="px-6 py-8">
            <LogoReferenceStep
              onAnalysisComplete={handleAnalysisComplete}
              onSkip={() => setShowReferenceStep(false)}
              analyzing={analyzing}
              setAnalyzing={setAnalyzing}
            />
          </div>
        </div>
      </div>
    )
  }

  // Show questionnaire
  return (
    <WizardQuestionnaireView
      currentStep={flow.currentStep}
      totalSteps={flow.totalSteps}
      currentQuestion={flow.currentQuestion}
      answer={flow.answers[flow.currentQuestion?.id || '']}
      extrusionDepth={flow.extrusionDepth}
      tiltAngle={flow.tiltAngle}
      canGoNext={flow.canGoNext}
      mode={flow.mode}
      onSetMode={flow.setMode}
      isAIFilled={flow.isAIFilled}
      hasAISuggestions={flow.hasAISuggestions}
      onUndoAISuggestions={flow.undoAISuggestions}
      onGoToStep={flow.goToStep}
      onAnswer={flow.setAnswer}
      onToggleMulti={flow.toggleMultiAnswer}
      onExtrusionChange={flow.setExtrusionDepth}
      onTiltAngleChange={flow.setTiltAngle}
      onBack={() => {
        if (flow.currentStep === 0) {
          setShowReferenceStep(true)
        } else {
          flow.prevStep()
        }
      }}
      onNext={() => {
        if (flow.currentStep === flow.totalSteps - 1) {
          setShowResults(true)
        } else {
          flow.nextStep()
        }
      }}
      onSwitchToExpert={onSwitchToExpert}
      onClose={onClose}
    />
  )
}
