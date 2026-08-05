import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface VideoHistoryFiltersProps {
  search: string
  category: string
  tag: string
  categories: string[]
  tags: string[]
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onTagChange: (value: string) => void
}

const selectClass = 'h-9 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-300 outline-none focus:border-[#c99850]'

export function VideoHistoryFilters({
  search,
  category,
  tag,
  categories,
  tags,
  onSearchChange,
  onCategoryChange,
  onTagChange,
}: VideoHistoryFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 p-4 pb-2">
      <div className="relative min-w-56 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search titles, tags, or prompts…"
          className="border-zinc-800 bg-zinc-950 pl-9 text-white placeholder:text-zinc-600"
        />
      </div>
      <select value={category} onChange={(event) => onCategoryChange(event.target.value)} className={selectClass} aria-label="Category filter">
        <option value="all">All Categories</option>
        {categories.map((value) => <option key={value} value={value}>{value}</option>)}
      </select>
      <select value={tag} onChange={(event) => onTagChange(event.target.value)} className={selectClass} aria-label="Tag filter">
        <option value="all">All Tags</option>
        {tags.map((value) => <option key={value} value={value}>{value}</option>)}
      </select>
    </div>
  )
}
