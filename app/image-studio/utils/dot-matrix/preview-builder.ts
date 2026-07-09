/**
 * Dot Matrix Preview Builder
 * Builds human-readable preview summaries for UI display
 */

import { DotMatrixConfig } from '../../constants/dot-matrix-config'
import { getFontById } from '../../components/Logo/FancyFontGrid'
import { getMaterialById } from '../../components/Logo/MaterialSelector'

/**
 * Build a human-readable preview of the current configuration
 */
export function buildPromptPreview(config: DotMatrixConfig): string {
  const highlights: string[] = []

  // Material type or metallic finish
  if (config.materialType) {
    const material = getMaterialById(config.materialType as any)
    if (material) highlights.push(material.name)
  } else if (config.metallicFinish) {
    highlights.push(`${config.metallicFinish} text`)
  }

  // Fancy font
  if (config.fancyFontId) {
    const font = getFontById(config.fancyFontId)
    if (font) highlights.push(font.name)
  }

  // Dot pattern
  if (config.dotColor && config.dotSize) {
    highlights.push(`${config.dotColor.name.toLowerCase()} dots (${config.dotSize})`)
  } else if (config.dotColor) {
    highlights.push(`${config.dotColor.name.toLowerCase()} dots`)
  } else if (config.dotSize) {
    highlights.push(`${config.dotSize} dots`)
  }

  // Per-letter colors
  if (config.letterColors && config.letterColors.length > 0) {
    highlights.push(`${config.letterColors.length} colored letters`)
  }

  // Icon
  if (config.extendedIconStyle && config.extendedIconStyle !== 'none') {
    highlights.push(`icon: ${config.extendedIconStyle}`)
  }

  // Text effects
  if (config.glowEffect && config.glowEffect !== 'none') {
    highlights.push(`${config.glowEffect} glow`)
  }
  if (config.textOutline && config.textOutline !== 'none') {
    highlights.push(`${config.textOutline} outline`)
  }

  // Swoosh
  if (config.swooshStyle && config.swooshStyle !== 'none') {
    highlights.push(`${config.swooshStyle} swoosh`)
  }

  // Tilt
  if (config.tiltAngle !== 0) {
    highlights.push(`${config.tiltAngle}° tilt`)
  }

  // Background
  if (config.backgroundColor) {
    highlights.push(config.backgroundColor.replace('-', ' '))
  }

  // 3D depth
  if (config.depthAmount && config.depthAmount > 0) {
    highlights.push(`${config.depthAmount}% depth`)
  } else if (config.depthLevel && config.depthLevel !== 'flat') {
    highlights.push(`${config.depthLevel} 3D`)
  }

  return highlights.length > 0 ? highlights.join(' • ') : 'No options selected yet'
}
