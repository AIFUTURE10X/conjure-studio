"use client"

/**
 * SettingsRail
 *
 * Right workspace panel: suggestion banner + per-mode settings body.
 * Image mode is live; logo settings join when logo mode enters the shell.
 */

import { ScrollArea } from '@/components/ui/scroll-area'
import { SlidersHorizontal } from 'lucide-react'
import { SuggestionBanner } from './SuggestionBanner'
import { ImageSettingsRail } from './ImageSettingsRail'
import { useStudioMode } from '../../../context/useStudio'

export { SettingField } from './SettingField'
export { SuggestionBanner } from './SuggestionBanner'
export { ImageSettingsRail } from './ImageSettingsRail'

export function SettingsRail() {
  const { mode } = useStudioMode()

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-l border-zinc-800">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 shrink-0">
        <SlidersHorizontal className="w-4 h-4 text-[#dbb56e]" />
        <span className="text-sm font-medium text-zinc-200">Settings</span>
      </div>

      <SuggestionBanner />

      <ScrollArea className="flex-1 min-h-0">
        {mode === 'image' ? (
          <ImageSettingsRail />
        ) : (
          <div className="p-6">
            <p className="text-xs text-zinc-500 text-center leading-5">
              Settings for this mode join the rail when it enters the
              workspace.
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
