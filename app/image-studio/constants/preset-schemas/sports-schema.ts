/**
 * Sports Schema - Sports/Fitness category specific settings
 *
 * Used by presets: sports-fitness
 */

import { BaseLogoConfig, DEFAULT_BASE_CONFIG, TabDefinition, BASE_TABS } from './base-schema'
import { ColorOption } from '../dot-matrix-config'

// ============================================
// SPORTS-SPECIFIC TYPES
// ============================================

export type SportsType = 'gym' | 'team' | 'athletic' | 'martial-arts' | 'outdoor' | 'esports'
export type EnergyLevel = 'calm' | 'moderate' | 'energetic' | 'explosive' | 'extreme'
export type MotionEffect = 'none' | 'speed-lines' | 'swoosh' | 'burst' | 'trail' | 'impact'
export type SportsElement = 'none' | 'dumbbell' | 'trophy' | 'medal' | 'flame' | 'lightning' | 'wings'
export type MuscleStyle = 'none' | 'subtle' | 'athletic' | 'bodybuilder' | 'silhouette'

// ============================================
// SPORTS CONFIG INTERFACE
// ============================================

export interface SportsLogoConfig extends BaseLogoConfig {
  // Sports-specific settings
  sportsType: SportsType
  energyLevel: EnergyLevel
  motionEffect: MotionEffect
  sportsElement: SportsElement
  muscleStyle: MuscleStyle
  primarySportsColor: ColorOption
  secondarySportsColor: ColorOption
  hasFlameEffect: boolean
  hasWingsElement: boolean
  showChampionStyle: boolean
  isTeamLogo: boolean
}

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_SPORTS_CONFIG: SportsLogoConfig = {
  ...DEFAULT_BASE_CONFIG,

  // Override base defaults for sports style
  textColor: { name: 'White', value: 'white', hex: '#FFFFFF' },
  accentColor: { name: 'Red', value: 'red', hex: '#EF4444' },
  fontStyle: 'display-bold',
  backgroundColor: 'black',
  depthLevel: 'medium',
  textWeight: 'extra-bold',

  // Sports-specific defaults
  sportsType: 'gym',
  energyLevel: 'energetic',
  motionEffect: 'none',
  sportsElement: 'none',
  muscleStyle: 'none',
  primarySportsColor: { name: 'Red', value: 'red', hex: '#EF4444' },
  secondarySportsColor: { name: 'Black', value: 'black', hex: '#000000' },
  hasFlameEffect: false,
  hasWingsElement: false,
  showChampionStyle: false,
  isTeamLogo: false,
}

// ============================================
// SPORTS-SPECIFIC OPTIONS
// ============================================

export const SPORTS_TYPE_OPTIONS: Array<{ value: SportsType; label: string; emoji: string; description: string }> = [
  { value: 'gym', label: 'Gym/Fitness', emoji: '💪', description: 'Fitness center' },
  { value: 'team', label: 'Team Sports', emoji: '⚽', description: 'Sports team' },
  { value: 'athletic', label: 'Athletic Club', emoji: '🏃', description: 'Athletic organization' },
  { value: 'martial-arts', label: 'Martial Arts', emoji: '🥋', description: 'Combat sports' },
  { value: 'outdoor', label: 'Outdoor Sports', emoji: '🏔️', description: 'Adventure/outdoor' },
  { value: 'esports', label: 'Esports', emoji: '🎮', description: 'Gaming/esports' },
]

export const ENERGY_LEVEL_OPTIONS: Array<{ value: EnergyLevel; label: string; description: string }> = [
  { value: 'calm', label: 'Calm', description: 'Peaceful, zen' },
  { value: 'moderate', label: 'Moderate', description: 'Balanced energy' },
  { value: 'energetic', label: 'Energetic', description: 'Dynamic, active' },
  { value: 'explosive', label: 'Explosive', description: 'High intensity' },
  { value: 'extreme', label: 'Extreme', description: 'Maximum power' },
]

export const MOTION_EFFECT_OPTIONS: Array<{ value: MotionEffect; label: string; description: string }> = [
  { value: 'none', label: 'None', description: 'Static design' },
  { value: 'speed-lines', label: 'Speed Lines', description: 'Motion blur lines' },
  { value: 'swoosh', label: 'Swoosh', description: 'Dynamic arc' },
  { value: 'burst', label: 'Burst', description: 'Explosive burst' },
  { value: 'trail', label: 'Trail', description: 'Movement trail' },
  { value: 'impact', label: 'Impact', description: 'Collision effect' },
]

export const SPORTS_ELEMENT_OPTIONS: Array<{ value: SportsElement; label: string; emoji: string }> = [
  { value: 'none', label: 'None', emoji: '—' },
  { value: 'dumbbell', label: 'Dumbbell', emoji: '🏋️' },
  { value: 'trophy', label: 'Trophy', emoji: '🏆' },
  { value: 'medal', label: 'Medal', emoji: '🥇' },
  { value: 'flame', label: 'Flame', emoji: '🔥' },
  { value: 'lightning', label: 'Lightning', emoji: '⚡' },
  { value: 'wings', label: 'Wings', emoji: '🦅' },
]

