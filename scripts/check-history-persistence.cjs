/**
 * Contract: an image that reaches the grid is saved, shown, and recoverable.
 *
 * Image history has broken repeatedly, in two distinct ways:
 *
 *   1. Saved images looked lost. A generation row holds the whole batch, but
 *      the card rendered imageUrls[0] and reduced the rest to a "+N more"
 *      badge, so a 2-image batch read as "only the first one saved".
 *   2. Saves failed silently. A single-attempt INSERT plus a swallowed error
 *      meant one transient Neon hiccup permanently dropped a generation, with
 *      nothing but an auto-dismissing toast to say so.
 *
 * The lightbox indexing below is EXECUTED against the real shipped module —
 * a regex-only pin keeps passing after the behaviour regresses. The rest are
 * source-level pins anchored to the specific statement carrying each
 * guarantee, because they live inside React components and IO (Blob, SQL).
 */

const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

const PREVIEW_PATH = 'app/image-studio/components/ParameterHistoryPanel/history-preview.ts'
const IMAGES_PATH = 'app/image-studio/components/ParameterHistoryPanel/HistoryItemImages.tsx'
const CARD_PATH = 'app/image-studio/components/ParameterHistoryPanel/HistoryItemCard.tsx'
const PANEL_PATH = 'app/image-studio/components/ParameterHistoryPanel/ParameterHistoryPanel.tsx'
const HEADER_PATH = 'app/image-studio/components/ParameterHistoryPanel/HistoryHeader.tsx'
const STORE_PATH = 'lib/db/generation-history-store.ts'
const ROUTE_PATH = 'app/api/generate-image/route.ts'
const HOOK_PATH = 'app/image-studio/hooks/useImageGeneration.ts'
const PROVIDER_PATH = 'app/image-studio/context/ImageGenerationProvider.tsx'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertEqual(received, expected, message) {
  const got = JSON.stringify(received)
  const want = JSON.stringify(expected)
  if (got !== want) {
    throw new Error(`${message}\n  expected: ${want}\n  received: ${got}`)
  }
}

/**
 * Load and EXECUTE the real preview-index helper. Its only import is a type,
 * which transpiles away, so no stubbing is needed beyond an inert require.
 */
function loadPreviewModule() {
  const { outputText } = ts.transpileModule(read(PREVIEW_PATH), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: PREVIEW_PATH,
  })
  const mod = { exports: {} }
  new Function('exports', 'require', 'module', outputText)(mod.exports, () => ({}), mod)
  return mod.exports
}

const { flattenPreviewImages, previewIndexFor } = loadPreviewModule()

assert(
  typeof flattenPreviewImages === 'function' && typeof previewIndexFor === 'function',
  `${PREVIEW_PATH} must export flattenPreviewImages and previewIndexFor.`,
)

// Two generations, the first a 2-image batch — the exact shape that produced
// the "the second image was never saved" report.
const HISTORY = [
  { id: '837', prompt: 'laptop, golden hour', aspectRatio: '16:9', timestamp: 2, imageUrls: ['a.png', 'b.png'] },
  { id: '836', prompt: 'studio portrait', aspectRatio: '1:1', timestamp: 1, imageUrls: ['c.png'] },
]

assertEqual(
  flattenPreviewImages(HISTORY).map((image) => image.url),
  ['a.png', 'b.png', 'c.png'],
  'Every image of every generation must reach the lightbox list, not just the first of each.',
)

assertEqual(
  previewIndexFor(HISTORY, '837', 1),
  1,
  'Opening the SECOND image of a batch must open that image, not the first.',
)
assertEqual(previewIndexFor(HISTORY, '837', 0), 0, 'First image of the first generation is index 0.')
assertEqual(
  previewIndexFor(HISTORY, '836', 0),
  2,
  'A later generation must be offset by every image before it, not by its card position.',
)
assertEqual(previewIndexFor(HISTORY, '836', 1), null, 'Out-of-range image index must not open a neighbour.')
assertEqual(previewIndexFor(HISTORY, 'missing', 0), null, 'Unknown item id must not resolve to an index.')

