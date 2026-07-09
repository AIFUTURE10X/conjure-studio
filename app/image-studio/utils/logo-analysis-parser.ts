/**
 * Logo Analysis Parser Utility
 *
 * Parses AI analysis text to extract logo configuration settings
 */

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
  pattern: string            // Default to "none" - only set if clearly visible
  iconType: string           // More specific (e.g., "genie lamp", "crown")
  presetMatch: string
  confidence: number
  rawAnalysis: string
}

// Industry detection patterns
const INDUSTRY_PATTERNS: Array<{ keywords: string[]; industry: string }> = [
  { keywords: ['tech', 'digital', 'circuit', 'software', 'data', 'ai', 'neural', 'code'], industry: 'tech' },
  { keywords: ['luxury', 'premium', 'elegant', 'diamond', 'crown', 'jewel'], industry: 'luxury' },
  { keywords: ['nature', 'eco', 'organic', 'leaf', 'green', 'environmental', 'plant'], industry: 'nature' },
  { keywords: ['food', 'restaurant', 'coffee', 'cafe', 'culinary', 'kitchen', 'chef'], industry: 'food' },
  { keywords: ['finance', 'bank', 'investment', 'money', 'growth', 'shield', 'trust'], industry: 'finance' },
  { keywords: ['creative', 'art', 'design', 'studio', 'camera', 'brush', 'palette'], industry: 'creative' },
  { keywords: ['sport', 'fitness', 'athletic', 'gym', 'energy', 'motion'], industry: 'sports' },
  { keywords: ['real estate', 'property', 'house', 'home', 'building', 'key', 'realty'], industry: 'realestate' },
  { keywords: ['corporate', 'business', 'professional', 'enterprise'], industry: 'corporate' },
]

// Style detection patterns
const STYLE_PATTERNS: Array<{ keywords: string[]; style: string }> = [
  { keywords: ['elegant', 'sophisticated', 'refined', 'luxurious', 'premium'], style: 'elegant' },
  { keywords: ['bold', 'powerful', 'strong', 'impactful', 'heavy'], style: 'bold' },
  { keywords: ['playful', 'fun', 'whimsical', 'colorful', 'creative'], style: 'playful' },
  { keywords: ['organic', 'natural', 'flowing', 'hand-drawn', 'earthy'], style: 'organic' },
  { keywords: ['modern', 'clean', 'minimal', 'contemporary', 'geometric', 'sleek'], style: 'modern' },
]

// Color detection patterns
const COLOR_PATTERNS: Record<string, string> = {
  'blue': 'blue', 'navy': 'blue', 'azure': 'blue', 'cobalt': 'blue',
  'cyan': 'cyan', 'teal': 'cyan', 'turquoise': 'cyan', 'aqua': 'cyan',
  'purple': 'purple', 'violet': 'purple', 'magenta': 'purple', 'lavender': 'purple',
  'gold': 'gold', 'yellow': 'gold', 'amber': 'gold', 'golden': 'gold',
  'green': 'green', 'emerald': 'green', 'lime': 'green', 'forest': 'green',
  'red': 'red', 'crimson': 'red', 'scarlet': 'red', 'ruby': 'red',
  'pink': 'pink', 'rose': 'pink', 'coral': 'pink', 'salmon': 'pink',
  'orange': 'orange', 'tangerine': 'orange', 'peach': 'orange',
  'black': 'black', 'dark': 'black', 'charcoal': 'black',
  'silver': 'silver', 'gray': 'silver', 'grey': 'silver', 'chrome': 'silver',
  'white': 'white', 'cream': 'white', 'ivory': 'white',
}

// Font style patterns
const FONT_PATTERNS: Record<string, string> = {
  'sans-serif-bold': 'sans-serif-bold',
  'serif-elegant': 'serif-elegant',
  'modern-geometric': 'modern-geometric',
  'tech-digital': 'tech-digital',
  'rounded-friendly': 'rounded-friendly',
  'handwritten': 'handwritten-casual',
}

