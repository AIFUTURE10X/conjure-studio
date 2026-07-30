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
 * Row identifier for DELETE /api/video-history.
 *
 * `id` mirrors `numericIdSchema` rather than importing it, for the same reason
 * this module composes `userId` at the route: importing the shared validation
 * barrel would drag the logo contract in and cost this module its zod-only
 * property, which is what lets the contract check execute it headlessly.
 *
 * Coercion is deliberate — the id arrives as a query-string value — but a
 * missing, blank, fractional or non-numeric id must fail rather than coerce to
 * something that would target the wrong row (or every row).
 */
export const videoHistoryDeleteParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type VideoHistoryDeleteParams = z.output<typeof videoHistoryDeleteParamsSchema>

export type VideoDeleteOutcome =
  | { ok: true }
  | { ok: false; status: 404; code: 'not_found' }

/**
 * Decide what a DELETE that matched `deletedRowCount` rows should answer.
 *
 * Lives here, as a pure function, so the contract check can EXECUTE it — the
 * route body needs a live Neon connection and cannot be run headlessly. Keeping
 * the decision out of the handler is what makes "a no-op must not report success"
 * a testable claim rather than a regex over source that a comment can satisfy.
 *
 * Zero rows is the interesting case: the WHERE clause refuses another user's row
 * and any still-pending job, so a caller can legitimately hit it. Reporting
 * success there would make the client drop a row the database still holds.
 */
export function resolveVideoDeleteOutcome(deletedRowCount: number): VideoDeleteOutcome {
  return deletedRowCount > 0 ? { ok: true } : { ok: false, status: 404, code: 'not_found' }
}

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
