"use client"

/**
 * SettingsRail
 *
 * Right workspace panel: suggestion banner + per-mode settings body.
 * The header toggles the body open/closed (state remembered across
 * reloads); the suggestion banner stays visible even when collapsed so
 * pending AI suggestions are never hidden.
 */

import { useEffect, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { SuggestionBanner } from './SuggestionBanner'
import { ImageSettingsRail } from './ImageSettingsRail'
import { LogoSettingsRail } from './LogoSettingsRail'
import { ThumbnailSettingsRail } from '../../Thumbnail'
import { useStudioMode } from '../../../context/useStudio'

export { SettingField } from './SettingField'
export { SuggestionBanner } from './SuggestionBanner'
export { ImageSettingsRail } from './ImageSettingsRail'
export { LogoSettingsRail } from './LogoSettingsRail'

const SETTINGS_OPEN_KEY = 'studio-settings-rail-open'

export function SettingsRail() {
  const { mode } = useStudioMode()
  const [isOpen, setIsOpen] = useState(true)

  // Restore the last open/closed state after mount (reading localStorage in
  // the initializer would mismatch the server-rendered markup).
  useEffect(() => {
    if (localStorage.getItem(SETTINGS_OPEN_KEY) === 'closed') setIsOpen(false)
  }, [])

  const handleToggle = () => {
    const next = !isOpen
    setIsOpen(next)
    try {
      localStorage.setItem(SETTINGS_OPEN_KEY, next ? 'open' : 'closed')
    } catch {}
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-l border-zinc-800">
      <button
        onClick={handleToggle}
        aria-expanded={isOpen}
        title={isOpen ? 'Collapse settings' : 'Expand settings'}
        className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 shrink-0 transition-colors hover:bg-zinc-900"
      >
        <SlidersHorizontal className="w-4 h-4 text-[#dbb56e]" />
        <span className="text-sm font-medium text-zinc-200">Settings</span>
        <ChevronDown
          className={`w-4 h-4 ml-auto text-zinc-500 transition-transform ${isOpen ? '' : '-rotate-90'}`}
        />
      </button>

      <SuggestionBanner />

      {isOpen && (
        <ScrollArea className="flex-1 min-h-0">
          {mode === 'image' && <ImageSettingsRail />}
          {mode === 'logo' && <LogoSettingsRail />}
          {mode === 'thumbnail' && <ThumbnailSettingsRail />}
          {mode !== 'image' && mode !== 'logo' && mode !== 'thumbnail' && (
            <div className="p-6">
              <p className="text-xs text-zinc-500 text-center leading-5">
                Settings for this mode join the rail when it enters the
                workspace.
              </p>
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  )
}
