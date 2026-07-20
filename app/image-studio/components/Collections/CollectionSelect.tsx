"use client"

/**
 * CollectionSelect
 *
 * "Save to" dropdown in the prompt dock (Leonardo-style pre-assignment):
 * new generations auto-file into the chosen collection. Includes inline
 * "+ New collection" creation.
 */

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ChevronDown, FolderPlus, FolderOpen } from 'lucide-react'
import {
  fetchCollections,
  createCollection,
  getActiveCollection,
  setActiveCollection,
  type CollectionSummary,
} from '@/lib/collections-client'

export function CollectionSelect() {
  const [open, setOpen] = useState(false)
  const [collections, setCollections] = useState<CollectionSummary[]>([])
  const [active, setActive] = useState<{ id: number; name: string } | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setActive(getActiveCollection())
  }, [])

  useEffect(() => {
    if (!open) return
    fetchCollections().then(setCollections).catch(() => {})
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const choose = (collection: { id: number; name: string } | null) => {
    setActive(collection)
    setActiveCollection(collection)
    setOpen(false)
    toast.success(collection ? `New images will be saved to “${collection.name}”` : 'Auto-filing off')
  }

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    const created = await createCollection(name)
    if (!created) {
      toast.error('Could not create collection')
      return
    }
    setCollections((prev) => [created, ...prev])
    setNewName('')
    setIsCreating(false)
    choose({ id: created.id, name: created.name })
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        title="Auto-file new generations into a collection"
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
          active ? 'text-[#dbb56e] bg-[#c99850]/10' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <FolderOpen className="w-3 h-3" />
        <span className="max-w-[110px] truncate">{active ? active.name : 'Save to…'}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-56 rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl z-50 p-1.5 space-y-0.5">
          <button
            onClick={() => choose(null)}
            className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors ${
              !active ? 'text-[#dbb56e] bg-[#c99850]/10' : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            Don’t auto-file
          </button>
          <div className="max-h-44 overflow-y-auto space-y-0.5">
            {collections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => choose({ id: collection.id, name: collection.name })}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors ${
                  active?.id === collection.id ? 'text-[#dbb56e] bg-[#c99850]/10' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <span className="truncate">{collection.name}</span>
                <span className="text-zinc-600 shrink-0 ml-2">{collection.itemCount}</span>
              </button>
            ))}
          </div>
          {isCreating ? (
            <div className="flex items-center gap-1 p-1">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleCreate(); if (e.key === 'Escape') setIsCreating(false) }}
                placeholder="Collection name…"
                className="flex-1 min-w-0 h-7 rounded-md bg-zinc-950 border border-zinc-700 px-2 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-[#c99850]"
              />
              <button
                onClick={handleCreate}
                className="px-2 h-7 rounded-md text-xs font-medium bg-[#c99850] text-black hover:bg-[#dbb56e]"
              >
                Add
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <FolderPlus className="w-3 h-3" />
              New collection
            </button>
          )}
        </div>
      )}
    </div>
  )
}
