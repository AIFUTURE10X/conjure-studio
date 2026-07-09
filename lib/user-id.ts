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
 * Force set a specific user ID (for recovery purposes)
 */
export function setUserId(userId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_ID_KEY, userId)
  console.log(`[User ID] Manually set user ID: ${userId}`)
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
