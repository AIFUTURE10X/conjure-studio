// ============================================
// STYLE SYNONYMS
// Maps various style name formats to canonical values
// ============================================

export const styleSynonyms: Record<string, string> = {
  'laika stop-motion': 'Laika',
  'laika stop motion': 'Laika',
  'sony spiderverse': 'Sony Spider-Verse',
  'sony spider verse': 'Sony Spider-Verse',
  'photo real': 'PhotoReal',
  'photoreal': 'PhotoReal',
  'photo realistic': 'PhotoReal',
  'photo-realistic': 'PhotoReal',
  'pixar style': 'Pixar',
  'studio ghibli style': 'Studio Ghibli',
  'studio trigger style': 'Studio Trigger',
  'kyoto animation style': 'Kyoto Animation',
  'cartoon style art': 'Cartoon Style',
  'cartoon-style': 'Cartoon Style',
  'anime style': 'Anime',
  '3d render style': '3D Render',
  'comic book style': 'Comic Book',
  'pencil sketch style': 'Pencil Sketch',
  'watercolor style': 'Watercolor',
}

// ============================================
// CAMERA ANGLE SYNONYMS
// Maps various camera angle name formats to canonical values
// ============================================

export const cameraAngleSynonyms: Record<string, string> = {
  'eye level': 'Eye-level shot',
  'eye-level': 'Eye-level shot',
  'eye level shot': 'Eye-level shot',
  'eyelevel shot': 'Eye-level shot',
  'eyelevel': 'Eye-level shot',
  'low angle': 'Low-angle shot',
  'low-angle': 'Low-angle shot',
  'low angle shot': 'Low-angle shot',
  'high angle': 'High-angle shot',
  'high-angle': 'High-angle shot',
  'high angle shot': 'High-angle shot',
  'birdseye': "Bird's-eye view",
  'birds eye': "Bird's-eye view",
  'bird eye': "Bird's-eye view",
  'bird-eye': "Bird's-eye view",
  'aerial': 'Aerial view',
  'over the shoulder': 'Over-the-shoulder shot',
  'over-the-shoulder': 'Over-the-shoulder shot',
  'point of view': 'Point-of-view shot',
  'pov': 'Point-of-view shot',
  'worms eye': "Worm's-eye view",
  'worm eye': "Worm's-eye view",
  'dutch': 'Dutch angle',
}

// ============================================
// CAMERA LENS SYNONYMS
// Maps various camera lens name formats to canonical values
// ============================================

export const cameraLensSynonyms: Record<string, string> = {
  '14mm': '14mm ultra-wide',
  '14 mm': '14mm ultra-wide',
  'ultra wide': '14mm ultra-wide',
  'ultra-wide': '14mm ultra-wide',
  '16mm': '16mm fisheye',
  '16 mm': '16mm fisheye',
  'fisheye': '16mm fisheye',
  '24mm': '24mm wide-angle',
  'wide angle': '24mm wide-angle',
  'wide-angle': '24mm wide-angle',
  '35mm': '35mm standard',
  'standard': '35mm standard',
  'standard lens': '35mm standard',
  '50mm': '50mm prime',
  '50 mm': '50mm prime',
  'prime': '50mm prime',
  'prime lens': '50mm prime',
  '85mm': '85mm portrait',
  'portrait': '85mm portrait',
  'portrait lens': '85mm portrait',
  'telephoto lens': '135mm telephoto',
  'telephoto': '135mm telephoto',
  '135mm': '135mm telephoto',
  '200mm': '200mm super-telephoto',
  '200 mm': '200mm super-telephoto',
  'super telephoto': '200mm super-telephoto',
  'super-telephoto': '200mm super-telephoto',
  'macro': 'Macro lens',
  'tilt-shift': '50mm prime',
  'tilt shift': '50mm prime',
}

// ============================================
// STYLE STRENGTH SYNONYMS
// Maps various style strength descriptors to canonical values
// ============================================

export type StyleStrength = 'subtle' | 'moderate' | 'strong'

export const styleStrengthSynonyms: Record<string, StyleStrength> = {
  subtle: 'subtle',
  soft: 'subtle',
  light: 'subtle',
  gentle: 'subtle',
  moderate: 'moderate',
  balanced: 'moderate',
  natural: 'moderate',
  standard: 'moderate',
  strong: 'strong',
  bold: 'strong',
  intense: 'strong',
  dramatic: 'strong',
}

// ============================================
// NORMALIZE VALUE UTILITY
// Generic function to match user input to valid options
// ============================================

export function normalizeValue(
  value: string | undefined,
  options: string[],
  synonyms: Record<string, string> = {}
): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const lower = trimmed.toLowerCase()

  // Direct match
  const direct = options.find(option => option.toLowerCase() === lower)
  if (direct) return direct

  // Synonym match
  if (synonyms[lower]) return synonyms[lower]

  // Simplified match (remove non-alphanumeric)
  const simplified = lower.replace(/[^a-z0-9]/g, '')
  const simplifiedMatch = options.find(option =>
    option.toLowerCase().replace(/[^a-z0-9]/g, '') === simplified
  )
  if (simplifiedMatch) return simplifiedMatch

  // Partial match
  const partial = options.find(option => option.toLowerCase().includes(lower))
  if (partial) return partial

  return undefined
}
