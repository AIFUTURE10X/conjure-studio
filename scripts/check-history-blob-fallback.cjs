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
const packageJson = read('package.json')

assert(
  /"check:history-blob-fallback":\s*"node scripts\/check-history-blob-fallback\.cjs"/.test(packageJson),
  'package.json must expose check:history-blob-fallback.',
)

assert(
  /Blob upload failed, storing image directly/.test(route),
  'History API must treat Blob upload failure as a fallback, not a hard save failure.',
)

assert(
  /storedImageUrls/.test(route) &&
    /image_urls,\s*blob_urls/.test(route) &&
    /\$\{storedImageUrls\},\s*\$\{storedBlobUrls\}/.test(route),
  'History API must store direct image URLs when Blob upload is unavailable.',
)

assert(
  /Array\.isArray\(item\.blob_urls\)\s*&&\s*item\.blob_urls\.length > 0/.test(route),
  'History GET must fall back to image_urls when blob_urls is empty or null.',
)

assert(
  !/return apiError\(500,\s*'blob_upload_failed'/.test(route),
  'History API must not return 500 solely because Blob upload is unavailable.',
)

console.log('History Blob fallback contract passed')
