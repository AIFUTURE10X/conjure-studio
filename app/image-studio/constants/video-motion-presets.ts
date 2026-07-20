/**
 * Camera-motion presets for the video generator. Each chip appends its
 * phrase to the motion prompt; phrasing is natural language that works
 * across Seedance, Kling, and Veo (none of our models need bracket syntax).
 */

export interface MotionPreset {
  id: string
  label: string
  phrase: string
  /** Exclusive presets clear all others when selected (e.g. Static). */
  exclusive?: boolean
}

export const MOTION_PRESETS: MotionPreset[] = [
  { id: 'push-in', label: 'Push In', phrase: 'slow cinematic camera push-in toward the subject' },
  { id: 'pull-back', label: 'Pull Back', phrase: 'camera slowly pulls back, revealing more of the scene' },
  { id: 'orbit', label: 'Orbit', phrase: 'camera orbits smoothly around the subject' },
  { id: 'crane-up', label: 'Crane Up', phrase: 'camera cranes upward, rising above the scene' },
  { id: 'crane-down', label: 'Crane Down', phrase: 'camera descends slowly from above toward the subject' },
  { id: 'crash-zoom', label: 'Crash Zoom', phrase: 'sudden dramatic crash zoom toward the subject' },
  { id: 'tracking', label: 'Tracking', phrase: 'smooth tracking shot following the subject' },
  { id: 'fpv', label: 'FPV Drone', phrase: 'dynamic FPV drone shot flying through the scene' },
  { id: 'handheld', label: 'Handheld', phrase: 'handheld documentary-style camera with subtle natural shake' },
  { id: 'whip-pan', label: 'Whip Pan', phrase: 'fast whip pan across the scene' },
  { id: 'tilt-up', label: 'Tilt Up', phrase: 'camera tilts upward to reveal the subject' },
  { id: 'static', label: 'Static', phrase: 'locked-off static camera, no camera movement', exclusive: true },
]

const SEPARATOR = ', '

export function appendMotionPhrase(prompt: string, phrase: string): string {
  const trimmed = prompt.trim()
  if (!trimmed) return phrase
  const needsSeparator = !/[,;.!?]$/.test(trimmed)
  return `${trimmed}${needsSeparator ? SEPARATOR : ' '}${phrase}`
}

export function removeMotionPhrase(prompt: string, phrase: string): string {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return prompt
    .replace(new RegExp(`(?:[,;]\\s*)?${escaped}`, 'i'), '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[,;\s]+/, '')
    .trim()
}
