// ============================================
// TEXT EFFECTS OPTIONS & TYPES
// Used by TextEffectsPanel component
// ============================================

// ============================================
// TYPES
// ============================================

export type TextOutline = 'none' | 'thin' | 'medium' | 'thick' | 'double' | 'neon-glow' | 'shadow-outline'
export type GlowEffect = 'none' | 'subtle' | 'medium' | 'intense' | 'neon' | 'aura' | 'pulse' | 'rainbow'
export type TextTexture = 'smooth' | 'rough' | 'cracked' | 'distressed' | 'stippled' | 'brushed' | 'hammered'
export type LetterEffect = 'none' | 'stacked' | 'shadow-cascade' | '3d-block' | 'outline-fill' | 'gradient-fill' | 'split' | 'glitch'

// ============================================
// OPTIONS INTERFACE
// ============================================

export interface EffectOption<T> {
  id: T
  label: string
  description: string
  icon?: string
  promptDescription: string
}

// ============================================
// TEXT OUTLINE OPTIONS
// ============================================

export const TEXT_OUTLINE_OPTIONS: EffectOption<TextOutline>[] = [
  { id: 'none', label: 'None', description: 'No outline', promptDescription: '' },
  { id: 'thin', label: 'Thin', description: 'Subtle thin outline', icon: '◯', promptDescription: 'with thin outline border' },
  { id: 'medium', label: 'Medium', description: 'Visible outline', icon: '◎', promptDescription: 'with medium outline stroke' },
  { id: 'thick', label: 'Thick', description: 'Bold heavy outline', icon: '⬤', promptDescription: 'with thick bold outline' },
  { id: 'double', label: 'Double', description: 'Two-line outline', icon: '◉', promptDescription: 'with double outline border' },
  { id: 'neon-glow', label: 'Neon Glow', description: 'Glowing neon outline', icon: '💫', promptDescription: 'with glowing neon outline effect' },
  { id: 'shadow-outline', label: 'Shadow', description: 'Shadow as outline', icon: '🌑', promptDescription: 'with shadow outline effect' },
]

// ============================================
// GLOW EFFECT OPTIONS
// ============================================

export const GLOW_EFFECT_OPTIONS: EffectOption<GlowEffect>[] = [
  { id: 'none', label: 'None', description: 'No glow', promptDescription: '' },
  { id: 'subtle', label: 'Subtle', description: 'Soft ambient glow', icon: '✧', promptDescription: 'with subtle soft glow' },
  { id: 'medium', label: 'Medium', description: 'Visible glow aura', icon: '✦', promptDescription: 'with medium glow aura' },
  { id: 'intense', label: 'Intense', description: 'Strong bright glow', icon: '✴', promptDescription: 'with intense bright glow' },
  { id: 'neon', label: 'Neon', description: 'Electric neon glow', icon: '💡', promptDescription: 'with electric neon glow effect' },
  { id: 'aura', label: 'Aura', description: 'Colorful aura halo', icon: '🔮', promptDescription: 'with colorful aura halo effect' },
  { id: 'pulse', label: 'Pulse', description: 'Pulsing energy glow', icon: '💫', promptDescription: 'with pulsing energy glow' },
  { id: 'rainbow', label: 'Rainbow', description: 'Multi-color glow', icon: '🌈', promptDescription: 'with rainbow multi-color glow' },
]

// ============================================
// TEXT TEXTURE OPTIONS
// ============================================

export const TEXT_TEXTURE_OPTIONS: EffectOption<TextTexture>[] = [
  { id: 'smooth', label: 'Smooth', description: 'Clean smooth surface', promptDescription: 'with smooth clean surface' },
  { id: 'rough', label: 'Rough', description: 'Rough textured surface', promptDescription: 'with rough textured surface' },
  { id: 'cracked', label: 'Cracked', description: 'Cracked aged look', promptDescription: 'with cracked aged texture' },
  { id: 'distressed', label: 'Distressed', description: 'Worn weathered look', promptDescription: 'with distressed weathered texture' },
  { id: 'stippled', label: 'Stippled', description: 'Dotted texture', promptDescription: 'with stippled dotted texture' },
  { id: 'brushed', label: 'Brushed', description: 'Brushed metal look', promptDescription: 'with brushed linear texture' },
  { id: 'hammered', label: 'Hammered', description: 'Hammered metal', promptDescription: 'with hammered metal texture' },
]

// ============================================
// LETTER EFFECT OPTIONS
// ============================================

export const LETTER_EFFECT_OPTIONS: EffectOption<LetterEffect>[] = [
  { id: 'none', label: 'None', description: 'No special effect', promptDescription: '' },
  { id: 'stacked', label: 'Stacked', description: 'Layered stacked letters', icon: '📚', promptDescription: 'with stacked layered letter effect' },
  { id: 'shadow-cascade', label: 'Cascade', description: 'Cascading shadow layers', icon: '📉', promptDescription: 'with cascading shadow layers' },
  { id: '3d-block', label: '3D Block', description: 'Solid 3D block letters', icon: '🧊', promptDescription: 'with solid 3D block letter style' },
  { id: 'outline-fill', label: 'Outline Fill', description: 'Outlined with inner fill', icon: '⬜', promptDescription: 'with outline and inner fill' },
  { id: 'gradient-fill', label: 'Gradient', description: 'Gradient color fill', icon: '🌈', promptDescription: 'with gradient color fill' },
  { id: 'split', label: 'Split', description: 'Split/sliced letters', icon: '✂️', promptDescription: 'with split sliced letter effect' },
  { id: 'glitch', label: 'Glitch', description: 'Digital glitch effect', icon: '📺', promptDescription: 'with digital glitch distortion effect' },
]

// ============================================
// PROMPT HELPERS
// ============================================

export function getTextOutlinePrompt(outline: TextOutline | null): string {
  if (!outline || outline === 'none') return ''
  return TEXT_OUTLINE_OPTIONS.find(o => o.id === outline)?.promptDescription || ''
}

export function getGlowEffectPrompt(glow: GlowEffect | null, intensity: number): string {
  if (!glow || glow === 'none') return ''
  const base = GLOW_EFFECT_OPTIONS.find(o => o.id === glow)?.promptDescription || ''
  if (intensity > 70) return base.replace('with', 'with intense')
  if (intensity < 40) return base.replace('with', 'with subtle')
  return base
}

export function getTextTexturePrompt(texture: TextTexture | null): string {
  if (!texture || texture === 'smooth') return ''
  return TEXT_TEXTURE_OPTIONS.find(o => o.id === texture)?.promptDescription || ''
}

export function getLetterEffectPrompt(effect: LetterEffect | null): string {
  if (!effect || effect === 'none') return ''
  return LETTER_EFFECT_OPTIONS.find(o => o.id === effect)?.promptDescription || ''
}
