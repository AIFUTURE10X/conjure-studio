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

// Filler words that carry no meaning of their own inside a direct command,
// e.g. "use photoroom for the logo and generate it" is all connectors once
// the command phrases are stripped. Bare imperative verbs (use/set/turn) are
// safe here because the content words of a creative request always survive.
const DIRECT_COMMAND_CONNECTOR_PATTERN = /\b(please|ok|okay|yes|and|then|also|now|too|it|this|that|these|those|the|a|an|to|for|of|me|my|on|off|in|at|with|use|set|turn|logo|image|photo|picture)\b/g

/**
 * True when the message consists solely of recognized command phrases plus
 * connector words — i.e. the message IS a command ("use photoroom and 4k and
 * generate"), not a creative request that merely mentions a setting
 * ("...a passport stamped with a TM30 visa in a 4:3 ratio, 2K resolution").
 * Any leftover content means the message must reach the AI intact, so
 * unrecognized wording fails safe toward a model call, never a local shortcut.
 */
export const isBareDirectCommand = (value: string, commandPhrases: string[]) => {
  let residual = normalizeDirectCommand(value)
  for (const phrase of [...commandPhrases].sort((a, b) => b.length - a.length)) {
    residual = residual.split(phrase).join(' ')
  }
  return residual
    .replace(DIRECT_COMMAND_CONNECTOR_PATTERN, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .length === 0
}

/**
 * Detects fresh creative requests ("Now I want an image of..."), which can
 * mention follow-up vocabulary like "white background" or "critique" without
 * being follow-ups. Keeps the local single-change and latest-output shortcuts
 * away from new-scene requests so those messages reach the AI whole.
 * Deliberately not normalizeDirectCommand: that strips leading politeness
 * words, which would erase the "please add" signal at the start of a message.
 */
export const looksLikeNewCreationRequest = (value: string) => {
  const lowered = value.toLowerCase().trim()
  return /(^|\s)(i want|i need|i would like|i'd like|give me|show me|maybe you can|how about|can you add|could you add|please add|create a|create an|design a|design an|draw a|draw an|an image of|a picture of|a photo of|an illustration of)(\s|$)/.test(lowered)
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
