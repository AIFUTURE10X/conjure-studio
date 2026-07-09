// localStorage helpers for App Tracker

/**
 * Get data from localStorage with error handling
 */
export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue

  try {
    const item = localStorage.getItem(key)
    if (!item) return defaultValue
    return JSON.parse(item) as T
  } catch (error) {
    console.error(`[AppTracker] Error reading from localStorage key "${key}":`, error)
    return defaultValue
  }
}

/**
 * Save data to localStorage with error handling
 */
export function saveToStorage<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false

  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`[AppTracker] Error saving to localStorage key "${key}":`, error)
    return false
  }
}

/**
 * Remove data from localStorage
 */
export function removeFromStorage(key: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`[AppTracker] Error removing from localStorage key "${key}":`, error)
    return false
  }
}

/**
 * Check if a key exists in localStorage
 */
export function existsInStorage(key: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    return localStorage.getItem(key) !== null
  } catch {
    return false
  }
}
