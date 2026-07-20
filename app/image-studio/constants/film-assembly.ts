/**
 * Film assembly options: narration voice engines + curated voices, and
 * music mood presets that map to Lyria 2 generation prompts.
 * ElevenLabs voice names are the stock premade voices accepted by
 * fal-ai/elevenlabs/tts/eleven-v3's `voice` field.
 */

export type NarrationEngine = 'elevenlabs' | 'kling'

export interface NarrationVoice {
  id: string
  label: string
}

export const ELEVENLABS_VOICES: NarrationVoice[] = [
  { id: 'Rachel', label: 'Rachel — warm female narrator' },
  { id: 'Brian', label: 'Brian — deep male narrator' },
  { id: 'George', label: 'George — warm British male' },
  { id: 'Daniel', label: 'Daniel — authoritative British male' },
  { id: 'Charlotte', label: 'Charlotte — elegant British female' },
  { id: 'Bill', label: 'Bill — older American male' },
  { id: 'Alice', label: 'Alice — clear British female' },
  { id: 'Callum', label: 'Callum — gravelly male' },
  { id: 'Lily', label: 'Lily — soft British female' },
  { id: 'Aria', label: 'Aria — expressive female' },
]

export interface MusicStyle {
  id: string
  label: string
  emoji: string
  /** Lyria 2 generation prompt; empty id 'none' skips music entirely. */
  prompt: string
}

export const MUSIC_STYLES: MusicStyle[] = [
  { id: 'none', label: 'No music', emoji: '🔇', prompt: '' },
  { id: 'cinematic', label: 'Cinematic Score', emoji: '🎻', prompt: 'sweeping emotional cinematic orchestral film score, warm strings and soft brass, understated and supportive, no vocals' },
  { id: 'melancholy', label: 'Melancholy Piano', emoji: '🎹', prompt: 'slow melancholy solo piano, wistful and intimate film underscore, gentle and sparse, no vocals' },
  { id: 'uplifting', label: 'Uplifting Build', emoji: '🌅', prompt: 'uplifting hopeful orchestral music, gently building strings and light percussion, inspiring finale feel, no vocals' },
  { id: 'ambient', label: 'Ambient Atmosphere', emoji: '🌫️', prompt: 'soft ambient atmospheric pads, slow evolving warm textures, quiet background underscore, no vocals' },
  { id: 'tension', label: 'Tension', emoji: '🫨', prompt: 'tense suspenseful cinematic underscore, low pulsing strings and subtle percussion heartbeat, restrained, no vocals' },
  { id: 'acoustic', label: 'Warm Acoustic', emoji: '🪕', prompt: 'warm fingerpicked acoustic guitar, gentle folk feel, cozy and human, no vocals' },
  { id: 'electronic', label: 'Electronic Pulse', emoji: '🎛️', prompt: 'modern minimal electronic pulse, stylish synth textures and soft beat, sleek product-film energy, no vocals' },
]

export function getMusicStyle(id: string): MusicStyle | undefined {
  return MUSIC_STYLES.find((style) => style.id === id)
}
