import type { HistoryItem } from '@/lib/history'

/**
 * Lightbox indexing for the history panel.
 *
 * A history item holds a whole generation batch, so the flat list the lightbox
 * browses is longer than the list of cards. Keeping the maths here (pure, no
 * React) is what lets the contract check execute it — the panel previously
 * located an image by URL lookup, which silently opened the wrong copy whenever
 * two generations shared an image URL.
 */

export interface PreviewImage {
  url: string
  prompt: string
}

/** Every image across every generation, in card order. */
export function flattenPreviewImages(history: HistoryItem[]): PreviewImage[] {
  return history.flatMap((item) =>
    (item.imageUrls ?? []).map((url) => ({ url, prompt: item.prompt })),
  )
}

/**
 * Flat index of image `imageIndex` of item `itemId` within flattenPreviewImages.
 * Returns null when the item is unknown or the image index is out of range.
 */
export function previewIndexFor(
  history: HistoryItem[],
  itemId: string,
  imageIndex: number,
): number | null {
  let offset = 0
  for (const item of history) {
    const length = item.imageUrls?.length ?? 0
    if (item.id === itemId) {
      if (imageIndex < 0 || imageIndex >= length) return null
      return offset + imageIndex
    }
    offset += length
  }
  return null
}