// Duplicate URLs across generations: this is what URL-lookup indexing got
// wrong — an AI edit saved next to its source opened the older copy.
const SHARED = [
  { id: '2', prompt: 'edit', aspectRatio: '1:1', timestamp: 2, imageUrls: ['same.png'] },
  { id: '1', prompt: 'source', aspectRatio: '1:1', timestamp: 1, imageUrls: ['same.png'] },
]
assertEqual(
  previewIndexFor(SHARED, '1', 0),
  1,
  'Two generations sharing an image URL must still resolve to their own lightbox entry.',
)

// --- Source-level pins (React render paths and IO) ---

const images = read(IMAGES_PATH)
assert(
  /imageUrls\.map\(\(url, index\)/.test(images),
  `${IMAGES_PATH} must render every image of a batch (imageUrls.map), not just imageUrls[0].`,
)
assert(
  !/\+\{?\s*imageUrls\.length\s*-\s*1\s*\}?\s*more/.test(images),
  `${IMAGES_PATH} must not collapse extra images back into a "+N more" badge.`,
)

const card = read(CARD_PATH)
assert(
  /<HistoryItemImages[\s\S]{0,200}imageUrls=\{item\.imageUrls\}/.test(card),
  `${CARD_PATH} must hand the full imageUrls array to HistoryItemImages.`,
)
assert(
  /\{item\.imageUrls\?\.length \?\? 0\} \{item\.imageUrls\?\.length === 1 \? 'image' : 'images'\}/.test(card),
  `${CARD_PATH} must show how many images the generation holds.`,
)

const panel = read(PANEL_PATH)
assert(
  /previewIndexFor\(history, item\.id, imageIndex\)/.test(panel),
  `${PANEL_PATH} must locate previews via previewIndexFor, not by URL lookup.`,
)

const header = read(HEADER_PATH)
assert(
  /\$\{imageCount\} \$\{imageCount === 1 \? 'image' : 'images'\} saved/.test(header),
  `${HEADER_PATH} must report images saved, not just the number of cards.`,
)

const store = read(STORE_PATH)
assert(
  /const INSERT_ATTEMPTS = ([2-9]|\d{2,})/.test(store),
  `${STORE_PATH} must retry the history INSERT — one transient failure must not lose a generation.`,
)
assert(
  /WHERE user_id = \$\{userId\} AND blob_urls = \$\{blobUrls\}::text\[\]/.test(store),
  `${STORE_PATH} must probe for an already-landed row before retrying, so a retry cannot duplicate the card.`,
)
assert(
  /class HistoryInsertError extends Error/.test(store) && /readonly blobUrls: string\[\]/.test(store),
  `${STORE_PATH} must surface the uploaded Blob URLs when the insert fails, so the save stays recoverable.`,
)
assert(
  /RETURNING id, prompt, aspect_ratio, created_at/.test(store) && !/RETURNING \*/.test(store),
  `${STORE_PATH} must not RETURN * — image_urls can hold base64 data URIs and overflows the Neon HTTP driver.`,
)

const route = read(ROUTE_PATH)
assert(
  /await storeGenerationHistory\(\{/.test(route),
  `${ROUTE_PATH} must save history server-side; client-side saves 413 on base64 payloads.`,
)
assert(
  /error instanceof HistoryInsertError && error\.blobUrls\.length > 0/.test(route) &&
    /historyRetryUrls: error\.blobUrls/.test(route),
  `${ROUTE_PATH} must return the Blob URLs of a failed save so the client can retry cheaply.`,
)
assert(
  /NextResponse\.json\(\{ images, fallback, historySaved, historyId, historyRetryUrls \}\)/.test(route),
  `${ROUTE_PATH} must report historySaved and historyRetryUrls to the client.`,
)

const hook = read(HOOK_PATH)
assert(
  /onHistorySaveFailed\(historyRetryUrls \?\? \[\], options\)/.test(hook),
  `${HOOK_PATH} must pass the retry URLs and the generation options to the failure handler.`,
)

const provider = read(PROVIDER_PATH)
assert(
  /duration: Infinity/.test(provider) && /label: 'Retry save'/.test(provider),
  `${PROVIDER_PATH} must surface a failed history save as a persistent toast with a retry, not a toast that vanishes.`,
)
assert(
  /imageUrls: retryUrls/.test(provider),
  `${PROVIDER_PATH} must retry with the Blob URLs, never by re-posting the base64 images.`,
)

console.log('✅ History persistence contract holds (7 executed cases + 14 source pins)')
