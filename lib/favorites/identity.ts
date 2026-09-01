/**
 * Identity rules for favorites, shared by the client hook and the API route.
 *
 * A favorites row carries two urls. `url` is the `favorites/` blob copy the
 * server makes when the image is saved; `sourceUrl` is the url the client was
 * displaying when the user clicked the star. The grid only ever knows the
 * second one, so any "is this already favorited?" question has to accept
 * either — matching on `url` alone is what left every star unfilled and turned
 * each extra click into a duplicate row.
 *
 * Deliberately dependency-free: scripts/check-favorites-toggle.cjs transpiles
 * this module and executes it with a stubbed `require`, so an import here would
 * have to be stubbed as well.
 */

/** The subset of a favorite that says which image it points at. */
export interface FavoriteTarget {
  url: string
  sourceUrl?: string | null
}

/** True when `url` is either the stored blob copy or the original source url. */
export function matchesFavorite(favorite: FavoriteTarget, url: string): boolean {
  if (!url || !favorite) return false
  if (favorite.url === url) return true
  return Boolean(favorite.sourceUrl) && favorite.sourceUrl === url
}

/** First favorite pointing at `url`, by either of its two urls. */
export function findFavoriteByUrl<T extends FavoriteTarget>(
  favorites: readonly T[],
  url: string
): T | undefined {
  if (!url) return undefined
  return favorites.find((favorite) => matchesFavorite(favorite, url))
}

/**
 * Longest source url worth storing. Comfortably clears real blob/CDN urls while
 * excluding anything payload-shaped.
 */
export const MAX_SOURCE_URL_LENGTH = 2048

/**
 * Whether a source url can be persisted as-is.
 *
 * Generated images reach the client as multi-MB `data:` URIs. Copying one into
 * every favorites row would bloat the table and — worse — put megabytes per row
 * into the favorites GET response, the same read-side failure that took image
 * history down. Those images are identified by `content_hash` instead, so only
 * ordinary http(s) urls are stored here.
 */
export function persistableSourceUrl(url: string): string | null {
  if (!url) return null
  if (!/^https?:\/\//i.test(url)) return null
  if (url.length > MAX_SOURCE_URL_LENGTH) return null
  return url
}
