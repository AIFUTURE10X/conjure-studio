"use client"

/**
 * TitleStyleFilters - search box, movie/TV toggle and the 9 design-family chips.
 */

import { Search, X } from 'lucide-react'
import type {
  TitleStyleCategory,
  TitleStyleMedium,
} from '../../../constants/title-logo-presets'

interface ApproachChip {
  id: TitleStyleCategory
  shortLabel: string
  icon: string
  color: string
}

interface TitleStyleFiltersProps {
  approaches: readonly ApproachChip[]
  counts: Record<TitleStyleCategory, number>
  search: string
  setSearch: (value: string) => void
  medium: TitleStyleMedium | null
  setMedium: (value: TitleStyleMedium | null) => void
  category: TitleStyleCategory | null
  setCategory: (value: TitleStyleCategory | null) => void
  resultCount: number
  totalCount: number
  onReset: () => void
}

const MEDIA: Array<{ value: TitleStyleMedium; label: string }> = [
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'TV' },
]

export function TitleStyleFilters({
  approaches,
  counts,
  search,
  setSearch,
  medium,
  setMedium,
  category,
  setCategory,
  resultCount,
  totalCount,
  onReset,
}: TitleStyleFiltersProps) {
  const hasFilters = Boolean(search || medium || category)

  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search a look — gothic, neon, gold, glitch, Dune..."
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-1.5 pl-8 pr-8 text-xs text-white placeholder:text-zinc-500 focus:border-[#c99850] focus:outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-500 hover:text-white"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Medium toggle */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setMedium(null)}
          className={`rounded px-2 py-1 text-xs transition-colors ${
            medium === null
              ? 'bg-[#c99850] font-medium text-black'
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          All
        </button>
        {MEDIA.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMedium(medium === m.value ? null : m.value)}
            className={`rounded px-2 py-1 text-xs transition-colors ${
              medium === m.value
                ? 'bg-[#c99850] font-medium text-black'
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            }`}
          >
            {m.label}
          </button>
        ))}

        <span className="ml-auto text-[10px] text-zinc-500">
          {resultCount} of {totalCount}
        </span>
        {hasFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-[10px] text-zinc-400 underline-offset-2 hover:text-white hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Design family chips */}
      <div className="flex flex-wrap gap-1.5">
        {approaches.map((approach) => {
          const isActive = category === approach.id
          return (
            <button
              key={approach.id}
              type="button"
              onClick={() => setCategory(isActive ? null : approach.id)}
              style={isActive ? { backgroundColor: approach.color } : undefined}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
                isActive
                  ? 'font-medium text-black'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              <span>{approach.icon}</span>
              <span>{approach.shortLabel}</span>
              <span className={isActive ? 'text-black/60' : 'text-zinc-500'}>
                {counts[approach.id] ?? 0}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
