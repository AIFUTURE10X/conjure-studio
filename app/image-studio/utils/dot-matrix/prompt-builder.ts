/**
 * Dot Matrix Prompt Builder - Main Orchestrator
 * Compiles DotMatrixConfig settings into an optimized prompt string
 */

import { DotMatrixConfig } from '../../constants/dot-matrix-config'
import { getMaterialById } from '../../components/Logo/MaterialSelector'
import { getIconPromptDescription } from '../../components/Logo/IconSelector'
import {
  metallicDescriptions,
  backgroundDescriptions,
  sparkleDescriptions,
  shadowDescriptions,
  lightingDescriptions,
  iconDescriptions,
} from './description-maps'
import {
  formatBrandName,
  buildDotPatternDescription,
  buildTypographyDescription,
  buildTextEffectsDescription,
  buildSwooshDescription,
  build3DDescription,
} from './section-builders'

/**
 * Build the complete dot matrix prompt from configuration
 */
export function buildDotMatrixPrompt(config: DotMatrixConfig): string {
  const parts: string[] = []

  // 1. Brand name (with text case applied)
  const displayName = formatBrandName(config)
  parts.push(`"${displayName}" corporate logo`)

  // 2. Core letter styling with metallic finish OR material type
  if (config.materialType) {
    const material = getMaterialById(config.materialType as any)
    if (material) {
      parts.push(`with elegant 3D letters featuring ${material.promptDescription}`)
    }
  } else if (config.metallicFinish) {
    parts.push(`with elegant 3D ${metallicDescriptions[config.metallicFinish]} letters`)
  } else {
    parts.push('with elegant 3D metallic letters')
  }

  // 3. Dot matrix pattern - THE KEY FEATURE
  const dotDescription = buildDotPatternDescription(config)
  if (dotDescription) parts.push(dotDescription)

  // 4. Typography details (enhanced with fancy fonts)
  const typographyDesc = buildTypographyDescription(config)
  if (typographyDesc) parts.push(typographyDesc)

  // 5. Per-letter colors
  if (config.letterColors && config.letterColors.length > 0) {
    const colorDescriptions = config.letterColors
      .map(lc => `letter ${lc.position} in ${lc.color.name.toLowerCase()}`)
      .join(', ')
    parts.push(`with individual letter coloring: ${colorDescriptions}`)
  }

  // 6. Text effects
  const textEffectsDesc = buildTextEffectsDescription(config)
  if (textEffectsDesc) parts.push(textEffectsDesc)

  // 7. Swoosh/arc element
  const swooshDesc = buildSwooshDescription(config)
  if (swooshDesc) parts.push(swooshDesc)

  // 8. Icon integration
  if (config.extendedIconStyle && config.extendedIconStyle !== 'none') {
    const iconPrompt = getIconPromptDescription(
      config.extendedIconStyle as any,
      config.iconPosition as any
    )
    if (iconPrompt) parts.push(iconPrompt)
  } else if (config.iconStyle && config.iconStyle !== 'none') {
    parts.push(iconDescriptions[config.iconStyle])
  }

  // 9. Tagline
  if (config.tagline.trim()) {
    parts.push(`Include tagline "${config.tagline.trim()}" in smaller matching typography`)
  }

  // 10. Tilt/angle
  if (config.tiltAngle !== 0) {
    const direction = config.tiltAngle > 0 ? 'clockwise' : 'counter-clockwise'
    parts.push(`Apply a ${Math.abs(config.tiltAngle)}-degree ${direction} TILT for dynamic energy`)
  }

  // 11. 3D effects
  const threeDDesc = build3DDescription(config)
  if (threeDDesc) parts.push(threeDDesc)

  // 12. Sparkle effects
  if (config.sparkleIntensity && config.sparkleIntensity !== 'none') {
    parts.push(sparkleDescriptions[config.sparkleIntensity])
  }

  // 13. Shadow
  if (config.shadowStyle && config.shadowStyle !== 'none') {
    parts.push(shadowDescriptions[config.shadowStyle])
  }

  // 14. Reflection
  if (config.hasReflection) {
    parts.push('with mirror reflection below')
  }

  // 15. Lighting
  if (config.lightingDirection) {
    parts.push(lightingDescriptions[config.lightingDirection])
  }

  // 16. Background
  if (config.backgroundColor) {
    parts.push(backgroundDescriptions[config.backgroundColor])
  }

  // 17. Professional quality tag
  parts.push('Professional premium quality corporate branding')

  return parts.filter(p => p.length > 0).join('. ')
}

/**
 * Build negative prompt to avoid unwanted elements
 */
export function buildDotMatrixNegativePrompt(config: DotMatrixConfig): string {
  const negatives = [
    'solid fill',
    'flat colors',
    'no texture',
    'simple',
    'cartoon',
    '2D flat',
    'low quality',
    'blurry',
    'amateur',
    'clip art',
    'comic style',
  ]

  if (config.depthLevel && config.depthLevel !== 'flat') {
    negatives.push('no 3D effect')
  }

  if (config.metallicFinish) {
    negatives.push('matte finish')
    negatives.push('no metallic')
  }

  if (config.swooshStyle && config.swooshStyle !== 'none') {
    negatives.push('no decorative elements')
  }

  return negatives.join(', ')
}
