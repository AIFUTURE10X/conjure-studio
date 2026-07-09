/**
 * Logo Prompt Helpers
 * Utility functions for processing logo generation prompts
 */

/**
 * Check if a prompt indicates text-only logo (no icons/symbols)
 */
export function isTextOnlyLogo(prompt: string): boolean {
  const promptLower = prompt.toLowerCase()
  return promptLower.includes('text only') ||
    promptLower.includes('text logo') ||
    promptLower.includes('no icon') ||
    promptLower.includes('no image') ||
    promptLower.includes('no symbol') ||
    promptLower.includes('just text') ||
    promptLower.includes('typography only') ||
    promptLower.includes('wordmark')
}

/**
 * Build negative prompt for text-only logos
 */
export function buildTextOnlyNegativePrompt(existingNegative: string): string {
  const textOnlyNegatives = 'icon, symbol, mascot, illustration, graphic, image, picture, clipart, drawing, cartoon, animal, object, shape, emblem, badge, crest'
  return existingNegative
    ? `${existingNegative}, ${textOnlyNegatives}`
    : textOnlyNegatives
}

/**
 * Default replication prompt for reference-based logos
 */
export const REPLICATION_PROMPT = 'Create an EXACT pixel-perfect replica of this logo. Copy EVERYTHING precisely: exact font/typeface, exact colors and gradients, exact spacing and positioning, exact proportions, exact effects (shadows, 3D, metallic, etc.). Do not interpret or reimagine - DUPLICATE exactly as shown. Match the exact text content, letter shapes, and visual treatment. This must be indistinguishable from the original.'

/**
 * Default inspire prompt for reference-based logos
 */
export const INSPIRE_PROMPT = 'Use the reference logo as the main style guide. Preserve its typography style, letterforms, stroke weight, spacing, alignment, palette, and overall layout while applying only the requested changes.'
