/**
 * Questionnaire Types for Logo Wizard
 *
 * Type definitions for wizard questions, options, and answers
 */

export interface QuestionOption {
  id: string
  label: string
  emoji: string
  description: string
  presetScores?: Record<string, number> // presetId -> score
  configValues?: Record<string, any> // config key -> value
  googleFont?: string // Google Font family name for tooltip preview
}

export interface WizardQuestion {
  id: string
  title: string
  subtitle: string
  type: 'single' | 'multi' | 'text'
  options?: QuestionOption[]
  maxSelections?: number // for multi-select
  placeholder?: string // for text input
  required: boolean
  hasAIEnhance?: boolean // for text inputs with AI enhancement
  skipIf?: (answers: Record<string, any>) => boolean // conditional skip logic
}

export interface WizardAnswers {
  [questionId: string]: string | string[] | number | undefined
}
