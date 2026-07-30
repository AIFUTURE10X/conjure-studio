/**
 * Unified User ID Management
 *
 * Consolidates all user ID generation into one shared utility.
 * Auto-migrates from legacy localStorage keys to prevent data orphaning.
 * Supports merging multiple user accounts into one.
 */

const USER_ID_KEY = 'genie-user-id'

// Legacy keys from different parts of the app - checked for migration
const LEGACY_KEYS = [
  'logo-history-user-id',   // Logo history system
  'user_id',                // Regular image history
  'anonymous-user-id',      // Favorites/generated images
]

/**
 * Get or create a unified user ID.
 *
 * On first call:
 * 1. Checks for existing unified ID
 * 2. If not found, migrates from any legacy key
 * 3. If no legacy ID, generates new one
 *
 * This ensures all systems use the same user ID and
 * existing data is not orphaned after code updates.
 */
export function getUserId(): string {
  if (typeof window === 'undefined') return 'server'

  // Try unified key first
  let userId = localStorage.getItem(USER_ID_KEY)

  // Migrate from legacy keys if unified doesn't exist
  if (!userId) {
    for (const legacyKey of LEGACY_KEYS) {
      const legacyId = localStorage.getItem(legacyKey)
      if (legacyId) {
        userId = legacyId
        // Migrate to unified key
        localStorage.setItem(USER_ID_KEY, userId)
        console.log(`[User ID] Migrated from '${legacyKey}' to unified key: ${userId}`)
        break
      }
    }
  }

  // Generate new if nothing found
  if (!userId) {
    userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    localStorage.setItem(USER_ID_KEY, userId)
    console.log(`[User ID] Generated new user ID: ${userId}`)
  }

  return userId
}

/**
 * Get all known user IDs from localStorage (for debugging/recovery)
 */
export function getAllUserIds(): Record<string, string | null> {
  if (typeof window === 'undefined') return {}

  return {
    unified: localStorage.getItem(USER_ID_KEY),
    ...LEGACY_KEYS.reduce((acc, key) => {
      acc[key] = localStorage.getItem(key)
      return acc
    }, {} as Record<string, string | null>),
  }
}

/**
 * Return every browser-side user id this install may have used.
 *
 * Older studio builds wrote favorites, image history, and logo history with
 * different localStorage keys. Account claiming needs the full set, otherwise
 * rows remain in Neon but are hidden behind a stale browser id.
 */
export function getKnownUserIds(): string[] {
  if (typeof window === 'undefined') return []

  const ids = [
    getUserId(),
    localStorage.getItem(USER_ID_KEY),
    ...LEGACY_KEYS.map(key => localStorage.getItem(key)),
  ]

  return Array.from(new Set(ids.filter((id): id is string => Boolean(id))))
}

/**
 * Force set a specific user ID (for recovery purposes)
 */
export function setUserId(userId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_ID_KEY, userId)
  console.log(`[User ID] Manually set user ID: ${userId}`)
}

// Transient ids whose /api/device/claim sweep failed — retried on later boots
// so a claim outage can't strand the few rows written under a fresh id.
const UNCLAIMED_IDS_KEY = 'genie-unclaimed-ids'

