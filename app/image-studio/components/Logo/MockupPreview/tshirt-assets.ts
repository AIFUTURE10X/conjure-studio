/**
 * T-Shirt Mockup Assets
 * Color palette and configuration for interactive T-shirt mockups
 */

export interface TShirtColor {
  id: string
  name: string
  hex: string
  textColor: 'light' | 'dark'  // For brand name text
}

export const TSHIRT_COLORS: TShirtColor[] = [
  // Neutrals
  { id: 'black', name: 'Black', hex: '#1a1a1a', textColor: 'light' },
  { id: 'white', name: 'White', hex: '#ffffff', textColor: 'dark' },
  { id: 'charcoal', name: 'Charcoal', hex: '#374151', textColor: 'light' },
  { id: 'gray', name: 'Gray', hex: '#6b7280', textColor: 'light' },
  { id: 'heather', name: 'Heather Gray', hex: '#9ca3af', textColor: 'dark' },

  // Blues
  { id: 'navy', name: 'Navy', hex: '#1e3a5f', textColor: 'light' },
  { id: 'royal', name: 'Royal Blue', hex: '#2563eb', textColor: 'light' },
  { id: 'sky', name: 'Sky Blue', hex: '#38bdf8', textColor: 'dark' },

  // Reds
  { id: 'red', name: 'Red', hex: '#dc2626', textColor: 'light' },
  { id: 'burgundy', name: 'Burgundy', hex: '#7f1d1d', textColor: 'light' },
  { id: 'coral', name: 'Coral', hex: '#f87171', textColor: 'dark' },

  // Greens
  { id: 'forest', name: 'Forest Green', hex: '#166534', textColor: 'light' },
  { id: 'olive', name: 'Olive', hex: '#65a30d', textColor: 'dark' },
  { id: 'teal', name: 'Teal', hex: '#0d9488', textColor: 'light' },

  // Others
  { id: 'purple', name: 'Purple', hex: '#7c3aed', textColor: 'light' },
  { id: 'pink', name: 'Pink', hex: '#ec4899', textColor: 'light' },
  { id: 'orange', name: 'Orange', hex: '#ea580c', textColor: 'light' },
  { id: 'yellow', name: 'Yellow', hex: '#facc15', textColor: 'dark' },
]

// Default values for logo positioning
export const DEFAULT_LOGO_POSITION = { x: 200, y: 200 }
export const DEFAULT_LOGO_SIZE = { width: 120, height: 100 }

// Printable area constraints (where logo can be placed)
// Expanded for more placement freedom across the entire shirt
export const PRINTABLE_AREA = {
  minX: 80,    // Expanded to near sleeves
  maxX: 320,   // Expanded to near sleeves
  minY: 120,   // Higher up toward collar
  maxY: 380,   // Lower toward bottom
}

// Size limits for logo (expanded for larger logos)
export const LOGO_SIZE_LIMITS = {
  minWidth: 40,
  maxWidth: 250,   // Increased from 180
  minHeight: 40,
  maxHeight: 250,  // Increased from 180
}

// Stage dimensions
export const STAGE_WIDTH = 400
export const STAGE_HEIGHT = 440

// T-Shirt SVG path data for realistic shape
export const TSHIRT_PATH = "M80 100 L40 140 L70 160 L70 400 L330 400 L330 160 L360 140 L320 100 L260 100 C260 130 230 160 200 160 C170 160 140 130 140 100 Z"
export const LEFT_SLEEVE_PATH = "M80 100 L40 140 L70 160 L80 120 Z"
export const RIGHT_SLEEVE_PATH = "M320 100 L360 140 L330 160 L320 120 Z"
export const COLLAR_PATH = "M140 100 C140 130 170 160 200 160 C230 160 260 130 260 100"
