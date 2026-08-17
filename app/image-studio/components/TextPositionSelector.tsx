"use client"

/**
 * TextPositionSelector
 *
 * Chooses where wording sits relative to the artwork. Shared by the logo
 * generator and the image generator so both offer identical vocabulary — and
 * the same vocabulary the Real Font Overlay tool uses for re-layout.
 */

import {
  TEXT_POSITIONS,
  TEXT_POSITION_HINTS,
  TEXT_POSITION_LABELS,
  type TextPosition,
} from '@/lib/text-position'

interface TextPositionSelectorProps {
  value: TextPosition
  onChange: (position: TextPosition) => void
  disabled?: boolean
  /** Compact renders a bare select for dense rails; default adds label + hint. */
  compact?: boolean
}

export function TextPositionSelector({
  value,
  onChange,
  disabled = false,
  compact = false,
}: TextPositionSelectorProps) {
  const select = (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TextPosition)}
      disabled={disabled}
      aria-label="Text position"
      className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:border-[#c99850] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {TEXT_POSITIONS.map((position) => (
        <option key={position} value={position}>
          {TEXT_POSITION_LABELS[position]}
        </option>
      ))}
    </select>
  )

  if (compact) return select

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] text-zinc-400">Text Position</label>
      {select}
      <p className="text-[9px] text-zinc-500">{TEXT_POSITION_HINTS[value]}</p>
    </div>
  )
}
