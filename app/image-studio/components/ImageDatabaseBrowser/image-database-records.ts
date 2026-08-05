export type ImageDatabaseSource = 'generation_history' | 'favorites' | 'logo_history'
export type ImageDatabaseSourceFilter = 'all' | ImageDatabaseSource

export interface ImageDatabaseRecord {
  recordId: string
  sourceId: string
  source: ImageDatabaseSource
  url: string
  prompt?: string
  detail?: string
  timestamp: number
}

interface HistoryResponseItem {
  id: string
  prompt?: string
  aspectRatio?: string | null
  imageUrls?: string[]
  timestamp: number
}

interface FavoriteResponseItem {
  id: string
  url: string
  timestamp: number
  metadata?: {
    ratio?: string | null
    style?: string | null
  }
}

interface LogoResponseItem {
  id: string
  imageUrl: string
  prompt?: string
  timestamp: number
  style?: string | null
}

interface ImageDatabaseInputs {
  history?: HistoryResponseItem[]
  favorites?: FavoriteResponseItem[]
  logoHistory?: LogoResponseItem[]
}

function isRemoteImageUrl(url: unknown): url is string {
  return typeof url === 'string' && /^https?:\/\//i.test(url)
}

export function buildImageDatabaseRecords({
  history = [],
  favorites = [],
  logoHistory = [],
}: ImageDatabaseInputs): ImageDatabaseRecord[] {
  const records: Array<ImageDatabaseRecord & { sortOrder: number }> = []
  let sortOrder = 0

  for (const item of history) {
    for (const [index, url] of (item.imageUrls ?? []).entries()) {
      if (!isRemoteImageUrl(url)) continue
      records.push({
        recordId: `${item.id}:${index + 1}`,
        sourceId: item.id,
        source: 'generation_history',
        url,
        prompt: item.prompt,
        detail: item.aspectRatio ?? undefined,
        timestamp: item.timestamp,
        sortOrder: sortOrder++,
      })
    }
  }

  for (const item of favorites) {
    if (!isRemoteImageUrl(item.url)) continue
    records.push({
      recordId: item.id,
      sourceId: item.id,
      source: 'favorites',
      url: item.url,
      detail: [item.metadata?.style, item.metadata?.ratio].filter(Boolean).join(' · ') || undefined,
      timestamp: item.timestamp,
      sortOrder: sortOrder++,
    })
  }

  for (const item of logoHistory) {
    if (!isRemoteImageUrl(item.imageUrl)) continue
    records.push({
      recordId: item.id,
      sourceId: item.id,
      source: 'logo_history',
      url: item.imageUrl,
      prompt: item.prompt,
      detail: item.style ?? undefined,
      timestamp: item.timestamp,
      sortOrder: sortOrder++,
    })
  }

  return records
    .sort((a, b) => b.timestamp - a.timestamp || a.sortOrder - b.sortOrder)
    .map(({ sortOrder: _sortOrder, ...record }) => record)
}

export function filterImageDatabaseRecords(
  records: ImageDatabaseRecord[],
  source: ImageDatabaseSourceFilter,
  query: string,
): ImageDatabaseRecord[] {
  const normalizedQuery = query.trim().toLowerCase()

  return records.filter((record) => {
    if (source !== 'all' && record.source !== source) return false
    if (!normalizedQuery) return true

    return [record.recordId, record.sourceId, record.source, record.url, record.prompt, record.detail]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery))
  })
}
