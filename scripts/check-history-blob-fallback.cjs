const fs = require('fs')
const path = require('path')

const root = process.cwd()

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const route = read('app/api/history/route.ts')
const store = read('lib/db/generation-history-store.ts')
const limits = read('lib/history-limits.ts')
const packageJson = read('package.json')

assert(
  /"check:history-blob-fallback":\s*"node scripts\/check-history-blob-fallback\.cjs"/.test(packageJson),
  'package.json must expose check:history-blob-fallback.',
)

assert(
  !/return apiError\(500,\s*'blob_upload_failed'/.test(route),
  'History API must not return 500 solely because Blob upload is unavailable.',
)

assert(/Blob upload failed[\s\S]*storing URL directly/.test(store),
  'History storage must preserve the original URL when Blob upload fails.')
assert(/COALESCE\(blob_urls, image_urls\)/.test(route),
  'History GET must fall back to image_urls when blob_urls is empty or null.')
assert(/MAX_INLINE_HISTORY_DATA_URI_LENGTH/.test(route) && /3_500_000/.test(limits),
  'History POST must enforce the shared inline data-URI limit.')

console.log('History Blob fallback contract passed')
