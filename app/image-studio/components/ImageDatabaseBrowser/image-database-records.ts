export type ImageDatabaseSource = 'generation_history' | 'favorites' | 'logo_history'
export type ImageDatabaseSourceFilter = 'all' | ImageDatabaseSource
export type ImageDatabaseMedia = 'images' | 'logos'

export interface ImageDatabaseRecord {
  recordId: string
  sourceId: string
  source: ImageDatabaseSource
  mediaType: 'image' | 'logo'
  url: string
  prompt?: string
  detail?: string
  aspectRatio?: string
  style?: string
  title?: string | null
  category?: string | null
  tags?: string[]
  timestamp: number
}

interface CreationMetadataResponseItem {
  mediaType: 'image' | 'logo' | 'video'
  mediaUrl: string
  title: string | null
  category: string | null
  tags: string[]
}

interface HistoryResponseItem {
  id: string
  prompt?: string
  aspectRatio?: string | null
  imageUrls?: string[]
  timestamp: number
  metadata?: {
    style?: string | null
  }
}

interface FavoriteResponseItem {
  id: string
  url: string
  prompt?: string
  timestamp: number
  metadata?: {
    ratio?: string | null
    style?: string | null
    params?: {
      mainPrompt?: string
      aspectRatio?: string
    } | null
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
        mediaType: 'image',
        url,
        prompt: item.prompt,
        detail: item.aspectRatio ?? undefined,
        aspectRatio: item.aspectRatio ?? undefined,
        style: item.metadata?.style ?? undefined,
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
      mediaType: 'image',
      url: item.url,
      prompt: item.prompt || item.metadata?.params?.mainPrompt,
      detail: [item.metadata?.style, item.metadata?.ratio].filter(Boolean).join(' · ') || undefined,
      aspectRatio: item.metadata?.ratio || item.metadata?.params?.aspectRatio || undefined,
      style: item.metadata?.style ?? undefined,
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
      mediaType: 'logo',
      url: item.imageUrl,
      prompt: item.prompt,
      detail: item.style ?? undefined,
      style: item.style ?? undefined,
      timestamp: item.timestamp,
      sortOrder: sortOrder++,
    })
  }

  return records
    .sort((a, b) => b.timestamp - a.timestamp || a.sortOrder - b.sortOrder)
    .map(({ sortOrder: _sortOrder, ...record }) => record)
}

export function applyCreationMetadata(
  records: ImageDatabaseRecord[],
  metadata: CreationMetadataResponseItem[],
): ImageDatabaseRecord[] {
  const byMedia = new Map(
    metadata.map((item) => [`${item.mediaType}\u0000${item.mediaUrl}`, item]),
  )

  return records.map((record) => {
    const item = byMedia.get(`${record.mediaType}\u0000${record.url}`)
    if (!item) return record
    return {
      ...record,
      title: item.title,
      category: item.category,
      tags: item.tags,
    }
  })
}

export function filterImageDatabaseRecords(
  records: ImageDatabaseRecord[],
  source: ImageDatabaseSourceFilter,
  query: string,
  category = 'all',
  tag = 'all',
): ImageDatabaseRecord[] {
  const normalizedQuery = query.trim().toLowerCase()
  const normalizedCategory = category.trim().toLowerCase()
  const normalizedTag = tag.trim().toLowerCase()

  return records.filter((record) => {
    if (source !== 'all' && record.source !== source) return false
    if (normalizedCategory !== 'all' && record.category?.toLowerCase() !== normalizedCategory) return false
    if (normalizedTag !== 'all' && !record.tags?.some((value) => value.toLowerCase() === normalizedTag)) return false
    if (!normalizedQuery) return true

    return [
      record.recordId,
      record.sourceId,
      record.source,
      record.url,
      record.title,
      record.category,
      record.tags?.join(' '),
      record.prompt,
      record.detail,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery))
  })
}

export function filterImageDatabaseRecordsByMedia(
  records: ImageDatabaseRecord[],
  media: ImageDatabaseMedia,
): ImageDatabaseRecord[] {
  return records.filter((record) => (
    media === 'logos' ? record.source === 'logo_history' : record.source !== 'logo_history'
  ))
}
