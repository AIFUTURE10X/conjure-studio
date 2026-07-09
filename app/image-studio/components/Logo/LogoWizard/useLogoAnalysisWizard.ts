/**
 * useLogoAnalysisWizard Hook
 *
 * Maps AI logo analysis results to wizard answers and configuration settings
 */

import { WizardAnswers } from './questions/questionnaire-data'
import {
  INDUSTRY_MAP,
  STYLE_MAP,
  DEPTH_MAP,
  COLOR_HEX_MAP,
  STYLE_TO_FONT_MAP,
  STYLE_TO_WEIGHT_MAP,
  DEPTH_LEVEL_MAP,
  PATTERN_MAP,
  INDUSTRY_TO_ICON_MAP,
  INDUSTRY_PRESETS,
  STYLE_BONUS_PRESETS,
  PATTERN_PRESETS,
  DEFAULT_PRESETS,
} from '../../../constants/logo-analysis-mappings'

export interface AnalysisResult {
  // NEW: Text extraction fields
  brandName: string          // Extracted text from logo (e.g., "PROMPTS GENIE")
  initials: string           // Initials if detectable (e.g., "PG")
  textArrangement: string    // single-line/stacked/circular/curved/arc

  // NEW: Frame detection fields
  frameShape: string         // circle/oval/rectangle/shield/badge/none
  frameMaterial: string      // chrome/gold/bronze/silver/plain/none

  // Existing fields
  industry: string
  style: string
  colors: string[]
  depth: string
  effects: string[]
  metallic: string
  glow: string
  fontStyle: string
  fontWeight: string
  pattern: string
  iconType: string
  presetMatch: string
  confidence: number
  rawAnalysis: string
}

/**
 * Map analysis results to wizard answers format
 */
export function mapAnalysisToWizardAnswers(
  analysis: AnalysisResult,
  brandName: string
): WizardAnswers {
  const answers: WizardAnswers = {}

  // Map industry
  const industryKey = analysis.industry.toLowerCase()
  answers.industry = INDUSTRY_MAP[industryKey] || 'tech'

  // Map style
  const styleKey = analysis.style.toLowerCase()
  answers.style = STYLE_MAP[styleKey] || 'modern'

  // Map colors (multi-select, max 3)
  const colorIds = analysis.colors
    .map(c => c.toLowerCase())
    .filter(c => COLOR_HEX_MAP[c])
    .slice(0, 3)
  answers.colors = colorIds.length > 0 ? colorIds : ['blue']

  // Map depth
  const depthKey = analysis.depth.toLowerCase()
  answers.depth = DEPTH_MAP[depthKey] || 'medium'

  // Default icon preference based on industry, but use detected icon if available
  if (analysis.iconType && analysis.iconType !== 'none') {
    answers.icon = analysis.iconType
  } else {
    answers.icon = INDUSTRY_TO_ICON_MAP[answers.industry as string] || 'none'
  }

  // Brand name - use extracted name from analysis if available, fallback to user input
  answers.brandName = analysis.brandName || brandName

  return answers
}

/**
 * Map analysis results to partial logo config
 */
export function mapAnalysisToConfig(
  analysis: AnalysisResult,
  brandName: string
): Record<string, any> {
  const config: Record<string, any> = {
    // Use extracted brand name from analysis if available
    brandName: analysis.brandName || brandName,
  }

  // NEW: Map frame shape to swoosh style
  if (analysis.frameShape && analysis.frameShape !== 'none') {
    // Map frame shapes to swoosh/decorative styles
    const frameToSwoosh: Record<string, string> = {
      'circle': 'circular',
      'oval': 'circular',
      'rectangle': 'none',
      'shield': 'dynamic',
      'badge': 'circular',
      'hexagon': 'dynamic',
      'ribbon': 'ribbon',
    }
    config.swooshStyle = frameToSwoosh[analysis.frameShape] || 'circular'
  }

  // NEW: Map frame material to metallic finish (if not already set by metallic analysis)
  if (analysis.frameMaterial && analysis.frameMaterial !== 'none' && analysis.frameMaterial !== 'plain') {
    // Frame material can also indicate metallic finish
    if (!analysis.metallic || analysis.metallic === 'none') {
      config.metallicFinish = analysis.frameMaterial
    }
  }

  // Map depth level
  const depthKey = analysis.depth.toLowerCase()
  config.depthLevel = DEPTH_LEVEL_MAP[depthKey] || 'medium'

  // Map primary color
  const primaryColor = analysis.colors[0]?.toLowerCase()
  if (primaryColor && COLOR_HEX_MAP[primaryColor]) {
    config.textColor = COLOR_HEX_MAP[primaryColor]
  }

  // Map accent color if multiple colors detected
  if (analysis.colors.length > 1) {
    const accentColor = analysis.colors[1]?.toLowerCase()
    if (accentColor && COLOR_HEX_MAP[accentColor]) {
      config.accentColor = COLOR_HEX_MAP[accentColor]
    }
  }

  // Map glow color if third color detected OR from analysis glow
  if (analysis.colors.length > 2) {
    const glowColor = analysis.colors[2]?.toLowerCase()
    if (glowColor && COLOR_HEX_MAP[glowColor]) {
      config.glowColor = COLOR_HEX_MAP[glowColor]
    }
  }

  // Map metallic finish from analysis
  if (analysis.metallic && analysis.metallic !== 'none') {
    config.metallicFinish = analysis.metallic
  } else if (analysis.effects.includes('metallic')) {
    config.metallicFinish = 'chrome'
  }

  // Map glow effect from analysis
  if (analysis.glow && analysis.glow !== 'none') {
    config.techGlowStyle = analysis.glow
    config.glowEffect = analysis.glow
  } else if (analysis.effects.includes('glow')) {
    config.techGlowStyle = 'soft'
    config.glowEffect = 'soft'
  }

  // Map font style from analysis or derive from style
  if (analysis.fontStyle && analysis.fontStyle !== 'modern-geometric') {
    config.fontStyle = analysis.fontStyle
  } else {
    const styleKey = analysis.style.toLowerCase()
    config.fontStyle = STYLE_TO_FONT_MAP[styleKey] || 'modern-geometric'
  }

  // Map text weight from analysis or derive from style
  if (analysis.fontWeight && analysis.fontWeight !== 'bold') {
    config.textWeight = analysis.fontWeight
  } else {
    const styleKey = analysis.style.toLowerCase()
    config.textWeight = STYLE_TO_WEIGHT_MAP[styleKey] || 'bold'
  }

  // Map pattern from analysis
  if (analysis.pattern && analysis.pattern !== 'none') {
    config.techPattern = PATTERN_MAP[analysis.pattern] || analysis.pattern
    config.patternStyle = PATTERN_MAP[analysis.pattern] || 'uniform'
  }

  // Map effects
  if (analysis.effects.includes('gradient')) {
    config.dotGradient = true
  }
  if (analysis.effects.includes('shadow')) {
    config.shadowStyle = 'soft-drop'
  }
  if (analysis.effects.includes('sparkle')) {
    config.sparkleIntensity = 'medium'
  }
  if (analysis.effects.includes('bevel')) {
    config.bevelStyle = 'soft'
  }

  return config
}

