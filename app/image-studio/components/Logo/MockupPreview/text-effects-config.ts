/**
 * Text Effects Configuration for T-Shirt Mockup
 * Defines text effects, types, and default values
 */

export type TextEffect = 'none' | '3d' | 'embossed' | 'floating' | 'debossed' | 'extrude' | 'solid-block'

export interface TextEffectDefinition {
  label: string
  description: string
  style: React.CSSProperties
}

// CSS text-shadow implementations for each effect
export const TEXT_EFFECTS: Record<TextEffect, TextEffectDefinition> = {
  none: {
    label: 'None',
    description: 'No effect',
    style: {}
  },
  '3d': {
    label: '3D',
    description: 'Stacked depth effect',
    style: {
      textShadow: '1px 1px 0 rgba(0,0,0,0.8), 2px 2px 0 rgba(0,0,0,0.6), 3px 3px 0 rgba(0,0,0,0.4), 4px 4px 0 rgba(0,0,0,0.2)'
    }
  },
  embossed: {
    label: 'Embossed',
    description: 'Raised appearance',
    style: {
      textShadow: '-1px -1px 1px rgba(255,255,255,0.4), 1px 1px 2px rgba(0,0,0,0.5)'
    }
  },
  floating: {
    label: 'Floating',
    description: 'Drop shadow effect',
    style: {
      textShadow: '0 4px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)'
    }
  },
  debossed: {
    label: 'Debossed',
    description: 'Pressed appearance',
    style: {
      textShadow: '1px 1px 1px rgba(255,255,255,0.25), -1px -1px 2px rgba(0,0,0,0.5)'
    }
  },
  extrude: {
    label: 'Extrude',
    description: 'Deep extruded 3D',
    style: {
      textShadow: '0 1px 0 #ccc, 0 2px 0 #c9c9c9, 0 3px 0 #bbb, 0 4px 0 #b9b9b9, 0 5px 0 #aaa, 0 6px 1px rgba(0,0,0,.1), 0 0 5px rgba(0,0,0,.1), 0 1px 3px rgba(0,0,0,.3), 0 3px 5px rgba(0,0,0,.2), 0 5px 10px rgba(0,0,0,.25)'
    }
  },
  'solid-block': {
    label: 'Solid Block',
    description: 'Bold solid 3D block',
    style: {
      textShadow: '1px 1px 0 #8B6914, 2px 2px 0 #8B6914, 3px 3px 0 #8B6914, 4px 4px 0 #8B6914, 5px 5px 0 #8B6914, 6px 6px 0 #8B6914, 7px 7px 0 #8B6914, 8px 8px 0 #8B6914, 9px 9px 4px rgba(0,0,0,0.4)'
    }
  },
}

// Helper to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

// Helper to darken a color
function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const factor = 1 - percent / 100
  const r = Math.round(rgb.r * factor)
  const g = Math.round(rgb.g * factor)
  const b = Math.round(rgb.b * factor)
  return `rgb(${r}, ${g}, ${b})`
}

// Get dynamic text effect style using brand color for 3D/extrude effects
export function getTextEffectStyle(effect: TextEffect, brandColor: string): React.CSSProperties {
  const baseStyle = TEXT_EFFECTS[effect]?.style || {}

  // For 3D effect, use darker shades of brand color instead of black
  if (effect === '3d') {
    const c1 = darkenColor(brandColor, 20)
    const c2 = darkenColor(brandColor, 35)
    const c3 = darkenColor(brandColor, 50)
    const c4 = darkenColor(brandColor, 65)
    return {
      textShadow: `1px 1px 0 ${c1}, 2px 2px 0 ${c2}, 3px 3px 0 ${c3}, 4px 4px 0 ${c4}`
    }
  }

  // For extrude effect, use darker shades of brand color
  if (effect === 'extrude') {
    const c1 = darkenColor(brandColor, 15)
    const c2 = darkenColor(brandColor, 25)
    const c3 = darkenColor(brandColor, 35)
    const c4 = darkenColor(brandColor, 45)
    const c5 = darkenColor(brandColor, 55)
    return {
      textShadow: `0 1px 0 ${c1}, 0 2px 0 ${c2}, 0 3px 0 ${c3}, 0 4px 0 ${c4}, 0 5px 0 ${c5}, 0 6px 1px rgba(0,0,0,.1), 0 0 5px rgba(0,0,0,.1), 0 1px 3px rgba(0,0,0,.3), 0 3px 5px rgba(0,0,0,.2), 0 5px 10px rgba(0,0,0,.25)`
    }
  }

  // For solid-block effect (like SIX REVISIONS style) - diagonal solid 3D
  if (effect === 'solid-block') {
    const darkColor = darkenColor(brandColor, 45)
    // Create solid 3D with crisp shadows - one layer per pixel, same color
    const layers = []
    const depth = 8
    for (let i = 1; i <= depth; i++) {
      layers.push(`${i}px ${i}px 0 ${darkColor}`)
    }
    // Soft drop shadow at the end for grounding
    layers.push(`${depth + 2}px ${depth + 2}px 6px rgba(0,0,0,0.4)`)
    return {
      textShadow: layers.join(', ')
    }
  }

  return baseStyle
}

// Preset rotation angles for quick selection
export const ROTATION_PRESETS = [
  { value: -90, label: '-90°' },
  { value: -45, label: '-45°' },
  { value: 0, label: '0°' },
  { value: 45, label: '45°' },
  { value: 90, label: '90°' },
]

// Text item interface for multiple text lines
export interface TextItem {
  id: string
  content: string
  position: { x: number; y: number }
  scale: number        // Uniform scale (for backward compatibility / slider control)
  scaleX?: number      // Independent width scale (0.5 - 8.0)
  scaleY?: number      // Independent height scale (0.5 - 8.0)
  font: string
  color: string
  effect: TextEffect
  rotation: number
}

// Default values for new text items
export const DEFAULT_TEXT_ITEM: Omit<TextItem, 'id'> = {
  content: 'Brand Name',
  position: { x: 50, y: 78 },
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  font: 'montserrat',
  color: '#ffffff',
  effect: 'none',
  rotation: 0,
}

// Generate unique ID for new text items
export function generateTextId(): string {
  return `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Create a new text item with defaults
export function createTextItem(overrides?: Partial<Omit<TextItem, 'id'>>): TextItem {
  return {
    id: generateTextId(),
    ...DEFAULT_TEXT_ITEM,
    ...overrides,
  }
}
