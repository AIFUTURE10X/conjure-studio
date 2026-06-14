"use client"

/**
 * ThumbnailHistoryStrip
 *
 * Gallery of saved thumbnails. Click one to reopen and edit it; star to keep it
 * in Favorites (filter on the header line); select two (A/B) to compare side by
 * side; hover to delete.
 */

import { useState } from 'react'
import { GitCompare, Star, Trash2 } from 'lucide-react'
import { useThumbnail } from './ThumbnailProvider'
import { ThumbnailCompareModal } from './ThumbnailCompareModal'
import { type ThumbnailHistoryItem } from './thumbnail-constants'
import { railLabel } from './thumbnail-ui'

export function ThumbnailHistoryStrip() {
  const { history, applyConfig, deleteThumbnail, toggleFavorite } = useThumbnail()
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [showCompare, setShowCompare] = useState(false)
  const [favOnly, setFavOnly] = useState(false)

  if (history.length === 0) {
    return (
      <div className="space-y-2 border-t border-zinc-800 pt-4">
        <h4 className={railLabel}>Saved thumbnails</h4>
        <p className="text-[10px] text-zinc-600">Use “Save to history” to keep finished thumbnails here.</p>
      </div>
    )
  }

  const items = favOnly ? history.filter((i) => i.isFavorited) : history

  const toggleCompare = (id: string) =>
    setCompareIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 2 ? [cur[1], id] : [...cur, id],
    )

  const open = (item: ThumbnailHistoryItem) => {
    if (item.config) applyConfig(item.config)
  }

  const compareItems = compareIds
    .map((id) => history.find((h) => h.id === id))
    .filter((x): x is ThumbnailHistoryItem => Boolean(x))

  const tab = (active: boolean) =>
    `px-2 py-0.5 transition-colors ${active ? 'bg-[#c99850]/20 text-[#dbb56e]' : 'text-zinc-400 hover:text-zinc-200'}`

  return (
    <div className="space-y-2 border-t border-zinc-800 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className={railLabel}>Saved thumbnails</h4>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-zinc-700 text-[10px] font-semibold">
            <button onClick={() => setFavOnly(false)} className={tab(!favOnly)}>
              All
            </button>
            <button onClick={() => setFavOnly(true)} className={`flex items-center gap-0.5 ${tab(favOnly)}`}>
              <Star className="h-2.5 w-2.5" /> Favorites
            </button>
          </div>
          {compareIds.length === 2 && (
            <button
              onClick={() => setShowCompare(true)}
              className="flex items-center gap-1 text-[10px] font-semibold text-[#dbb56e] transition-colors hover:text-[#e9c789]"
            >
              <GitCompare className="h-3 w-3" /> Compare A/B
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-[10px] text-zinc-600">No favorites yet — tap the star on a thumbnail.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => {
            const selected = compareIds.includes(item.id)
            return (
              <div
                key={item.id}
                className={`group relative overflow-hidden rounded-md border ${selected ? 'border-[#c99850]' : 'border-zinc-700'}`}
              >
                <button
                  onClick={() => open(item)}
                  title={item.config ? 'Reopen to edit' : 'Preview only'}
                  className="block w-full"
                  style={{ aspectRatio: '16 / 9' }}
                >
                  <img src={item.imageUrl} alt={item.prompt} className="h-full w-full object-cover" />
                </button>

                <button
                  onClick={() => toggleCompare(item.id)}
                  title="Select for A/B compare"
                  className={`absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded border text-[9px] font-bold ${
                    selected ? 'border-[#c99850] bg-[#c99850] text-black' : 'border-white/40 bg-black/50 text-white/80'
                  }`}
                >
                  {selected ? (compareIds.indexOf(item.id) === 0 ? 'A' : 'B') : '+'}
                </button>

                <button
                  onClick={() => toggleFavorite(item.id)}
                  title={item.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                  className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded bg-black/50"
                >
                  <Star className={`h-3 w-3 ${item.isFavorited ? 'fill-[#dbb56e] text-[#dbb56e]' : 'text-white/80'}`} />
                </button>

                <button
                  onClick={() => deleteThumbnail(item.id)}
                  title="Delete"
                  className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded bg-red-500/90 text-white group-hover:flex"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {showCompare && compareItems.length === 2 && (
        <ThumbnailCompareModal a={compareItems[0]} b={compareItems[1]} onClose={() => setShowCompare(false)} />
      )}
    </div>
  )
}