/**
 * Get recommended presets based on analysis
 */
export function getPresetsFromAnalysis(
  analysis: AnalysisResult
): Array<{ presetId: string; score: number }> {
  const presetScores: Record<string, number> = {}

  // If AI detected a specific preset match, give it highest priority
  if (analysis.presetMatch) {
    presetScores[analysis.presetMatch] = analysis.confidence || 80
  }

  // Score based on industry (higher base scores)
  const industryKey = analysis.industry.toLowerCase()
  const matchedPresets = INDUSTRY_PRESETS[industryKey] || ['corporate-dotmatrix', 'corporate-swoosh']

  matchedPresets.forEach((presetId, index) => {
    // Higher base score for industry match (15, 12, 9 for positions)
    presetScores[presetId] = (presetScores[presetId] || 0) + (15 - index * 3)
  })

  // Bonus score based on style
  const styleKey = analysis.style.toLowerCase()
  const stylePresets = STYLE_BONUS_PRESETS[styleKey] || []
  stylePresets.forEach((presetId, index) => {
    presetScores[presetId] = (presetScores[presetId] || 0) + (8 - index * 2)
  })

  // Bonus for effects matching preset capabilities
  if (analysis.effects.includes('metallic') || analysis.metallic !== 'none') {
    presetScores['luxury-crown'] = (presetScores['luxury-crown'] || 0) + 5
    presetScores['luxury-diamond'] = (presetScores['luxury-diamond'] || 0) + 5
    presetScores['tech-cube'] = (presetScores['tech-cube'] || 0) + 3
  }

  if (analysis.effects.includes('glow') || analysis.glow !== 'none') {
    presetScores['tech-circuit'] = (presetScores['tech-circuit'] || 0) + 5
    presetScores['tech-ai'] = (presetScores['tech-ai'] || 0) + 5
    presetScores['creative-studio'] = (presetScores['creative-studio'] || 0) + 3
  }

  if (analysis.pattern && analysis.pattern !== 'none') {
    const patternMatches = PATTERN_PRESETS[analysis.pattern] || []
    patternMatches.forEach((presetId) => {
      presetScores[presetId] = (presetScores[presetId] || 0) + 6
    })
  }

  // Bonus for color matching
  if (analysis.colors.includes('gold')) {
    presetScores['luxury-crown'] = (presetScores['luxury-crown'] || 0) + 4
    presetScores['luxury-diamond'] = (presetScores['luxury-diamond'] || 0) + 3
    presetScores['finance-growth'] = (presetScores['finance-growth'] || 0) + 2
  }
  if (analysis.colors.includes('green')) {
    presetScores['nature-leaf'] = (presetScores['nature-leaf'] || 0) + 5
    presetScores['finance-growth'] = (presetScores['finance-growth'] || 0) + 3
  }
  if (analysis.colors.includes('cyan') || analysis.colors.includes('blue')) {
    presetScores['tech-circuit'] = (presetScores['tech-circuit'] || 0) + 3
    presetScores['tech-ai'] = (presetScores['tech-ai'] || 0) + 3
  }
  if (analysis.colors.includes('purple') || analysis.colors.includes('pink')) {
    presetScores['creative-studio'] = (presetScores['creative-studio'] || 0) + 4
    presetScores['creative-camera'] = (presetScores['creative-camera'] || 0) + 3
  }

  // Ensure we have at least 4 presets with scores
  DEFAULT_PRESETS.forEach((presetId) => {
    if (!(presetId in presetScores)) {
      presetScores[presetId] = 5
    }
  })

  // Convert to sorted array and normalize scores to 0-20 range for percentage display
  const results = Object.entries(presetScores)
    .map(([presetId, score]) => ({ presetId, score: Math.min(20, score) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)

  return results
}
