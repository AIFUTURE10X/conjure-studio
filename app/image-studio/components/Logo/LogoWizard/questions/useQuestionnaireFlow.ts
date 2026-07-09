/**
 * useQuestionnaireFlow Hook
 *
 * Manages the questionnaire state, navigation, and answer processing
 * Supports Quick/Advanced modes with AI suggestion tracking
 */

import { useState, useCallback, useMemo } from 'react'
import {
  WIZARD_QUESTIONS,
  WizardAnswers,
  calculatePresetScores,
  getTopPresets,
  buildConfigFromAnswers,
  WizardMode,
  QUICK_MODE_QUESTIONS,
  QUICK_MODE_DEFAULTS,
  getDefaultFontForStyle,
} from './questionnaire-data'

export interface UseQuestionnaireFlowReturn {
  // State
  currentStep: number
  totalSteps: number
  answers: WizardAnswers
  isComplete: boolean
  currentQuestion: typeof WIZARD_QUESTIONS[0] | null
  extrusionDepth: number
  tiltAngle: number
  mode: WizardMode
  aiFilledFields: Set<string>

  // Navigation
  goToStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  canGoNext: boolean
  canGoPrev: boolean

  // Mode
  setMode: (mode: WizardMode) => void

  // Answers
  setAnswer: (questionId: string, value: string | string[] | undefined) => void
  getAnswer: (questionId: string) => string | string[] | number | undefined
  toggleMultiAnswer: (questionId: string, optionId: string) => void
  setAnswersFromAnalysis: (analysisAnswers: WizardAnswers) => void
  setExtrusionDepth: (value: number) => void
  setTiltAngle: (value: number) => void

  // AI Tracking
  isAIFilled: (questionId: string) => boolean
  undoAISuggestions: () => void
  hasAISuggestions: boolean

  // Results
  getRecommendedPresets: () => Array<{ presetId: string; score: number }>
  getConfigFromAnswers: () => Record<string, any>
  resetWizard: () => void
}

