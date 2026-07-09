/**
 * Dot Matrix Section Builders
 * Helper functions for building individual prompt sections
 */

import { DotMatrixConfig } from '../../constants/dot-matrix-config'
import { getFontById } from '../../components/Logo/FancyFontGrid'
import { getDepthPromptDescription } from '../../components/Logo/DepthSlider'
import {
  getTextOutlinePrompt,
  getGlowEffectPrompt,
  getTextTexturePrompt,
  getLetterEffectPrompt,
  TextOutline,
  GlowEffect,
  TextTexture,
  LetterEffect,
} from '../../components/Logo/TextEffectsPanel'
import {
  dotSizeDescriptions,
  dotSpacingDescriptions,
  dotShapeDescriptions,
  patternStyleDescriptions,
  patternCoverageDescriptions,
  fontStyleDescriptions,
  textWeightDescriptions,
  letterSpacingDescriptions,
  swooshDescriptions,
  swooshPositionDescriptions,
  depthDescriptions,
  bevelDescriptions,
  perspectiveDescriptions,
} from './description-maps'

/**
 * Format brand name based on config settings
 */
export function formatBrandName(config: DotMatrixConfig): string {
  let name = config.brandName.trim()

  if (config.useInitials && name) {
    const words = name.split(/\s+/)
    name = words.map(w => w.charAt(0).toUpperCase()).join('')
  }

  if (!config.textCase) return name

  switch (config.textCase) {
    case 'uppercase':
      return name.toUpperCase()
    case 'lowercase':
      return name.toLowerCase()
    case 'titlecase':
      return name.split(/\s+/).map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')
    default:
      return name
  }
}

/**
 * Build dot pattern description section
 */
export function buildDotPatternDescription(config: DotMatrixConfig): string {
  const parts: string[] = ['filled with']

  if (config.dotSize) {
    parts.push(dotSizeDescriptions[config.dotSize])
  }
  if (config.dotShape) {
    parts.push(dotShapeDescriptions[config.dotShape])
  }

  parts.push('DOT MATRIX')

  if (config.patternStyle) {
    parts.push(patternStyleDescriptions[config.patternStyle])
  }

  parts.push('texture')

  if (config.dotColor) {
    parts.push(`in ${config.dotColor.name.toLowerCase()} (${config.dotColor.hex})`)
  }

  if (config.dotSpacing) {
    parts.push('with')
    parts.push(dotSpacingDescriptions[config.dotSpacing])
    parts.push('between dots')
  }

  if (config.patternCoverage) {
    parts.push(patternCoverageDescriptions[config.patternCoverage])
  }

  if (config.dotGradient) {
    parts.push('with dots gradually fading in size')
  }

  return parts.join(' ')
}

/**
 * Build typography description section
 */
export function buildTypographyDescription(config: DotMatrixConfig): string {
  const parts: string[] = []

  if (config.fancyFontId) {
    const fancyFont = getFontById(config.fancyFontId)
    if (fancyFont) {
      parts.push(fancyFont.promptDescription)
    }
  } else if (config.fontStyle) {
    parts.push(fontStyleDescriptions[config.fontStyle])
  }

  if (config.textWeight && config.textWeight !== 'regular') {
    parts.push(textWeightDescriptions[config.textWeight])
  }

  if (config.letterSpacing && config.letterSpacing !== 'normal') {
    parts.push(letterSpacingDescriptions[config.letterSpacing])
  }

  return parts.join(' ')
}

/**
 * Build text effects description section
 */
export function buildTextEffectsDescription(config: DotMatrixConfig): string {
  const parts: string[] = []

  const outlinePrompt = getTextOutlinePrompt(config.textOutline as TextOutline | null)
  if (outlinePrompt) parts.push(outlinePrompt)

  const glowPrompt = getGlowEffectPrompt(
    config.glowEffect as GlowEffect | null,
    config.glowIntensity || 50
  )
  if (glowPrompt) parts.push(glowPrompt)

  const texturePrompt = getTextTexturePrompt(config.textTexture as TextTexture | null)
  if (texturePrompt) parts.push(texturePrompt)

  const letterPrompt = getLetterEffectPrompt(config.letterEffect as LetterEffect | null)
  if (letterPrompt) parts.push(letterPrompt)

  return parts.join(', ')
}

/**
 * Build swoosh description section
 */
export function buildSwooshDescription(config: DotMatrixConfig): string {
  if (!config.swooshStyle || config.swooshStyle === 'none') return ''

  const swooshPart = swooshDescriptions[config.swooshStyle]
  const positionPart = config.swooshPosition ? swooshPositionDescriptions[config.swooshPosition] : ''

  return `Include a ${swooshPart} ${positionPart}`.trim()
}

/**
 * Build 3D effects description section
 */
export function build3DDescription(config: DotMatrixConfig): string {
  const parts: string[] = []

  if (config.depthAmount !== undefined && config.depthAmount > 0) {
    parts.push(getDepthPromptDescription(config.depthAmount))
  } else if (config.depthLevel) {
    parts.push(depthDescriptions[config.depthLevel])
  }

  if (config.bevelStyle && config.bevelStyle !== 'none') {
    parts.push(bevelDescriptions[config.bevelStyle])
  }

  if (config.perspective && config.perspective !== 'straight') {
    parts.push(perspectiveDescriptions[config.perspective])
  }

  return parts.join(' ')
}
