import { getUserId } from '@/lib/user-id'

/**
 * Client helpers for collections. The "active collection" (chosen in the
 * prompt dock's Save-to dropdown) lives in localStorage; generation flows
 * call addToActiveCollection fire-and-forget so auto-filing never blocks.
 */

const ACTIVE_COLLECTION_KEY = 'conjure-active-collection'

export interface CollectionSummary {
  id: number
  name: string
  itemCount: number
  coverUrl: string | null
  createdAt: number
}

export function getActiveCollection(): { id: number; name: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(ACTIVE_COLLECTION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return typeof parsed?.id === 'number' && typeof parsed?.name === 'string' ? parsed : null
  } catch {
    return null
  }
}

export function setActiveCollection(collection: { id: number; name: string } | null): void {
  if (typeof window === 'undefined') return
  if (collection) localStorage.setItem(ACTIVE_COLLECTION_KEY, JSON.stringify(collection))
  else localStorage.removeItem(ACTIVE_COLLECTION_KEY)
}

export async function fetchCollections(): Promise<CollectionSummary[]> {
  const response = await fetch(`/api/collections?userId=${encodeURIComponent(getUserId())}`)
  if (!response.ok) throw new Error('Could not load collections')
  const data = await response.json()
  return Array.isArray(data.collections) ? data.collections : []
}

export async function createCollection(name: string): Promise<CollectionSummary | null> {
  const response = await fetch('/api/collections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: getUserId(), name }),
  })
  if (!response.ok) return null
  const data = await response.json()
  return data.collection ?? null
}

export function addToActiveCollection(
  urls: string[],
  prompt: string,
  itemType: 'image' | 'video' = 'image',
): void {
  const active = getActiveCollection()
  if (!active || urls.length === 0) return
  void fetch('/api/collections/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: getUserId(),
      collectionId: active.id,
      items: urls.slice(0, 20).map((itemUrl) => ({ itemType, itemUrl, prompt: prompt.slice(0, 8000) })),
    }),
  }).catch((error) => console.error('[collections] Auto-file failed:', error))
}
