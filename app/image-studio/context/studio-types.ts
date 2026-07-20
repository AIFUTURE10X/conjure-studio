/**
 * Studio workspace mode types
 *
 * StudioMode is the canonical mode for the unified workspace shell.
 * The legacy tab union still drives the current page; the maps below
 * bridge the two until the shell swap retires the tab system.
 * 'settings' has no studio mode — it becomes a dialog in the new shell.
 */

export type StudioMode = 'image' | 'video' | 'logo' | 'mockups' | 'bg-remover' | 'thumbnail' | 'translate' | 'guide' | 'analytics'

export type LegacyTab = 'generate' | 'video' | 'logo' | 'mockups' | 'bg-remover' | 'settings' | 'thumbnail' | 'translate' | 'guide' | 'analytics'

export const TAB_FOR_MODE: Record<StudioMode, LegacyTab> = {
  image: 'generate',
  video: 'video',
  logo: 'logo',
  mockups: 'mockups',
  'bg-remover': 'bg-remover',
  thumbnail: 'thumbnail',
  translate: 'translate',
  guide: 'guide',
  analytics: 'analytics',
}

export const MODE_FOR_TAB: Record<LegacyTab, StudioMode> = {
  generate: 'image',
  video: 'video',
  logo: 'logo',
  mockups: 'mockups',
  'bg-remover': 'bg-remover',
  settings: 'image',
  thumbnail: 'thumbnail',
  translate: 'translate',
  guide: 'guide',
  analytics: 'analytics',
}
