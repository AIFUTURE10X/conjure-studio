import { Search } from 'lucide-react'
import type { CreationLibraryTab } from '../../hooks/useImageStudioState'
import type { ImageDatabaseSourceFilter } from './image-database-records'

interface SourceFilterOption {
  value: ImageDatabaseSourceFilter
  label: string
  count: number
}

interface ImageDatabaseFiltersProps {
  activeMedia: Exclude<CreationLibraryTab, 'videos'>
  activeSource: ImageDatabaseSourceFilter
  sourceFilters: SourceFilterOption[]
  query: string
  category: string
  tag: string
  categories: string[]
  tags: string[]
  onSourceChange: (source: ImageDatabaseSourceFilter) => void
  onQueryChange: (query: string) => void
  onCategoryChange: (category: string) => void
  onTagChange: (tag: string) => void
}

const selectClass = 'h-9 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-300 outline-none focus:border-[#c99850]'

export function ImageDatabaseFilters({
  activeMedia,
  activeSource,
  sourceFilters,
  query,
  category,
  tag,
  categories,
  tags,
  onSourceChange,
  onQueryChange,
  onCategoryChange,
  onTagChange,
}: ImageDatabaseFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 px-4 py-3">
      {activeMedia === 'images' && (
        <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-950/70 p-1">
          {sourceFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => onSourceChange(filter.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeSource === filter.value
                  ? 'bg-[#c99850]/20 text-[#dbb56e]'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      )}

      <label className="relative min-w-52 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={`Search ${activeMedia}, titles, tags, or prompts`}
          className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 pl-9 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#c99850]"
        />
      </label>

      <select value={category} onChange={(event) => onCategoryChange(event.target.value)} className={selectClass} aria-label="Category filter">
        <option value="all">All categories</option>
        {categories.map((value) => <option key={value} value={value}>{value}</option>)}
      </select>

      <select value={tag} onChange={(event) => onTagChange(event.target.value)} className={selectClass} aria-label="Tag filter">
        <option value="all">All tags</option>
        {tags.map((value) => <option key={value} value={value}>{value}</option>)}
      </select>
    </div>
  )
}
