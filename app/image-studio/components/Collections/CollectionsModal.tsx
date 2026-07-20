"use client"

/**
 * CollectionsModal
 *
 * Browse collections: tab per collection, thumbnail grid of items
 * (images + videos), remove items, delete collections.
 */

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Trash2 } from 'lucide-react'
import { getUserId } from '@/lib/user-id'
import { fetchCollections, type CollectionSummary } from '@/lib/collections-client'

interface CollectionItem {
  id: number
  itemType: string
  itemUrl: string
  prompt: string | null
  createdAt: number
}

interface CollectionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CollectionsModal({ open, onOpenChange }: CollectionsModalProps) {
  const [collections, setCollections] = useState<CollectionSummary[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [items, setItems] = useState<CollectionItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    fetchCollections()
      .then((list) => {
        setCollections(list)
        setActiveId((current) => current ?? list[0]?.id ?? null)
      })
      .catch(() => toast.error('Could not load collections'))
  }, [open])

  useEffect(() => {
    if (!open || activeId === null) {
      setItems([])
      return
    }
    setIsLoading(true)
    fetch(`/api/collections/items?userId=${encodeURIComponent(getUserId())}&collectionId=${activeId}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setItems(Array.isArray(data?.items) ? data.items : []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [open, activeId])

  const removeItem = (item: CollectionItem) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    setCollections((prev) => prev.map((c) => (c.id === activeId ? { ...c, itemCount: Math.max(0, c.itemCount - 1) } : c)))
    void fetch(`/api/collections/items?userId=${encodeURIComponent(getUserId())}&id=${item.id}`, { method: 'DELETE' })
      .catch(() => toast.error('Could not remove item'))
  }

  const deleteCollection = (collection: CollectionSummary) => {
    if (!confirm(`Delete “${collection.name}” and its ${collection.itemCount} saved item references?`)) return
    setCollections((prev) => prev.filter((c) => c.id !== collection.id))
    if (activeId === collection.id) setActiveId(null)
    void fetch(`/api/collections?userId=${encodeURIComponent(getUserId())}&id=${collection.id}`, { method: 'DELETE' })
      .catch(() => toast.error('Could not delete collection'))
  }

  const active = collections.find((c) => c.id === activeId) ?? null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-white">Collections</DialogTitle>
        </DialogHeader>

        {collections.length === 0 ? (
          <p className="text-center text-sm text-zinc-500 py-10">
            No collections yet — open “Save to…” next to the Generate button and create one.
            New generations will file into it automatically.
          </p>
        ) : (
          <>
            <div className="flex gap-1 flex-wrap">
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => setActiveId(collection.id)}
                  className={`px-2.5 h-7 rounded-md text-xs font-medium transition-colors ${
                    activeId === collection.id
                      ? 'bg-linear-to-r from-[#c99850] to-[#dbb56e] text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                  }`}
                >
                  {collection.name} ({collection.itemCount})
                </button>
              ))}
            </div>

            <div className="max-h-[55vh] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-10 text-zinc-500 text-sm gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : items.length === 0 ? (
                <p className="text-center text-sm text-zinc-500 py-10">
                  This collection is empty — set it as “Save to…” in the prompt dock and generate.
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {items.map((item) => (
                    <div key={item.id} className="group relative rounded-lg overflow-hidden border border-zinc-800 bg-black">
                      {item.itemType === 'video' ? (
                        <video src={item.itemUrl} className="w-full h-28 object-cover" muted playsInline />
                      ) : (
                        <img src={item.itemUrl} alt={item.prompt ?? 'Collection item'} className="w-full h-28 object-cover" />
                      )}
                      <button
                        onClick={() => removeItem(item)}
                        title="Remove from collection"
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-zinc-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {active && (
              <button
                onClick={() => deleteCollection(active)}
                className="self-start flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-zinc-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Delete “{active.name}”
              </button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
