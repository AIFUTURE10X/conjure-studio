/**
 * Single-change follow-up patch builder for the AI helper.
 *
 * Extracted verbatim from AIHelperSidebar. Pure: maps a natural-language
 * follow-up (or complaint) plus the latest suggestion into a patched
 * suggestion set. Behavior is pinned by check-ai-helper-ui-contract.cjs.
 */

import type { AIHelperMode, AIMessage } from '../hooks/useAIHelper'
import {
  appendNegativeDirective,
  appendPromptDirective,
  extractRequestedBrandText,
  normalizeDirectCommand,
} from './helper-commands'

export const buildSuggestionPatchFromFollowUp = (
  userInput: string,
  suggestions: AIMessage['suggestions'],
  targetMode: AIHelperMode
): Partial<NonNullable<AIMessage['suggestions']>> | null => {
  const normalized = normalizeDirectCommand(userInput)
  const requestedBrandText = extractRequestedBrandText(userInput)
  const wantsWhiteBackground = [
    'make the background white',
    'white background',
    'plain white background',
    'pure white background',
    'make it white',
  ].some((term) => normalized.includes(term))
  const wantsTransparentBackground = [
    'make it transparent',
    'transparent background',
    'true png',
    'no visible background',
    'remove the background',
  ].some((term) => normalized.includes(term))
  const wantsReferenceTypography = [
    'match reference font',
    'match the reference font',
    'use reference font',
    'make font like reference',
    'match reference typography',
  ].some((term) => normalized.includes(term))
  const wantsFontOnlyChange = [
    'change only the font',
    'font only',
    'only change the font',
    'just change the font',
  ].some((term) => normalized.includes(term))
  const wantsExactText = [
    'preserve exact text',
    'keep exact text',
    'exact spelling',
    'do not change the words',
    'same words',
  ].some((term) => normalized.includes(term))
  const reportsRejectedBlueBackground = [
    'it gave me a blue background',
    'it is giving me a blue background',
    'it gave a blue background',
    'background is blue',
    'blue background again',
    'still blue background',
  ].some((term) => normalized.includes(term))
  const reportsVisibleBackgroundAfterTransparentRequest = [
    'still has a background',
    'still have some background',
    'has a background not a true png',
    'not a true png',
    'not true png',
    'background in the png',
  ].some((term) => normalized.includes(term))
  const reportsReferenceDrift = [
    'ignored the reference',
    'does not match the reference',
    "doesn't match the reference",
    'not following the reference',
    'not following that reference',
    'reference drift',
  ].some((term) => normalized.includes(term))
  const reportsWrongFont = [
    'font is wrong',
    'wrong font',
    'typeface is wrong',
    'lettering is wrong',
    'not following the font',
    'not following the reference font',
  ].some((term) => normalized.includes(term))

  if (!suggestions || (!requestedBrandText && !wantsWhiteBackground && !wantsTransparentBackground && !wantsReferenceTypography && !wantsFontOnlyChange && !wantsExactText && !reportsRejectedBlueBackground && !reportsVisibleBackgroundAfterTransparentRequest && !reportsReferenceDrift && !reportsWrongFont)) {
    return null
  }

  let prompt = suggestions.prompt || ''
  let negativePrompt = suggestions.negativePrompt || ''
  const patch: Partial<NonNullable<AIMessage['suggestions']>> = {}

  if (wantsWhiteBackground) {
    prompt = appendPromptDirective(prompt, 'Single-change refinement: make the background a visible flat pure white (#FFFFFF) background; preserve every other approved element.')
    negativePrompt = appendNegativeDirective(negativePrompt, 'blue background, navy background, dark background, gradient background, transparent background')
    if (targetMode === 'logo') patch.bgRemovalMethod = 'none'
  }

  if (reportsRejectedBlueBackground) {
    prompt = appendPromptDirective(prompt, 'Single-change refinement: failed background correction: use a visible flat pure white (#FFFFFF) background only; preserve every other approved element and treat any blue background as rejected blue background.')
    negativePrompt = appendNegativeDirective(negativePrompt, 'rejected blue background, blue background, navy background, cyan background, dark background, gradient background')
    if (targetMode === 'logo') patch.bgRemovalMethod = 'none'
  }

  if (wantsTransparentBackground) {
    prompt = appendPromptDirective(prompt, 'Single-change refinement: create a transparent PNG with no visible background; preserve every other approved element.')
    negativePrompt = appendNegativeDirective(negativePrompt, 'visible background, white box, dark backdrop, colored backdrop, checkerboard pattern')
    patch.bgRemovalMethod = 'photoroom'
  }

  if (reportsVisibleBackgroundAfterTransparentRequest) {
    prompt = appendPromptDirective(prompt, 'Single-change refinement: failed transparent PNG correction: create a true transparent PNG with no visible background, no leftover rectangle, and no background residue; preserve every other approved element.')
    negativePrompt = appendNegativeDirective(negativePrompt, 'visible background, leftover background, rectangle backdrop, white box, dark backdrop, colored backdrop, checkerboard pattern')
    patch.bgRemovalMethod = 'photoroom'
  }

  if (wantsReferenceTypography) {
    prompt = appendPromptDirective(prompt, 'Single-change refinement: match the reference typography as closely as possible, including letter proportions, stroke contrast, spacing, capitalization, and visual rhythm; preserve every other approved element.')
    negativePrompt = appendNegativeDirective(negativePrompt, 'wrong font, generic font, dot matrix style, mismatched typography, altered wording')
    if (targetMode === 'logo') patch.textMode = 'exact-text-overlay'
  }

  if (reportsReferenceDrift || reportsWrongFont) {
    prompt = appendPromptDirective(prompt, 'Single-change refinement: failed reference match correction: correct reference drift by matching the uploaded/reference typography, letter proportions, stroke contrast, spacing, capitalization, and visual rhythm; preserve every other approved element.')
    negativePrompt = appendNegativeDirective(negativePrompt, 'reference drift, ignored reference, does not match the reference, wrong font, generic font, dot matrix style, mismatched typography, altered wording')
    if (targetMode === 'logo') patch.textMode = 'exact-text-overlay'
  }

  if (wantsFontOnlyChange) {
    prompt = appendPromptDirective(prompt, 'Single-change refinement: change only the font/typography treatment; preserve every other approved element, layout, colors, background, icon, and composition.')
    negativePrompt = appendNegativeDirective(negativePrompt, 'composition changes, color changes, background changes, icon changes, extra words')
  }

  if (wantsExactText) {
    prompt = appendPromptDirective(prompt, 'Single-change refinement: preserve exact text, spelling, capitalization, spacing, and line breaks; preserve every other approved element.')
    negativePrompt = appendNegativeDirective(negativePrompt, 'misspelled text, extra words, missing words, incorrect capitalization, altered wording')
    if (targetMode === 'logo') patch.textMode = 'exact-text-overlay'
  }

  if (requestedBrandText) {
    prompt = appendPromptDirective(prompt, `Single-change refinement: set exact visible brand text to "${requestedBrandText}" as the exact brand text; preserve every other approved element.`)
    negativePrompt = appendNegativeDirective(negativePrompt, 'misspelled brand text, wrong brand name, extra words, missing words, incorrect capitalization, altered wording')
    if (targetMode === 'logo') patch.textMode = 'exact-text-overlay'
  }

  return {
    ...patch,
    prompt,
    negativePrompt,
  }
}
