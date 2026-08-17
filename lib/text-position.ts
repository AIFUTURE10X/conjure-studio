/**
 * lib/text-position.ts
 *
 * Shared vocabulary for "where should the wording sit relative to the artwork",
 * used by both the logo generator and the image generator.
 *
 * The values deliberately mirror `TextPosition` in the Real Font Overlay tool
 * (`app/image-studio/components/Logo/RealFontOverlay/types.ts`) so a logo
 * generated with `right` and one re-laid-out with `right` mean the same thing.
 *
 * `auto` is the default and emits no directive at all, so existing prompts and
 * saved presets generate exactly as they did before this setting existed.
 */

export const TEXT_POSITIONS = ['auto', 'below', 'above', 'left', 'right', 'center', 'none'] as const

export type TextPosition = typeof TEXT_POSITIONS[number]

export const DEFAULT_TEXT_POSITION: TextPosition = 'auto'

export const TEXT_POSITION_LABELS: Record<TextPosition, string> = {
  auto: 'Auto',
  below: 'Below artwork',
  above: 'Above artwork',
  left: 'Left of artwork',
  right: 'Right of artwork',
  center: 'Centered on artwork',
  none: 'No text',
}

export const TEXT_POSITION_HINTS: Record<TextPosition, string> = {
  auto: 'Let the model decide — same behavior as before this setting existed',
  below: 'Stacked layout: mark on top, wording underneath',
  above: 'Wording sits above the mark',
  left: 'Horizontal lockup: wording to the left of the mark',
  right: 'Horizontal lockup: wording to the right of the mark',
  center: 'Wording overlaps or sits inside the mark',
  none: 'Symbol only — no lettering at all',
}

/** Narrow arbitrary input to a known position, falling back to the default. */
export function normalizeTextPosition(input: string | null | undefined): TextPosition {
  if (!input) return DEFAULT_TEXT_POSITION
  return (TEXT_POSITIONS as readonly string[]).includes(input)
    ? (input as TextPosition)
    : DEFAULT_TEXT_POSITION
}

/**
 * The prompt directive for a position. Returns null for `auto` so callers append
 * nothing — an empty directive would still consume prompt attention.
 */
export function getTextPositionDirective(position: TextPosition): string | null {
  switch (position) {
    case 'below':
      return 'TEXT PLACEMENT: place all wording BELOW the symbol in a stacked lockup, horizontally centered, with clear breathing room between mark and text.'
    case 'above':
      return 'TEXT PLACEMENT: place all wording ABOVE the symbol in a stacked lockup, horizontally centered, with clear breathing room between text and mark.'
    case 'left':
      return 'TEXT PLACEMENT: place all wording to the LEFT of the symbol in a horizontal lockup, vertically centered against the mark, with the mark on the right.'
    case 'right':
      return 'TEXT PLACEMENT: place all wording to the RIGHT of the symbol in a horizontal lockup, vertically centered against the mark, with the mark on the left.'
    case 'center':
      return 'TEXT PLACEMENT: integrate the wording within the symbol itself, centered, so mark and text read as one unified shape.'
    case 'none':
      return 'TEXT PLACEMENT: render NO text of any kind — no brand name, tagline, letters, numbers, or lettering marks. Produce the symbol alone.'
    case 'auto':
    default:
      return null
  }
}

/**
 * Negative-prompt terms that reinforce a chosen position. Null for `auto`.
 * `none` is the strongest case: text-like marks are the common failure.
 */
export function getTextPositionNegative(position: TextPosition): string | null {
  if (position === 'auto') return null
  if (position === 'none') {
    return 'text, lettering, brand name, tagline, words, letters, numbers, watermark, signature, fake lettering'
  }
  return 'misplaced text, text in the wrong position, scattered wording, overlapping text and mark'
}

/**
 * Append the directive to a prompt. Returns the prompt unchanged for `auto`, or
 * when the directive is already present (so repeated refinements do not stack).
 */
export function applyTextPositionToPrompt(prompt: string, position: TextPosition): string {
  const directive = getTextPositionDirective(position)
  if (!directive) return prompt
  const base = prompt?.trim() ?? ''
  if (base.includes(directive)) return base
  return base ? `${base}\n\n${directive}` : directive
}
