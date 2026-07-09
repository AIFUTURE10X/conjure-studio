"use client"

/**
 * EditChipsRow
 *
 * Horizontally scrollable row of quick-fill preset chips shown above the
 * edit-chat textarea. Clicking a chip only fills/appends text into the
 * input and refocuses it — it never auto-sends.
 */

import { EDIT_CHIPS } from '../../constants/edit-chips'

interface EditChipsRowProps {
  onPick: (fill: string) => void
}

export function EditChipsRow({ onPick }: EditChipsRowProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
      {EDIT_CHIPS.map((chip) => (
        <button
          key={chip.label}
          onClick={() => onPick(chip.fill)}
          title={chip.needsMask ? `${chip.label} (paint an area first for best results)` : chip.label}
          className="shrink-0 whitespace-nowrap rounded-full border border-zinc-700 bg-zinc-800/70 px-3 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:border-[#c99850]/60 hover:text-[#dbb56e]"
        >
          {chip.label}
        </button>
      ))}
    </div>
  )
}
