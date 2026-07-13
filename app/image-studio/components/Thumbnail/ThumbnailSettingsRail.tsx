"use client"

/**
 * ThumbnailSettingsRail
 *
 * Right-rail shell for Thumbnail mode. Splits the workflow into two distinct,
 * self-contained features behind an AI | Manual tab switcher:
 *   - AI:     ThumbnailAiPanel   (title → concepts / generate a background)
 *   - Manual: ThumbnailManualPanel (template, background, subject, headline,
 *             stickers, export)
 *
 * Both panels stay mounted (the inactive one is hidden) so a typed video title
 * or a set of fetched AI concepts survives switching tabs. The shared canvas
 * state lives in ThumbnailProvider, so edits from either tab compose together.
 */

import { useState } from 'react'
import { Pencil, Sparkles, type LucideIcon } from 'lucide-react'
import { ThumbnailAiPanel } from './ThumbnailAiPanel'
import { ThumbnailManualPanel } from './ThumbnailManualPanel'
import { ThumbnailExportPanel } from './ThumbnailExportPanel'

type RailTab = 'ai' | 'manual'

const TABS: { id: RailTab; label: string; icon: LucideIcon }[] = [
  { id: 'ai', label: 'AI', icon: Sparkles },
  { id: 'manual', label: 'Manual', icon: Pencil },
]

const tabBase =
  'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors'
const tabActive = 'bg-[#c99850]/15 text-[#dbb56e] ring-1 ring-inset ring-[#c99850]/50'
const tabInactive = 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200'

export function ThumbnailSettingsRail() {
  const [tab, setTab] = useState<RailTab>('ai')

  return (
    <div className="p-4">
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className={`${tabBase} ${tab === id ? tabActive : tabInactive}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className={tab === 'ai' ? '' : 'hidden'}>
        <ThumbnailAiPanel />
      </div>
      <div className={tab === 'manual' ? '' : 'hidden'}>
        <ThumbnailManualPanel />
      </div>

      <ThumbnailExportPanel />
    </div>
  )
}
