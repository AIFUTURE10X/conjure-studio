/**
 * Questionnaire Helpers for Logo Wizard
 *
 * Functions for calculating preset scores and building config from answers
 */

import { WizardAnswers } from './questionnaire-types'
import { WIZARD_QUESTIONS } from './questionnaire-data'

/**
 * Calculate preset scores based on user answers
 */
export function calculatePresetScores(answers: WizardAnswers): Record<string, number> {
  const scores: Record<string, number> = {}

  for (const question of WIZARD_QUESTIONS) {
    const answer = answers[question.id]
    if (!answer || !question.options) continue

    const selectedIds = Array.isArray(answer) ? answer : [answer]

    for (const optionId of selectedIds) {
      const option = question.options.find((o) => o.id === optionId)
      if (option?.presetScores) {
        for (const [presetId, score] of Object.entries(option.presetScores)) {
          scores[presetId] = (scores[presetId] || 0) + score
        }
      }
    }
  }

  return scores
}

/**
 * Get top N presets sorted by score
 */
export function getTopPresets(
  scores: Record<string, number>,
  count: number = 4
): Array<{ presetId: string; score: number }> {
  return Object.entries(scores)
    .map(([presetId, score]) => ({ presetId, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
}

/**
 * Build config object from wizard answers
 */
export function buildConfigFromAnswers(answers: WizardAnswers): Record<string, any> {
  const config: Record<string, any> = {}

  for (const question of WIZARD_QUESTIONS) {
    const answer = answers[question.id]

    if (question.type === 'text' && answer) {
      if (question.id === 'brandName') {
        config.brandName = answer as string
      }
      if (question.id === 'tagline') {
        config.tagline = answer as string
      }
      if (question.id === 'logoImagePrompt') {
        config.logoImagePrompt = answer as string
        config.customLogoImage = true
      }
      continue
    }

    if (!answer || !question.options) continue

    // Special handling for imageColorPicker - collect as array
    if (question.id === 'imageColorPicker') {
      const selectedColors = Array.isArray(answer) ? answer : [answer]
      config.imageColors = selectedColors // Store as array of color IDs
      continue
    }

    const selectedIds = Array.isArray(answer) ? answer : [answer]

    for (const optionId of selectedIds) {
      const option = question.options.find((o) => o.id === optionId)
      if (option?.configValues) {
        Object.assign(config, option.configValues)
      }
    }
  }

  // Handle extrusion depth slider value if present
  if (answers.extrusionDepth !== undefined) {
    config.extrusionDepth = answers.extrusionDepth
  }

  // Handle tilt angle slider value if present
  if (answers.tiltAngle !== undefined) {
    config.tiltAngle = answers.tiltAngle
  }

  return config
}
