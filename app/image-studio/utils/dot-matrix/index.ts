/**
 * Dot Matrix Module
 *
 * Exports all dot matrix prompt building utilities
 */

// Main prompt builders
export { buildDotMatrixPrompt, buildDotMatrixNegativePrompt } from './prompt-builder'

// Preview builder for UI
export { buildPromptPreview } from './preview-builder'

// Section builders (for advanced customization)
export {
  formatBrandName,
  buildDotPatternDescription,
  buildTypographyDescription,
  buildTextEffectsDescription,
  buildSwooshDescription,
  build3DDescription,
} from './section-builders'

// Description maps (for reference/testing)
export * from './description-maps'
