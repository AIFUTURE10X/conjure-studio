// IndexedDB helper for local caching of favorites and generation history.
// IndexedDB is used (instead of localStorage) for durable, large-capacity
// caching so synced history survives reopens without a re-sync and without
// hitting localStorage's ~5MB quota.
const DB_NAME = 'ImageStudioDB'
const DB_VERSION = 2
const FAVORITES_STORE = 'favorites'
const HISTORY_STORE = 'history'

interface CachedFavorite {
  id: string
  imageUrl: string
  blob?: Blob
  timestamp: number
  metadata?: any
}

interface CachedHistoryItem {
  id: string
  timestamp: number
  [key: string]: unknown
}

class IndexedDBHelper {
  private db: IDBDatabase | null = null

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains(FAVORITES_STORE)) {
          const store = db.createObjectStore(FAVORITES_STORE, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }

        if (!db.objectStoreNames.contains(HISTORY_STORE)) {
          const store = db.createObjectStore(HISTORY_STORE, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  // ---- Generation history (durable local cache) ----

  /** Upsert history items in a single transaction (accumulates across syncs). */
  async putHistoryItems(items: CachedHistoryItem[]): Promise<void> {
    if (!items.length) return
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([HISTORY_STORE], 'readwrite')
      const store = transaction.objectStore(HISTORY_STORE)
      for (const item of items) {
        if (item && item.id) store.put(item)
      }
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
  }

  async getAllHistoryItems(): Promise<CachedHistoryItem[]> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([HISTORY_STORE], 'readonly')
      const request = transaction.objectStore(HISTORY_STORE).getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async removeHistoryItem(id: string): Promise<void> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([HISTORY_STORE], 'readwrite')
      const request = transaction.objectStore(HISTORY_STORE).delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clearAllHistory(): Promise<void> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([HISTORY_STORE], 'readwrite')
      const request = transaction.objectStore(HISTORY_STORE).clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async cacheFavorite(favorite: CachedFavorite): Promise<void> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FAVORITES_STORE], 'readwrite')
      const store = transaction.objectStore(FAVORITES_STORE)
      const request = store.put(favorite)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getCachedFavorite(id: string): Promise<CachedFavorite | null> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FAVORITES_STORE], 'readonly')
      const store = transaction.objectStore(FAVORITES_STORE)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllCachedFavorites(): Promise<CachedFavorite[]> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FAVORITES_STORE], 'readonly')
      const store = transaction.objectStore(FAVORITES_STORE)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async deleteCachedFavorite(id: string): Promise<void> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FAVORITES_STORE], 'readwrite')
      const store = transaction.objectStore(FAVORITES_STORE)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clearAllFavorites(): Promise<void> {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FAVORITES_STORE], 'readwrite')
      const store = transaction.objectStore(FAVORITES_STORE)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

export const indexedDBHelper = new IndexedDBHelper()
