import { Check, Clock3, ExternalLink, Heart, Loader2, Pencil } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ImageDatabaseRecord } from './image-database-records'

const SOURCE_LABELS = {
  generation_history: 'History',
  favorites: 'Favorite',
  logo_history: 'Logo',
} as const

interface ImageDatabaseCardProps {
  record: ImageDatabaseRecord
  isInHistory: boolean
  isInFavorites: boolean
  isAddingHistory: boolean
  isAddingFavorite: boolean
  onPreview: () => void
  onRestoreHistory: () => void
  onRestoreFavorite: () => void
  onEditMetadata: () => void
}

function displayUrl(url: string) {
  try {
    const parsed = new URL(url)
    return `${parsed.hostname}${parsed.pathname}`
  } catch {
    return url
  }
}

function formatDate(timestamp: number) {
  if (!Number.isFinite(timestamp)) return 'Unknown date'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function ImageDatabaseCard({
  record,
  isInHistory,
  isInFavorites,
  isAddingHistory,
  isAddingFavorite,
  onPreview,
  onRestoreHistory,
  onRestoreFavorite,
  onEditMetadata,
}: ImageDatabaseCardProps) {
  return (
    <article className="group overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
      <button type="button" onClick={onPreview} className="relative block aspect-square w-full cursor-zoom-in overflow-hidden bg-black text-left" title="Click to view full size">
        <img
          src={record.url}
          alt={record.title || record.prompt || `${SOURCE_LABELS[record.source]} image ${record.sourceId}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
        />
        <span className="absolute left-2 top-2 rounded bg-black/75 px-2 py-1 text-[10px] font-medium text-[#dbb56e] backdrop-blur-sm">
          {SOURCE_LABELS[record.source]}
        </span>
      </button>

      <div className="space-y-1.5 p-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {record.title && <h3 className="truncate text-sm font-semibold text-white" title={record.title}>{record.title}</h3>}
            <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-500">
              <span className="truncate" title={record.recordId}>ID {record.recordId}</span>
              <span className="shrink-0">{formatDate(record.timestamp)}</span>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" onClick={onEditMetadata} className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-[#dbb56e]" aria-label="Edit title, category, and tags">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">Edit title, category, and tags</TooltipContent>
          </Tooltip>
        </div>

        {record.prompt && <p className="line-clamp-2 text-xs text-zinc-300">{record.prompt}</p>}
        {(record.category || record.tags?.length) && (
          <div className="flex flex-wrap gap-1">
            {record.category && <span className="rounded bg-[#c99850]/15 px-1.5 py-0.5 text-[10px] text-[#dbb56e]">{record.category}</span>}
            {record.tags?.map((tag) => <span key={tag} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">#{tag}</span>)}
          </div>
        )}
        {record.detail && <p className="truncate text-[10px] text-zinc-500">{record.detail}</p>}
        <a href={record.url} target="_blank" rel="noreferrer" title={record.url} className="flex items-center gap-1 text-[10px] text-[#c99850] hover:text-[#dbb56e]">
          <span className="truncate">{displayUrl(record.url)}</span>
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button type="button" onClick={onRestoreHistory} disabled={isInHistory || isAddingHistory} className="flex h-7 items-center justify-center gap-1 rounded border border-zinc-700 px-1.5 text-[10px] font-medium text-zinc-300 transition-colors hover:border-[#c99850]/70 hover:text-[#dbb56e] disabled:cursor-default disabled:border-zinc-800 disabled:text-zinc-600">
            {isAddingHistory ? <Loader2 className="h-3 w-3 animate-spin" /> : isInHistory ? <Check className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
            {isInHistory ? 'In History' : 'Add to History'}
          </button>
          <button type="button" onClick={onRestoreFavorite} disabled={isInFavorites || isAddingFavorite} className="flex h-7 items-center justify-center gap-1 rounded border border-zinc-700 px-1.5 text-[10px] font-medium text-zinc-300 transition-colors hover:border-red-400/60 hover:text-red-300 disabled:cursor-default disabled:border-zinc-800 disabled:text-zinc-600">
            {isAddingFavorite ? <Loader2 className="h-3 w-3 animate-spin" /> : isInFavorites ? <Check className="h-3 w-3" /> : <Heart className="h-3 w-3" />}
            {isInFavorites ? 'In Favorites' : 'Add to Favorites'}
          </button>
        </div>
      </div>
    </article>
  )
}