export const MUSCLE_STYLE_OPTIONS: Array<{ value: MuscleStyle; label: string; description: string }> = [
  { value: 'none', label: 'None', description: 'No muscular element' },
  { value: 'subtle', label: 'Subtle', description: 'Hint of strength' },
  { value: 'athletic', label: 'Athletic', description: 'Fit, toned' },
  { value: 'bodybuilder', label: 'Bodybuilder', description: 'Powerful, muscular' },
  { value: 'silhouette', label: 'Silhouette', description: 'Athletic silhouette' },
]

export const SPORTS_COLORS: ColorOption[] = [
  { name: 'Power Red', value: 'red', hex: '#EF4444' },
  { name: 'Energy Orange', value: 'orange', hex: '#F97316' },
  { name: 'Victory Gold', value: 'gold', hex: '#EAB308' },
  { name: 'Electric Blue', value: 'blue', hex: '#3B82F6' },
  { name: 'Fierce Black', value: 'black', hex: '#000000' },
  { name: 'Pure White', value: 'white', hex: '#FFFFFF' },
  { name: 'Neon Green', value: 'neon-green', hex: '#22C55E' },
  { name: 'Purple Power', value: 'purple', hex: '#8B5CF6' },
]

// ============================================
// SPORTS TAB DEFINITION
// ============================================

export const SPORTS_CATEGORY_TAB: TabDefinition = {
  id: 'sports-energy',
  label: 'Sports',
  icon: 'Dumbbell',
  component: 'SportsEnergyTab',
}

export const SPORTS_TABS: TabDefinition[] = [
  BASE_TABS[0], // Brand
  SPORTS_CATEGORY_TAB, // Sports Energy (category-specific)
  BASE_TABS[1], // Colors
  BASE_TABS[2], // Fonts
  BASE_TABS[3], // Icons
  BASE_TABS[4], // 3D/FX
  BASE_TABS[5], // Advanced
]

// ============================================
// PROMPT BUILDER HELPERS
// ============================================

export function buildSportsPromptSegment(config: SportsLogoConfig): string {
  const segments: string[] = []

  // Sports type
  const typeMap: Record<SportsType, string> = {
    'gym': 'fitness gym',
    'team': 'sports team',
    'athletic': 'athletic club',
    'martial-arts': 'martial arts',
    'outdoor': 'outdoor adventure sports',
    'esports': 'esports gaming',
  }
  segments.push(config.isTeamLogo ? `${typeMap[config.sportsType]} team logo` : `${typeMap[config.sportsType]} brand`)

  // Energy level
  const energyMap: Record<EnergyLevel, string> = {
    'calm': 'calm zen-like',
    'moderate': 'balanced',
    'energetic': 'dynamic energetic',
    'explosive': 'explosive high-intensity',
    'extreme': 'extreme powerful',
  }
  segments.push(`${energyMap[config.energyLevel]} design`)

  // Motion effect
  if (config.motionEffect !== 'none') {
    const motionMap: Record<MotionEffect, string> = {
      'none': '',
      'speed-lines': 'with speed line motion blur',
      'swoosh': 'with dynamic swoosh arc',
      'burst': 'with explosive burst effect',
      'trail': 'with movement trail',
      'impact': 'with impact collision effect',
    }
    segments.push(motionMap[config.motionEffect])
  }

  // Sports element
  if (config.sportsElement !== 'none') {
    const elementMap: Record<SportsElement, string> = {
      'none': '',
      'dumbbell': 'dumbbell/weight icon',
      'trophy': 'championship trophy',
      'medal': 'victory medal',
      'flame': 'fire flame element',
      'lightning': 'lightning bolt',
      'wings': 'eagle wings',
    }
    segments.push(`with ${elementMap[config.sportsElement]}`)
  }

  // Muscle style
  if (config.muscleStyle !== 'none') {
    const muscleMap: Record<MuscleStyle, string> = {
      'none': '',
      'subtle': 'subtle strength element',
      'athletic': 'athletic figure',
      'bodybuilder': 'powerful muscular figure',
      'silhouette': 'athletic silhouette',
    }
    segments.push(`featuring ${muscleMap[config.muscleStyle]}`)
  }

  // Flame effect
  if (config.hasFlameEffect) {
    segments.push('with fiery flame accents')
  }

  // Wings
  if (config.hasWingsElement) {
    segments.push('with powerful wings')
  }

  // Champion style
  if (config.showChampionStyle) {
    segments.push('championship winner aesthetic')
  }

  return segments.filter(Boolean).join(', ')
}
