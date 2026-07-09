/**
 * Tech Schema - Technology category specific settings
 *
 * Used by presets: tech-circuit, tech-ai, tech-cube
 */

import { BaseLogoConfig, DEFAULT_BASE_CONFIG, TabDefinition, BASE_TABS } from './base-schema'
import { ColorOption } from '../dot-matrix-config'

// ============================================
// TECH-SPECIFIC TYPES
// ============================================

export type CircuitDensity = 'sparse' | 'normal' | 'dense' | 'complex'
export type DigitalEffect = 'none' | 'scan-lines' | 'hologram' | 'matrix' | 'binary' | 'glitch'
export type TechPattern = 'circuit' | 'neural' | 'grid' | 'hexagon' | 'nodes' | 'data-flow'
export type DataVisualization = 'none' | 'particles' | 'connections' | 'flow' | 'pulse'
export type TechGlowStyle = 'none' | 'soft' | 'neon' | 'electric' | 'plasma'

// ============================================
// TECH CONFIG INTERFACE
// ============================================

export interface TechLogoConfig extends BaseLogoConfig {
  // Tech-specific settings
  circuitDensity: CircuitDensity
  glowColor: ColorOption
  digitalEffect: DigitalEffect
  techPattern: TechPattern
  dataVisualization: DataVisualization
  techGlowStyle: TechGlowStyle
  hasHolographicEffect: boolean
  codeElements: boolean // Show </> or { } symbols
}

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_TECH_CONFIG: TechLogoConfig = {
  ...DEFAULT_BASE_CONFIG,

  // Override base defaults for tech style
  textColor: { name: 'Silver', value: 'silver', hex: '#E5E7EB' },
  accentColor: { name: 'Cyan', value: 'cyan', hex: '#06B6D4' },
  fontStyle: 'modern-geometric',
  backgroundColor: 'black',

  // Tech-specific defaults
  circuitDensity: 'normal',
  glowColor: { name: 'Cyan', value: 'cyan', hex: '#06B6D4' },
  digitalEffect: 'none',
  techPattern: 'circuit',
  dataVisualization: 'none',
  techGlowStyle: 'neon',
  hasHolographicEffect: false,
  codeElements: false,
}

// ============================================
// TECH-SPECIFIC OPTIONS
// ============================================

export const CIRCUIT_DENSITY_OPTIONS: Array<{ value: CircuitDensity; label: string; description: string }> = [
  { value: 'sparse', label: 'Sparse', description: 'Minimal circuit lines' },
  { value: 'normal', label: 'Normal', description: 'Balanced circuit pattern' },
  { value: 'dense', label: 'Dense', description: 'Detailed circuit board' },
  { value: 'complex', label: 'Complex', description: 'Intricate chip design' },
]

export const DIGITAL_EFFECT_OPTIONS: Array<{ value: DigitalEffect; label: string; description: string }> = [
  { value: 'none', label: 'None', description: 'No digital effect' },
  { value: 'scan-lines', label: 'Scan Lines', description: 'CRT monitor effect' },
  { value: 'hologram', label: 'Hologram', description: 'Holographic projection' },
  { value: 'matrix', label: 'Matrix', description: 'Digital rain effect' },
  { value: 'binary', label: 'Binary', description: '0s and 1s pattern' },
  { value: 'glitch', label: 'Glitch', description: 'Digital glitch art' },
]

export const TECH_PATTERN_OPTIONS: Array<{ value: TechPattern; label: string; description: string }> = [
  { value: 'circuit', label: 'Circuit Board', description: 'PCB trace lines' },
  { value: 'neural', label: 'Neural Network', description: 'AI brain connections' },
  { value: 'grid', label: 'Grid', description: 'Digital grid pattern' },
  { value: 'hexagon', label: 'Hexagon', description: 'Tech honeycomb' },
  { value: 'nodes', label: 'Nodes', description: 'Connected data points' },
  { value: 'data-flow', label: 'Data Flow', description: 'Streaming data lines' },
]

export const DATA_VIZ_OPTIONS: Array<{ value: DataVisualization; label: string; description: string }> = [
  { value: 'none', label: 'None', description: 'No data visualization' },
  { value: 'particles', label: 'Particles', description: 'Floating data particles' },
  { value: 'connections', label: 'Connections', description: 'Network connections' },
  { value: 'flow', label: 'Flow', description: 'Data stream flow' },
  { value: 'pulse', label: 'Pulse', description: 'Pulsing energy' },
]

export const TECH_GLOW_OPTIONS: Array<{ value: TechGlowStyle; label: string; hex: string }> = [
  { value: 'none', label: 'None', hex: 'transparent' },
  { value: 'soft', label: 'Soft Glow', hex: '#06B6D4' },
  { value: 'neon', label: 'Neon', hex: '#22D3EE' },
  { value: 'electric', label: 'Electric', hex: '#3B82F6' },
  { value: 'plasma', label: 'Plasma', hex: '#A855F7' },
]

export const TECH_GLOW_COLORS: ColorOption[] = [
  { name: 'Cyan', value: 'cyan', hex: '#06B6D4' },
  { name: 'Blue', value: 'blue', hex: '#3B82F6' },
  { name: 'Purple', value: 'purple', hex: '#8B5CF6' },
  { name: 'Green', value: 'green', hex: '#22C55E' },
  { name: 'Pink', value: 'pink', hex: '#EC4899' },
  { name: 'Orange', value: 'orange', hex: '#F97316' },
]

// ============================================
// TECH TAB DEFINITION
// ============================================

export const TECH_CATEGORY_TAB: TabDefinition = {
  id: 'tech-elements',
  label: 'Tech',
  icon: 'Cpu',
  component: 'TechElementsTab',
}

export const TECH_TABS: TabDefinition[] = [
  BASE_TABS[0], // Brand
  TECH_CATEGORY_TAB, // Tech Elements (category-specific)
  BASE_TABS[1], // Colors
  BASE_TABS[2], // Fonts
  BASE_TABS[3], // Icons
  BASE_TABS[4], // 3D/FX
  BASE_TABS[5], // Advanced
]

// ============================================
// PROMPT BUILDER HELPERS
// ============================================

export function buildTechPromptSegment(config: TechLogoConfig): string {
  const segments: string[] = []

  // Circuit/pattern
  if (config.techPattern !== 'circuit') {
    segments.push(`${config.techPattern} pattern design`)
  }
  if (config.circuitDensity !== 'normal') {
    segments.push(`${config.circuitDensity} circuit board elements`)
  }

  // Digital effects
  if (config.digitalEffect !== 'none') {
    const effectMap: Record<DigitalEffect, string> = {
      'none': '',
      'scan-lines': 'with subtle scan line overlay',
      'hologram': 'holographic projection effect',
      'matrix': 'digital matrix rain effect',
      'binary': 'binary code 0s and 1s pattern',
      'glitch': 'digital glitch art aesthetic',
    }
    segments.push(effectMap[config.digitalEffect])
  }

  // Glow
  if (config.techGlowStyle && config.techGlowStyle !== 'none') {
    const glowColorName = config.glowColor?.name || 'cyan'
    segments.push(`${config.techGlowStyle} ${glowColorName.toLowerCase()} glow effect`)
  }

  // Data visualization
  if (config.dataVisualization !== 'none') {
    segments.push(`${config.dataVisualization} data visualization elements`)
  }

  // Holographic
  if (config.hasHolographicEffect) {
    segments.push('holographic iridescent finish')
  }

  // Code elements
  if (config.codeElements) {
    segments.push('with code bracket symbols')
  }

  return segments.filter(Boolean).join(', ')
}
