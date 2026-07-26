import { z } from 'zod'

/**
 * Query contract for GET /api/video-history's paged/filtered listing.
 *
 * Kept free of every import except zod so `scripts/check-video-history-query.cjs`
 * can transpile and EXECUTE it headlessly. The route composes these params with
 * `userIdSchema` itself rather than this module importing the shared validation
 * barrel, which would drag the logo contract (and its own imports) in with it.
 */

export const VIDEO_HISTORY_PAGE_SIZE = 50
export const VIDEO_HISTORY_MAX_LIMIT = 100
export const VIDEO_HISTORY_MAX_SEARCH_LENGTH = 200

/**
 * Query params arrive as strings, but the same schema is reused in tests where
 * booleans are natural. Anything outside this set is a validation failure, not a
 * silent `false` — `favoritesOnly=yes` is a caller bug worth surfacing.
 */
const booleanParamSchema = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((value) => value === true || value === 'true' || value === '1')

export const videoHistoryListParamsSchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(VIDEO_HISTORY_MAX_LIMIT)
    .default(VIDEO_HISTORY_PAGE_SIZE),
  offset: z.coerce.number().int().min(0).default(0),
  // A cleared search box sends `search=`; treat blank as absent so it widens the
  // list again instead of filtering on the empty string.
  search: z
    .string()
    .max(VIDEO_HISTORY_MAX_SEARCH_LENGTH)
    .optional()
    .transform((value) => {
      const trimmed = value?.trim()
      return trimmed ? trimmed : undefined
    }),
  favoritesOnly: booleanParamSchema.default(false),
})

export type VideoHistoryListParams = z.output<typeof videoHistoryListParamsSchema>

/**
 * Wrap a user's search term for ILIKE, escaping the wildcards first.
 *
 * Without this a prompt search for "50%" matches every row, and "_" matches any
 * character. Pair with `ESCAPE '\'` in the query.
 */
export function buildPromptSearchPattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`
}

/**
 * One row is fetched beyond the page so the caller learns whether more exist
 * without a second COUNT query.
 */
export function pageFetchLimit(limit: number): number {
  return limit + 1
}

/** Split an over-fetched result into the page proper and a hasMore flag. */
export function splitPage<T>(rows: T[], limit: number): { page: T[]; hasMore: boolean } {
  const hasMore = rows.length > limit
  return { page: hasMore ? rows.slice(0, limit) : rows, hasMore }
}
