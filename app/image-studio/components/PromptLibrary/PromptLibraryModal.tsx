"use client"

/**
 * PromptLibraryModal
 *
 * Every generated prompt lands here automatically (starred pinned first).
 * Search, star, reuse with one click, or delete. "Use" hands the prompt
 * back to the caller, which fills the right prompt box for its mode.
 */

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Loader2, Search, Star, Trash2 } from 'lucide-react'
import { getUserId } from '@/lib/user-id'
import type { PromptKind } from '@/lib/prompt-log'

export interface SavedPrompt {
  id: number
  prompt: string
  kind: string
  isStarred: boolean
  useCount: number
  lastUsedAt: number
}

type Filter = 'all' | 'starred' | 'image' | 'video' | 'logo'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'starred', label: '★ Starred' },
  { id: 'image', label: 'Image' },
  { id: 'video', label: 'Video' },
  { id: 'logo', label: 'Logo' },
]

interface PromptLibraryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUsePrompt: (prompt: string, kind: PromptKind) => void
  /** Pre-selects the filter matching the mode the modal was opened from. */
  defaultFilter?: Filter
}

export function PromptLibraryModal({ open, onOpenChange, onUsePrompt, defaultFilter = 'all' }: PromptLibraryModalProps) {
  const [items, setItems] = useState<SavedPrompt[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>(defaultFilter)

  useEffect(() => {
    if (!open) return
    setFilter(defaultFilter)
    setIsLoading(true)
    fetch(`/api/prompts?userId=${encodeURIComponent(getUserId())}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (Array.isArray(data?.prompts)) setItems(data.prompts)
      })
      .catch((error) => console.error('[prompt-library] Load failed:', error))
      .finally(() => setIsLoading(false))
  }, [open, defaultFilter])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (filter === 'starred' && !item.isStarred) return false
      if ((filter === 'image' || filter === 'video' || filter === 'logo') && item.kind !== filter) return false
      if (q && !item.prompt.toLowerCase().includes(q)) return false
      return true
    })
  }, [items, filter, search])

  const toggleStar = (item: SavedPrompt) => {
    setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, isStarred: !p.isStarred } : p)))
    void fetch('/api/prompts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: getUserId(), id: item.id, isStarred: !item.isStarred }),
    }).catch(() => toast.error('Could not update star'))
  }

  const deletePrompt = (item: SavedPrompt) => {
    setItems((prev) => prev.filter((p) => p.id !== item.id))
    void fetch(`/api/prompts?userId=${encodeURIComponent(getUserId())}&id=${item.id}`, { method: 'DELETE' })
      .catch(() => toast.error('Could not delete prompt'))
  }

  const handleUsePrompt = (item: SavedPrompt) => {
    const kind: PromptKind = item.kind === 'video' ? 'video' : item.kind === 'logo' ? 'logo' : 'image'
    onUsePrompt(item.prompt, kind)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-white">Prompt Library</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your prompts…"
              className="pl-8 h-8 bg-zinc-950 border-zinc-800 text-sm"
            />
          </div>
          <div className="flex gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-2 h-7 rounded-md text-xs font-medium transition-colors ${
                  filter === f.id
                    ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto space-y-1.5 pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-zinc-500 text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading prompts…
            </div>
          ) : visible.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 py-10">
              {items.length === 0
                ? 'No prompts yet — every prompt you generate with is saved here automatically.'
                : 'No prompts match your search.'}
            </p>
          ) : (
            visible.map((item) => (
              <div
                key={item.id}
                className="group flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 hover:border-zinc-700 transition-colors"
              >
                <button
                  onClick={() => toggleStar(item)}
                  title={item.isStarred ? 'Unstar' : 'Star this prompt'}
                  className={`mt-0.5 shrink-0 ${item.isStarred ? 'text-[#dbb56e]' : 'text-zinc-600 hover:text-zinc-300'}`}
                >
                  <Star className="w-4 h-4" fill={item.isStarred ? 'currentColor' : 'none'} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-200 leading-5 line-clamp-2" title={item.prompt}>
                    {item.prompt}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">
                    {item.kind} · used {item.useCount}× · {new Date(item.lastUsedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleUsePrompt(item)}
                    className="px-2 py-1 rounded-md text-[11px] font-medium bg-[#c99850]/10 text-[#dbb56e] hover:bg-[#c99850]/20 transition-colors"
                  >
                    Use
                  </button>
                  <button
                    onClick={() => deletePrompt(item)}
                    title="Delete prompt"
                    className="p-1 rounded-md text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
