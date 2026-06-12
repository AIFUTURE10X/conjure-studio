/**
 * Studio workspace mode types
 *
 * StudioMode is the canonical mode for the unified workspace shell.
 * The legacy tab union still drives the current page; the maps below
 * bridge the two until the shell swap retires the tab system.
 * 'settings' has no studio mode — it becomes a dialog in the new shell.
 */

export type StudioMode = 'image' | 'logo' | 'mockups' | 'bg-remover'

export type LegacyTab = 'generate' | 'logo' | 'mockups' | 'bg-remover' | 'settings'

export const TAB_FOR_MODE: Record<StudioMode, LegacyTab> = {
  image: 'generate',
  logo: 'logo',
  mockups: 'mockups',
  'bg-remover': 'bg-remover',
}

export const MODE_FOR_TAB: Record<LegacyTab, StudioMode> = {
  generate: 'image',
  logo: 'logo',
  mockups: 'mockups',
  'bg-remover': 'bg-remover',
  settings: 'image',
}