function readUnclaimedIds(): string[] {
  try {
    const raw = localStorage.getItem(UNCLAIMED_IDS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function writeUnclaimedIds(ids: string[]): void {
  try {
    if (ids.length === 0) localStorage.removeItem(UNCLAIMED_IDS_KEY)
    else localStorage.setItem(UNCLAIMED_IDS_KEY, JSON.stringify(ids.slice(0, 20)))
  } catch {
    // Best effort — losing the retry list only skips a re-claim attempt.
  }
}

export type DurableIdentityResult = {
  /** True when the durable cookie id replaced a different localStorage id. */
  adopted: boolean
  /** Rows moved by the transient-id sweep (0 when nothing needed claiming). */
  moved: number
}

/**
 * Restore the durable device identity from the server-side cookie backup.
 *
 * The anonymous id used to live only in localStorage, so any storage
 * eviction (browser cleanup, Safari ITP, "clear site data") minted a fresh
 * id and orphaned every server-side row — history and favorites looked
 * permanently lost. The handshake mirrors the id into a 400-day httpOnly
 * cookie; when localStorage and cookie disagree, the cookie wins: rows
 * written under the transient localStorage id are swept into the durable id
 * via /api/device/claim, then the durable id is adopted locally.
 *
 * Call once per page load, before treating locally-fetched data as complete.
 */
export async function restoreDurableIdentity(): Promise<DurableIdentityResult> {
  if (typeof window === 'undefined') return { adopted: false, moved: 0 }

  // Ask the browser to exempt this origin's storage from automatic eviction.
  try {
    void navigator.storage?.persist?.()
  } catch {
    // Optional API — unsupported browsers just keep the cookie safety net.
  }

  const localId = getUserId()
  const response = await fetch('/api/device', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: localId }),
  })
  if (!response.ok) throw new Error(`Device handshake failed (${response.status})`)
  const deviceId = ((await response.json()) as { deviceId?: string }).deviceId
  if (!deviceId) throw new Error('Device handshake returned no id')

  // Sweep only the transient id (when one was minted) plus any earlier
  // failed sweeps. Legacy localStorage keys are claimed once, marker-gated,
  // by StudioTopBar — re-claiming them here on every boot would be a wasted
  // round-trip per page load.
  const adopted = deviceId !== localId
  const legacyUserIds = Array.from(
    new Set([...(adopted ? [localId] : []), ...readUnclaimedIds()]),
  ).filter((id) => id !== deviceId)

  let moved = 0
  if (legacyUserIds.length > 0) {
    try {
      const claim = await fetch('/api/device/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: deviceId, legacyUserIds: legacyUserIds.slice(0, 20) }),
      })
      if (!claim.ok) throw new Error(`Device claim failed (${claim.status})`)
      const claimData = (await claim.json().catch(() => null)) as { moved?: number } | null
      moved = typeof claimData?.moved === 'number' ? claimData.moved : 0
      writeUnclaimedIds([])
    } catch (error) {
      // Still adopt the durable id — but remember the transient ids so a
      // later boot can finish the sweep.
      writeUnclaimedIds(Array.from(new Set([...readUnclaimedIds(), ...legacyUserIds])))
      console.error('[User ID] Transient-id claim failed (will retry next visit):', error)
    }
  }

  if (adopted) {
    setUserId(deviceId)
    console.log(`[User ID] Restored durable device id from cookie: ${deviceId}`)
  }
  return { adopted, moved }
}

/**
 * Fetch all user accounts from the database with their logo counts
 */
export async function fetchAllUserAccounts(): Promise<{
  userId: string
  count: number
  lastCreated: string
}[]> {
  try {
    const response = await fetch('/api/logo-history/debug')
    if (!response.ok) throw new Error('Failed to fetch user accounts')
    const data = await response.json()
    return data.userCounts || []
  } catch (error) {
    console.error('[User ID] Failed to fetch accounts:', error)
    return []
  }
}

/**
 * Merge all user accounts into the current user ID
 * All logos from other accounts will be moved to the current account
 */
export async function mergeAllAccounts(): Promise<{
  success: boolean
  merged: number
  error?: string
}> {
  const currentUserId = getUserId()

  try {
    const response = await fetch('/api/logo-history/debug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: currentUserId })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Merge failed')
    }

    const result = await response.json()
    console.log(`[User ID] Merged ${result.merged} logos into ${currentUserId}`)
    return { success: true, merged: result.merged }
  } catch (error) {
    console.error('[User ID] Merge failed:', error)
    return {
      success: false,
      merged: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Switch to a different user account
 */
export function switchToAccount(userId: string): void {
  setUserId(userId)
  // Reload to fetch the new account's data
  window.location.reload()
}
