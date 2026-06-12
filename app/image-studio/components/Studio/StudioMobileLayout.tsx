"use client"

/**
 * StudioMobileLayout
 *
 * Below-lg layout: the canvas fills the screen; the AI helper opens as a
 * bottom sheet and the settings rail as a right sheet. A floating chip
 * surfaces pending AI suggestions and opens the settings sheet.
 */

import { useState } from 'react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Sparkles, SlidersHorizontal } from 'lucide-react'
import { CanvasPanel } from './CanvasPanel'
import { HelperPanel } from './HelperPanel'
import { SettingsRail } from './SettingsRail'
import { usePendingSuggestion } from '../../context/useStudio'

export function StudioMobileLayout() {
  const [helperOpen, setHelperOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { pendingSuggestion } = usePendingSuggestion()

  return (
    <div className="flex-1 min-h-0 flex flex-col relative">
      <div className="flex-1 min-h-0">
        <CanvasPanel />
      </div>

      {pendingSuggestion && !settingsOpen && (
        <button
          onClick={() => setSettingsOpen(true)}
          className="absolute top-3 right-3 z-30 flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-zinc-950/90 px-3 py-1.5 text-xs font-medium text-amber-300 shadow-lg backdrop-blur"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Suggested changes
        </button>
      )}

      <div className="flex items-center gap-2 border-t border-zinc-800 bg-zinc-950 px-3 py-2 shrink-0">
        <button
          onClick={() => setHelperOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-zinc-900 border border-zinc-800 text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <Sparkles className="w-4 h-4 text-[#dbb56e]" />
          AI Helper
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-zinc-900 border border-zinc-800 text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4 text-[#dbb56e]" />
          Settings
        </button>
      </div>

      <Sheet open={helperOpen} onOpenChange={setHelperOpen}>
        <SheetContent side="bottom" className="h-[85vh] p-0 bg-zinc-950 border-zinc-800">
          <SheetTitle className="sr-only">AI Helper</SheetTitle>
          <div className="h-full min-h-0">
            <HelperPanel />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="right" className="w-[88vw] max-w-sm p-0 bg-zinc-950 border-zinc-800">
          <SheetTitle className="sr-only">Settings</SheetTitle>
          <div className="h-full min-h-0">
            <SettingsRail />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
