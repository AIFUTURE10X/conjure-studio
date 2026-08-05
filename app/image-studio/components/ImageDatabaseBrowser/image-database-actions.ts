import type { ImageDatabaseRecord } from './image-database-records'

export function historyRestorePayload(record: ImageDatabaseRecord, userId: string) {
  return {
    userId,
    prompt: record.prompt || 'Restored database image',
    aspectRatio: record.aspectRatio || '1:1',
    imageUrls: [record.url],
    metadata: { style: record.style },
    restoreOnlyIfMissing: true,
  }
}

export function favoriteRestorePayload(record: ImageDatabaseRecord, userId: string) {
  return {
    userId,
    imageUrl: record.url,
    metadata: {
      ratio: record.aspectRatio,
      style: record.style,
      params: {
        mainPrompt: record.prompt,
        aspectRatio: record.aspectRatio,
      },
    },
    restoreOnlyIfMissing: true,
  }
}

export function restoredTargetsForUrl(records: ImageDatabaseRecord[], url: string) {
  return {
    history: records.some((record) => record.source === 'generation_history' && record.url === url),
    favorites: records.some((record) => record.source === 'favorites' && record.url === url),
  }
}