// Preset IDs for matching
const PRESET_IDS = [
  'tech-circuit', 'tech-ai', 'tech-cube',
  'luxury-crown', 'luxury-diamond',
  'nature-leaf',
  'food-restaurant', 'food-coffee',
  'finance-growth', 'finance-shield',
  'creative-studio', 'creative-camera',
  'sports-fitness',
  'real-estate-house', 'real-estate-key',
  'corporate-dotmatrix', 'corporate-swoosh', 'corporate-globe'
]

function detectIndustry(lowerText: string): string {
  let maxMatches = 0
  let result = 'tech'
  for (const { keywords, industry } of INDUSTRY_PATTERNS) {
    const matches = keywords.filter(k => lowerText.includes(k)).length
    if (matches > maxMatches) {
      maxMatches = matches
      result = industry
    }
  }
  return result
}

function detectStyle(lowerText: string): string {
  let maxMatches = 0
  let result = 'modern'
  for (const { keywords, style } of STYLE_PATTERNS) {
    const matches = keywords.filter(k => lowerText.includes(k)).length
    if (matches > maxMatches) {
      maxMatches = matches
      result = style
    }
  }
  return result
}

function detectColors(lowerText: string): string[] {
  const colors: string[] = []
  for (const [keyword, colorId] of Object.entries(COLOR_PATTERNS)) {
    if (lowerText.includes(keyword) && !colors.includes(colorId)) {
      colors.push(colorId)
    }
  }
  if (colors.length === 0) colors.push('blue')
  return colors.slice(0, 3) // Max 3 colors
}

function detectDepth(lowerText: string): string {
  if (lowerText.includes('[flat]') || (lowerText.includes('flat') && lowerText.includes('2d'))) return 'flat'
  if (lowerText.includes('[subtle]') || lowerText.includes('subtle depth') || lowerText.includes('slight')) return 'subtle'
  if (lowerText.includes('[deep]') || lowerText.includes('deep 3d') || lowerText.includes('significant depth')) return 'deep'
  if (lowerText.includes('[extreme]') || lowerText.includes('extreme') || lowerText.includes('dramatic 3d')) return 'extreme'
  if (lowerText.includes('[medium]') || lowerText.includes('medium') || lowerText.includes('moderate')) return 'medium'
  return 'medium'
}

