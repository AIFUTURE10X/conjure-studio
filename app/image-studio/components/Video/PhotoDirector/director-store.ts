"use client"

import { useSyncExternalStore } from 'react'
import type { DirectorProject } from '@/lib/video/photo-director-schema'

/**
 * Photo Director store internals: a module-level, localStorage-backed store
 * observed via useSyncExternalStore (the Concierge-plan pattern). Living
 * outside React means project state survives mode switches and refreshes with
 * no providers or prop threading. Actions live in useDirectorProject.ts.
 */

const STORAGE_KEY = 'conjure-director-project'
/** Stay under the ~5MB origin quota shared with presets/concierge keys. */
const MAX_PERSIST_CHARS = 3_500_000
/** Keystroke-rate updates coalesce into one localStorage write. */
const PERSIST_DEBOUNCE_MS = 400

let current: DirectorProject | null | undefined
let persistTimer: ReturnType<typeof setTimeout> | null = null
const listeners = new Set<() => void>()

export function readProject(): DirectorProject | null {
  if (current !== undefined) return current
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as DirectorProject) : null
    current = parsed && parsed.version === 1 ? parsed : null
  } catch {
    current = null
  }
  return current
}

function persist() {
  persistTimer = null
  try {
    if (!current) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    let serialized = JSON.stringify(current)
    if (serialized.length > MAX_PERSIST_CHARS) {
      // Too big for the quota: persist thumbnails only. Full-res stays in
      // `current` for this session; after a reload the upload step offers
      // re-attach for photos whose dataUrl is ''.
      serialized = JSON.stringify({
        ...current,
        photos: current.photos.map((photo) => ({ ...photo, dataUrl: '' })),
      })
    }
    localStorage.setItem(STORAGE_KEY, serialized)
  } catch {
    // Storage unavailable (private mode / quota) — the project still works for the session.
  }
}

function flushPending() {
  if (persistTimer === null) return
  clearTimeout(persistTimer)
  persist()
}

/**
 * In-memory state updates and re-renders happen synchronously; the localStorage
 * write is debounced because serializing a project carrying full-resolution
 * photos on every keystroke would jank the text fields. Pending writes are
 * flushed when the page is hidden so nothing is lost on close.
 */
export function writeProject(next: DirectorProject | null) {
  current = next
  if (persistTimer !== null) clearTimeout(persistTimer)
  if (next) persistTimer = setTimeout(persist, PERSIST_DEBOUNCE_MS)
  else persist()
  listeners.forEach((listener) => listener())
}

export function updateProject(mutate: (project: DirectorProject) => DirectorProject) {
  const project = readProject()
  if (!project) return
  writeProject(mutate(project))
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushPending)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPending()
  })
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useDirectorProject(): DirectorProject | null {
  return useSyncExternalStore(subscribe, readProject, () => null)
}
