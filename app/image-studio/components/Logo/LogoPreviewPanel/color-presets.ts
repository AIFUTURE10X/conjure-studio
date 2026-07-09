/**
 * Logo Preview Panel Color Presets
 *
 * Color presets using CSS filters for logo color shifting.
 * Optimized for metallic/multi-colored logos.
 *
 * Uses hue-rotate, saturate, brightness, and contrast to achieve
 * better results on logos with silver/metallic surfaces.
 */

// Extended color preset with additional filter options
export interface ColorPreset {
  name: string
  hue: number
  saturate: number
  brightness?: number
  contrast?: number
  label: string
  color: string
}

// Color presets for metallic logos
// Only includes presets that work well with CSS filters on 3D/metallic logos
export const COLOR_PRESETS: ColorPreset[] = [
  // Original (no changes)
  { name: 'Original', hue: 0, saturate: 100, label: 'Original', color: '#a855f7' },

  // Black - desaturated and darkened
  { name: 'Black', hue: 0, saturate: 0, brightness: 30, contrast: 120, label: 'Black', color: '#1a1a1a' },

  // Metallic variants - use brightness/contrast instead of heavy hue
  { name: 'Silver', hue: 0, saturate: 15, brightness: 110, contrast: 95, label: 'Silver', color: '#94a3b8' },
  { name: 'Warm Gray', hue: 30, saturate: 25, brightness: 95, label: 'Warm Gray', color: '#78716c' },
  { name: 'Cool Gray', hue: 220, saturate: 20, brightness: 100, label: 'Cool Gray', color: '#64748b' },
]

// Export the type for use in other components
export type LogoFilterStyle = React.CSSProperties

/**
 * Generate CSS filter string from preset
 * Now supports brightness and contrast for better metallic results
 */
export function getFilterStyle(preset: ColorPreset): LogoFilterStyle {
  // Original - no filter
  if (preset.hue === 0 && preset.saturate === 100 && !preset.brightness && !preset.contrast) {
    return {}
  }

  const filters: string[] = []

  if (preset.hue !== 0) {
    filters.push(`hue-rotate(${preset.hue}deg)`)
  }
  if (preset.saturate !== 100) {
    filters.push(`saturate(${preset.saturate}%)`)
  }
  if (preset.brightness && preset.brightness !== 100) {
    filters.push(`brightness(${preset.brightness}%)`)
  }
  if (preset.contrast && preset.contrast !== 100) {
    filters.push(`contrast(${preset.contrast}%)`)
  }

  return {
    filter: filters.join(' '),
  }
}