export function parseAnalysis(text: string): AnalysisResult {
  const result: AnalysisResult = {
    // NEW fields with defaults
    brandName: '',
    initials: '',
    textArrangement: 'single-line',
    frameShape: 'none',
    frameMaterial: 'none',

    // Existing fields
    industry: 'tech',
    style: 'modern',
    colors: [],
    depth: 'medium',
    effects: [],
    metallic: 'none',
    glow: 'none',
    fontStyle: 'modern-geometric',
    fontWeight: 'bold',
    pattern: 'none',  // Default to none - only set if AI explicitly confirms pattern
    iconType: 'none',
    presetMatch: '',
    confidence: 50,
    rawAnalysis: text,
  }

  const lowerText = text.toLowerCase()

  // Try to extract JSON summary if present
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1])

      // NEW fields - text extraction
      if (parsed.brandName) result.brandName = parsed.brandName
      if (parsed.initials) result.initials = parsed.initials
      if (parsed.textArrangement) result.textArrangement = parsed.textArrangement

      // NEW fields - frame detection
      if (parsed.frameShape) result.frameShape = parsed.frameShape
      if (parsed.frameMaterial) result.frameMaterial = parsed.frameMaterial

      // Existing fields
      if (parsed.industry) result.industry = parsed.industry
      if (parsed.style) result.style = parsed.style
      if (parsed.colors && Array.isArray(parsed.colors)) result.colors = parsed.colors
      if (parsed.depth) result.depth = parsed.depth
      if (parsed.effects && Array.isArray(parsed.effects)) result.effects = parsed.effects
      if (parsed.metallic) result.metallic = parsed.metallic
      if (parsed.glow) result.glow = parsed.glow
      if (parsed.fontStyle) result.fontStyle = parsed.fontStyle
      if (parsed.fontWeight) result.fontWeight = parsed.fontWeight

      // FIXED: Only set pattern if AI explicitly confirmed it (not "none")
      if (parsed.pattern && parsed.pattern.toLowerCase() !== 'none') {
        result.pattern = parsed.pattern
      }

      if (parsed.iconType) result.iconType = parsed.iconType
      if (parsed.presetMatch) result.presetMatch = parsed.presetMatch
      if (typeof parsed.confidence === 'number') result.confidence = parsed.confidence
      return result
    } catch (e) {
      // JSON parsing failed, continue with text analysis
    }
  }

  // Text-based analysis
  result.industry = detectIndustry(lowerText)
  result.style = detectStyle(lowerText)
  result.colors = detectColors(lowerText)
  result.depth = detectDepth(lowerText)

  // Detect metallic finish
  const metallicTypes = ['chrome', 'gold', 'bronze', 'rose-gold', 'platinum', 'copper', 'silver']
  for (const metal of metallicTypes) {
    if (lowerText.includes(metal)) {
      result.metallic = metal === 'silver' ? 'chrome' : metal
      result.effects.push('metallic')
      break
    }
  }

  // Detect glow effects
  const glowTypes = ['neon', 'electric', 'aurora', 'soft glow']
  for (const glow of glowTypes) {
    if (lowerText.includes(glow)) {
      result.glow = glow === 'soft glow' ? 'soft' : glow.split(' ')[0]
      result.effects.push('glow')
      break
    }
  }

  // Detect font style
  for (const [keyword, fontStyle] of Object.entries(FONT_PATTERNS)) {
    if (lowerText.includes(keyword)) {
      result.fontStyle = fontStyle
      break
    }
  }

  // Detect font weight
  if (lowerText.includes('extra-bold') || lowerText.includes('extra bold') || lowerText.includes('heavy')) {
    result.fontWeight = 'extra-bold'
  } else if (lowerText.includes('bold')) {
    result.fontWeight = 'bold'
  } else if (lowerText.includes('light') || lowerText.includes('thin')) {
    result.fontWeight = 'light'
  } else if (lowerText.includes('regular') || lowerText.includes('normal')) {
    result.fontWeight = 'regular'
  }

  // Detect pattern - FIXED: Much stricter to avoid false positives
  // Only detect patterns if explicitly stated as present (not just mentioned)
  // Look for positive indicators like "pattern visible", "has pattern", "contains dots"
  const patternIndicators = [
    { pattern: 'dot-matrix', checks: ['dot matrix pattern: yes', 'dot matrix visible', 'has dot matrix', 'contains dots'] },
    { pattern: 'circuit', checks: ['circuit pattern visible', 'has circuit pattern', 'circuit board pattern'] },
    { pattern: 'neural', checks: ['neural pattern visible', 'has neural pattern'] },
    { pattern: 'grid', checks: ['grid pattern visible', 'has grid pattern'] },
    { pattern: 'hexagon', checks: ['hexagon pattern visible', 'has hexagon pattern'] },
    { pattern: 'halftone', checks: ['halftone pattern visible', 'has halftone'] },
    { pattern: 'radial', checks: ['radial pattern visible', 'has radial pattern'] },
  ]

  // Only set pattern if we find a POSITIVE indicator (not just the word mentioned)
  for (const { pattern, checks } of patternIndicators) {
    if (checks.some(check => lowerText.includes(check))) {
      result.pattern = pattern
      break
    }
  }
  // If no positive indicator found, pattern stays as 'none' (the default)

  // Detect preset match
  for (const presetId of PRESET_IDS) {
    if (lowerText.includes(presetId)) {
      result.presetMatch = presetId
      break
    }
  }

  // Detect confidence
  const confidenceMatch = lowerText.match(/confidence[:\s]+(\d+)/)
  if (confidenceMatch) {
    result.confidence = Math.min(100, Math.max(0, parseInt(confidenceMatch[1], 10)))
  }

  // Additional effects
  if (lowerText.includes('gradient')) result.effects.push('gradient')
  if (lowerText.includes('shadow')) result.effects.push('shadow')
  if (lowerText.includes('sparkle')) result.effects.push('sparkle')
  if (lowerText.includes('bevel')) result.effects.push('bevel')

  result.effects = [...new Set(result.effects)]

  return result
}
