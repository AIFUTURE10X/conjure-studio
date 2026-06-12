"use client"

/**
 * HelperPanel
 *
 * Left workspace panel. Placeholder until AIHelperChat is extracted from
 * AIHelperSidebar — the chat column will mount here.
 */

import { Sparkles } from 'lucide-react'

export function HelperPanel() {
  return (
    <div className="h-full flex flex-col bg-zinc-950 border-r border-zinc-800">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
        <Sparkles className="w-4 h-4 text-[#dbb56e]" />
        <span className="text-sm font-medium text-zinc-200">AI Helper</span>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-xs text-zinc-500 text-center leading-5">
          The AI prompt helper chat moves into this panel next.
          Until then, use the helper from the classic studio page.
        </p>
      </div>
    </div>
  )
}
