/**
 * Pure helpers for AI helper direct chat commands.
 *
 * Extracted verbatim from AIHelperSidebar so the chat controller hook and
 * any host (overlay sidebar, studio helper panel) share one implementation.
 * Behavior is pinned by scripts/check-ai-helper-ui-contract.cjs.
 */

import type { AIHelperMode } from '../hooks/useAIHelper'

export const normalizeDirectCommand = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/[.!?]+$/g, '')
  .replace(/^(ok|okay|yes|yep|please|sure)[,\s]+/g, '')
  .trim()

export const detectRequestedHelperMode = (value: string): AIHelperMode | null => {
  const normalized = normalizeDirectCommand(value)
  const logoRequestTerms = [
    'logo',
    'wordmark',
    'brand mark',
    'brandmark',
    'monogram',
    'business logo',
    'company logo',
    'symbol-only',
    'text logo',
  ]
  const imageRequestTerms = [
    'image',
    'photo',
    'picture',
    'poster',
    'flyer',
    'illustration',
    'artwork',
    'ad creative',
    'social media post',
    'product shot',
  ]
  const asksForLogo = logoRequestTerms.some((term) => normalized.includes(term))
  const asksForImage = imageRequestTerms.some((term) => normalized.includes(term))

  if (asksForLogo && !asksForImage) return 'logo'
  if (asksForImage && !asksForLogo) return 'image'
  return null
}

export const matchesDirectCommand = (value: string, terms: string[]) => terms.includes(normalizeDirectCommand(value))

export const matchesNaturalDirectCommand = (value: string, terms: string[]) => {
  const normalized = normalizeDirectCommand(value)
  return terms.some((term) => normalized === term || normalized.includes(term))
}

export const appendPromptDirective = (prompt: string | undefined, directive: string) => {
  const basePrompt = prompt?.trim() || ''
  if (basePrompt.toLowerCase().includes(directive.toLowerCase())) return basePrompt
  return basePrompt ? `${basePrompt}\n\n${directive}` : directive
}

export const appendNegativeDirective = (negativePrompt: string | undefined, directive: string) => {
  const baseNegative = negativePrompt?.trim() || ''
  if (!baseNegative) return directive
  if (baseNegative.toLowerCase().includes(directive.toLowerCase())) return baseNegative
  return `${baseNegative}, ${directive}`
}

export const buildLocalActionSummary = ({
  summary,
  preserving,
  changing,
  action,
  note,
}: {
  summary: string
  preserving: string
  changing: string
  action: string
  note?: string
}) => [
  summary,
  `Preserving: ${preserving}`,
  `Changing: ${changing}`,
  `Action: ${action}`,
  note,
].filter(Boolean).join('\n')

export const extractRequestedBrandText = (userInput: string) => {
  const trimmedInput = userInput.trim().replace(/[.!?]+$/g, '')
  const brandTextPatterns = [
    /(?:make|change|set|update)\s+(?:the\s+)?(?:logo\s+|brand\s+)?(?:text|wording)\s+(?:to|say)\s+["']?(.+?)["']?$/i,
    /(?:make|change|set|update)\s+(?:the\s+)?logo\s+say\s+["']?(.+?)["']?$/i,
    /(?:brand\s+name|logo\s+name|exact\s+text)\s+(?:is|should\s+be|to)\s+["']?(.+?)["']?$/i,
    /(?:use|set)\s+["'](.+?)["']\s+as\s+(?:the\s+)?(?:brand\s+text|logo\s+text|exact\s+text)$/i,
  ]
  const match = brandTextPatterns
    .map((pattern) => trimmedInput.match(pattern)?.[1]?.trim())
    .find(Boolean)

  if (!match) return null
  return match
    .replace(/\s+(?:and\s+)?(?:generate|run it|try it|apply it)$/i, '')
    .replace(/^["']|["']$/g, '')
    .trim()
}