export function useQuestionnaireFlow(initialMode: WizardMode = 'quick'): UseQuestionnaireFlowReturn {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<WizardAnswers>({})
  const [extrusionDepth, setExtrusionDepth] = useState(50)
  const [tiltAngle, setTiltAngle] = useState(0)
  const [mode, setModeState] = useState<WizardMode>(initialMode)

  // AI suggestion tracking
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set())
  const [preAIAnswers, setPreAIAnswers] = useState<WizardAnswers | null>(null)

  // Get filtered questions based on mode
  const filteredQuestions = useMemo(() => {
    if (mode === 'quick') {
      return WIZARD_QUESTIONS.filter(q => QUICK_MODE_QUESTIONS.includes(q.id))
    }
    return WIZARD_QUESTIONS
  }, [mode])

  const totalSteps = filteredQuestions.length
  const isComplete = currentStep >= totalSteps

  // Find next valid step (skipping questions with skipIf returning true)
  const findNextValidStep = useCallback((fromStep: number, direction: 'forward' | 'backward'): number => {
    let step = fromStep
    const increment = direction === 'forward' ? 1 : -1
    const limit = direction === 'forward' ? filteredQuestions.length : -1

    while (step !== limit) {
      const question = filteredQuestions[step]
      if (question && question.skipIf) {
        if (question.skipIf(answers)) {
          step += increment
          continue
        }
      }
      return step
    }
    return step
  }, [answers, filteredQuestions])

  const currentQuestion = useMemo(() => {
    if (currentStep >= 0 && currentStep < filteredQuestions.length) {
      return filteredQuestions[currentStep]
    }
    return null
  }, [currentStep, filteredQuestions])

  // Check if current step has a valid answer
  const canGoNext = useMemo(() => {
    if (!currentQuestion) return false

    const answer = answers[currentQuestion.id]

    if (!currentQuestion.required) return true

    if (currentQuestion.type === 'text') {
      return typeof answer === 'string' && answer.trim().length > 0
    }

    if (currentQuestion.type === 'multi') {
      return Array.isArray(answer) && answer.length > 0
    }

    return typeof answer === 'string' && answer.length > 0
  }, [currentQuestion, answers])

  const canGoPrev = currentStep > 0

  // Navigation
  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step <= totalSteps) {
      setCurrentStep(step)
    }
  }, [totalSteps])

  const nextStep = useCallback(() => {
    if (canGoNext && currentStep < totalSteps) {
      const nextValidStep = findNextValidStep(currentStep + 1, 'forward')
      setCurrentStep(nextValidStep)
    }
  }, [canGoNext, currentStep, totalSteps, findNextValidStep])

  const prevStep = useCallback(() => {
    if (canGoPrev) {
      const prevValidStep = findNextValidStep(currentStep - 1, 'backward')
      setCurrentStep(Math.max(0, prevValidStep))
    }
  }, [canGoPrev, currentStep, findNextValidStep])

  // Answer management
  const setAnswer = useCallback((questionId: string, value: string | string[] | undefined) => {
    setAnswers((prev) => {
      if (value === undefined) {
        // Remove the answer key when value is undefined (deselect)
        const { [questionId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [questionId]: value }
    })
    // Clear AI-filled status when user manually changes
    setAiFilledFields(prev => {
      const next = new Set(prev)
      next.delete(questionId)
      return next
    })
  }, [])

  const getAnswer = useCallback(
    (questionId: string) => answers[questionId],
    [answers]
  )

  const toggleMultiAnswer = useCallback((questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const current = prev[questionId]
      const currentArray = Array.isArray(current) ? current : []

      // Find the question to check maxSelections
      const question = filteredQuestions.find((q) => q.id === questionId)
      const maxSelections = question?.maxSelections || Infinity

      if (currentArray.includes(optionId)) {
        // Remove if already selected
        return { ...prev, [questionId]: currentArray.filter((id) => id !== optionId) }
      } else {
        // Add if not at max
        if (currentArray.length < maxSelections) {
          return { ...prev, [questionId]: [...currentArray, optionId] }
        }
      }
      return prev
    })
    // Clear AI-filled status when user manually changes
    setAiFilledFields(prev => {
      const next = new Set(prev)
      next.delete(questionId)
      return next
    })
  }, [filteredQuestions])

  // Results
  const getRecommendedPresets = useCallback(() => {
    const scores = calculatePresetScores(answers)
    return getTopPresets(scores, 5) // Changed from 4 to 5 for more variations
  }, [answers])

  const getConfigFromAnswers = useCallback(() => {
    const config = buildConfigFromAnswers({ ...answers, extrusionDepth, tiltAngle })
    return config
  }, [answers, extrusionDepth, tiltAngle])

  const resetWizard = useCallback(() => {
    setCurrentStep(0)
    setAnswers({})
    setExtrusionDepth(50)
    setTiltAngle(0)
  }, [])

  // Set all answers at once from analysis results (with AI tracking)
  const setAnswersFromAnalysis = useCallback((analysisAnswers: WizardAnswers) => {
    // Store pre-AI state for undo
    setPreAIAnswers({ ...answers })

    // Track which fields AI filled
    setAiFilledFields(new Set(Object.keys(analysisAnswers)))

    // Apply answers
    setAnswers(prev => ({ ...prev, ...analysisAnswers }))
  }, [answers])

  // Undo all AI suggestions and restore previous state
  const undoAISuggestions = useCallback(() => {
    if (preAIAnswers) {
      setAnswers(preAIAnswers)
      setAiFilledFields(new Set())
      setPreAIAnswers(null)
    }
  }, [preAIAnswers])

  // Check if a specific field was filled by AI
  const isAIFilled = useCallback((questionId: string) => {
    return aiFilledFields.has(questionId)
  }, [aiFilledFields])

  // Mode setter with step reset
  const setMode = useCallback((newMode: WizardMode) => {
    setModeState(newMode)
    setCurrentStep(0) // Reset to beginning when mode changes
  }, [])

  return {
    // State
    currentStep,
    totalSteps,
    answers,
    isComplete,
    currentQuestion,
    extrusionDepth,
    tiltAngle,
    mode,
    aiFilledFields,

    // Navigation
    goToStep,
    nextStep,
    prevStep,
    canGoNext,
    canGoPrev,

    // Mode
    setMode,

    // Answers
    setAnswer,
    getAnswer,
    toggleMultiAnswer,
    setAnswersFromAnalysis,
    setExtrusionDepth,
    setTiltAngle,

    // AI Tracking
    isAIFilled,
    undoAISuggestions,
    hasAISuggestions: aiFilledFields.size > 0,

    // Results
    getRecommendedPresets,
    getConfigFromAnswers,
    resetWizard,
  }
}
