/**
 * Contract: a Blob outage must degrade the history save, never fail it.
 *
 * If Vercel Blob is unavailable the generation must still land in Neon with the
 * original URL / data URI, and reads must still find the image. Losing the row
 * because the CDN blipped is the worst possible failure mode — the image is
 * already generated and the credits are already spent.
 *
 * Note on scope: the upload+insert logic moved out of app/api/history/route.ts
 * into lib/db/generation-history-store.ts (shared with /api/generate-image), and
 * the read-side fallback moved from JavaScript into SQL. This check used to pin
 * the old location and had been failing silently on master because it was never
 * wired into CI — see check:ci-coverage, which now makes that impossible.
 *
 * These are source-level pins: every statement involved is IO (Blob upload,
 * Neon SQL), so executing it here is not practical.
 */

const fs = require('fs')
const path = require('path')

const root = process.cwd()

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const store = read('lib/db/generation-history-store.ts')
const historyRoute = read('app/api/history/route.ts')
const packageJson = read('package.json')

assert(
  /"check:history-blob-fallback":\s*"node scripts\/check-history-blob-fallback\.cjs"/.test(packageJson),
  'package.json must expose check:history-blob-fallback.',
)

assert(
  /Blob upload failed for image \$\{i \+ 1\}, storing URL directly/.test(store),
  'The history store must treat Blob upload failure as a fallback, not a hard save failure.',
)

assert(
  /blobUrls\.push\(blobUrl \?\? imageUrl\)/.test(store),
  'The history store must fall back to the original URL when Blob upload returns nothing.',
)

assert(
  /image_urls, blob_urls/.test(store) && /\$\{storedImageUrls\}, \$\{blobUrls\}/.test(store),
  'The history store must write both image_urls and blob_urls so either can serve the read.',
)

assert(
  /unnest\(COALESCE\(blob_urls, image_urls\)\)/.test(historyRoute),
  'History GET must fall back to image_urls when blob_urls is null.',
)

assert(
  !/return apiError\(500,\s*'blob_upload_failed'/.test(historyRoute),
  'History API must not return 500 solely because Blob upload is unavailable.',
)

console.log('✅ History Blob fallback contract passed')
