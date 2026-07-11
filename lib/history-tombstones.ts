/**
 * Tombstones for deleted history items.
 *
 * Deletes must survive a cloud sync: anything the user removed locally may
 * still exist in Neon (a failed DELETE, or a legacy row whose local copy was
 * cached under a client UUID while Neon assigned its own serial id), and an
 * additive sync would otherwise resurrect it. Two capped tombstone sets make
 * that impossible: deleted ids, and deleted image URLs (the URL set catches
 * rows whose ids never matched between the cache and Neon).
 */

const DELETED_IDS_KEY = "history_deleted_ids"
const DELETED_URLS_KEY = "history_deleted_urls"
const MAX_TOMBSTONES = 500
// Data-URI images are huge and never survive a round-trip to Neon anyway.
const MAX_TOMBSTONE_URL_LENGTH = 600

function readSet(key: string): Set<string> {
  try {
    const stored = localStorage.getItem(key)
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function persistSet(key: string, values: Set<string>): void {
  try {
    localStorage.setItem(key, JSON.stringify([...values].slice(-MAX_TOMBSTONES)))
  } catch (err) {
    console.error("[v0] Failed to save history tombstones:", err)
  }
}

export function getDeletedIds(): Set<string> {
  return readSet(DELETED_IDS_KEY)
}

export function addDeletedId(id: string): void {
  const ids = readSet(DELETED_IDS_KEY)
  ids.add(id)
  persistSet(DELETED_IDS_KEY, ids)
}

export function getDeletedUrls(): Set<string> {
  return readSet(DELETED_URLS_KEY)
}

export function addDeletedUrls(urls: string[] | undefined): void {
  const usable = (urls ?? []).filter((url) => url && url.length <= MAX_TOMBSTONE_URL_LENGTH)
  if (usable.length === 0) return
  const set = readSet(DELETED_URLS_KEY)
  usable.forEach((url) => set.add(url))
  persistSet(DELETED_URLS_KEY, set)
}

/** True when the item was deleted — matched by id or by any of its images. */
export function isTombstoned(
  item: { id: string; imageUrls?: string[] },
  deletedIds: Set<string>,
  deletedUrls: Set<string>,
): boolean {
  if (deletedIds.has(item.id)) return true
  return (item.imageUrls ?? []).some((url) => deletedUrls.has(url))
}

/** Only safe once the cloud is confirmed clean (every remote delete succeeded). */
export function clearTombstones(): void {
  localStorage.removeItem(DELETED_IDS_KEY)
  localStorage.removeItem(DELETED_URLS_KEY)
}
