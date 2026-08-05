/**
 * Contract: every Creation Library item can persist one title/category and
 * multiple tags, then search/filter those fields across images, logos, videos.
 */

const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath))
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}
const equal = (received, expected, message) => {
  if (JSON.stringify(received) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nexpected: ${JSON.stringify(expected)}\nreceived: ${JSON.stringify(received)}`)
  }
}

const METADATA_PATH = 'lib/creation-metadata.ts'
const RECORDS_PATH = 'app/image-studio/components/ImageDatabaseBrowser/image-database-records.ts'
const ROUTE_PATH = 'app/api/creation-metadata/route.ts'
const SCHEMA_PATH = 'lib/db/creation-metadata-schema.ts'
const MIGRATION_PATH = 'scripts/016_creation_media_metadata.sql'
const EDITOR_PATH = 'app/image-studio/components/CreationMetadata/CreationMetadataEditor.tsx'
const IMAGE_BROWSER_PATH = 'app/image-studio/components/ImageDatabaseBrowser/ImageDatabaseBrowser.tsx'
const VIDEO_QUERY_PATH = 'lib/video/history-query.ts'
const VIDEO_ROUTE_PATH = 'app/api/video-history/route.ts'
const VIDEO_JOB_PATH = 'app/image-studio/components/Video/useVideoGeneration.ts'
const VIDEO_BROWSER_PATH = 'app/image-studio/components/Video/VideoHistory/useVideoHistoryBrowser.ts'
const VIDEO_MODAL_PATH = 'app/image-studio/components/Video/VideoHistory/VideoHistoryModal.tsx'
const VIDEO_CARD_PATH = 'app/image-studio/components/Video/VideoHistory/VideoHistoryCard.tsx'
const VIDEO_FILTERS_PATH = 'app/image-studio/components/Video/VideoHistory/VideoHistoryFilters.tsx'

assert(exists(METADATA_PATH), `${METADATA_PATH} must define the shared metadata contract.`)

function loadTypeScriptModule(relativePath, allowedImports = {}) {
  const { outputText } = ts.transpileModule(read(relativePath), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: relativePath,
  })
  const mod = { exports: {} }
  const localRequire = (id) => {
    if (Object.hasOwn(allowedImports, id)) return allowedImports[id]
    throw new Error(`unexpected import in ${relativePath}: ${id}`)
  }
  new Function('exports', 'require', 'module', '__filename', '__dirname', outputText)(
    mod.exports,
    localRequire,
    mod,
    relativePath,
    path.dirname(relativePath),
  )
  return mod.exports
}

const metadata = loadTypeScriptModule(METADATA_PATH)
const normalized = metadata.normalizeCreationMetadata({
  title: '  Villa launch  ',
  category: '  Marketing  ',
  tags: [' Phuket ', 'luxury', 'phuket', '', 'Luxury '],
})
equal(normalized, {
  title: 'Villa launch',
  category: 'Marketing',
  tags: ['Phuket', 'luxury'],
}, 'Metadata must trim values and deduplicate tags case-insensitively.')
equal(
  metadata.normalizeCreationMetadata({ title: ' ', category: '', tags: [] }),
  { title: null, category: null, tags: [] },
  'Blank optional metadata must normalize to the uncategorized state.',
)

const recordsModule = loadTypeScriptModule(RECORDS_PATH)
const records = recordsModule.buildImageDatabaseRecords({
  history: [{ id: 'history-1', imageUrls: ['https://blob.example/shared.png'], prompt: 'sunset villa', timestamp: 30 }],
  favorites: [{ id: 'favorite-1', url: 'https://blob.example/shared.png', prompt: 'sunset villa', timestamp: 20 }],
  logoHistory: [{ id: 'logo-1', imageUrl: 'https://blob.example/logo.png', prompt: 'gold mark', timestamp: 10 }],
})
const enriched = recordsModule.applyCreationMetadata(records, [
  {
    mediaType: 'image',
    mediaUrl: 'https://blob.example/shared.png',
    title: 'Villa launch',
    category: 'Marketing',
    tags: ['Phuket', 'luxury'],
  },
  {
    mediaType: 'logo',
    mediaUrl: 'https://blob.example/logo.png',
    title: 'Gold identity',
    category: 'Brand',
    tags: ['gold'],
  },
])

equal(
  enriched.filter((record) => record.url.endsWith('shared.png')).map((record) => record.title),
  ['Villa launch', 'Villa launch'],
  'The same image in History and Favorites must share one metadata record.',
)
equal(
  recordsModule.filterImageDatabaseRecords(enriched, 'all', 'phuket', 'all', 'all').map((record) => record.recordId),
  ['history-1:1', 'favorite-1'],
  'Free-text search must include tags.',
)
equal(
  recordsModule.filterImageDatabaseRecords(enriched, 'all', '', 'Marketing', 'luxury').map((record) => record.recordId),
  ['history-1:1', 'favorite-1'],
  'Category and tag filters must combine.',
)

for (const requiredPath of [ROUTE_PATH, SCHEMA_PATH, MIGRATION_PATH, EDITOR_PATH]) {
  assert(exists(requiredPath), `${requiredPath} must exist.`)
}

const schema = read(SCHEMA_PATH)
for (const column of ['user_id', 'media_type', 'media_url', 'title', 'category', 'tags']) {
  assert(schema.includes(column), `${SCHEMA_PATH} must create ${column}.`)
}

const migration = read(MIGRATION_PATH)
assert(/CREATE TABLE IF NOT EXISTS public\.creation_media_metadata/.test(migration), `${MIGRATION_PATH} must create the metadata table.`)
assert(/UNIQUE\s*\(user_id, media_type, media_url\)/.test(migration), `${MIGRATION_PATH} must share metadata for duplicate library sources.`)

const route = read(ROUTE_PATH)
assert(/export async function GET/.test(route), `${ROUTE_PATH} must list metadata and filter options.`)
assert(/export async function PATCH/.test(route), `${ROUTE_PATH} must save edited metadata.`)
assert(/resolveUserId/.test(route) && /ensureCreationMetadataSchema/.test(route), `${ROUTE_PATH} must preserve user scoping and self-heal its schema.`)
assert(/ON CONFLICT \(user_id, media_type, media_url\)/.test(route), `${ROUTE_PATH} must upsert one metadata row per media URL.`)

const editor = read(EDITOR_PATH)
for (const label of ['Title', 'Category', 'Tags']) {
  assert(editor.includes(label), `${EDITOR_PATH} must expose ${label}.`)
}
assert(/saveCreationMetadata/.test(editor), `${EDITOR_PATH} must persist through the shared metadata client.`)

const imageBrowser = read(IMAGE_BROWSER_PATH)
assert(/CreationMetadataEditor/.test(imageBrowser), `${IMAGE_BROWSER_PATH} must open the metadata editor.`)
assert(/category/.test(imageBrowser) && /tag/.test(imageBrowser), `${IMAGE_BROWSER_PATH} must expose category and tag filtering.`)

const videoQuery = read(VIDEO_QUERY_PATH)
assert(/category:/.test(videoQuery) && /tag:/.test(videoQuery), `${VIDEO_QUERY_PATH} must validate category and tag filters.`)

const videoRoute = read(VIDEO_ROUTE_PATH)
assert(/creation_media_metadata/.test(videoRoute), `${VIDEO_ROUTE_PATH} must join the shared metadata table.`)
assert(/metadata\.title/.test(videoRoute) && /metadata\.tags/.test(videoRoute), `${VIDEO_ROUTE_PATH} search must include titles and tags.`)
assert(/title:/.test(videoRoute) && /category:/.test(videoRoute) && /tags:/.test(videoRoute), `${VIDEO_ROUTE_PATH} must return saved metadata.`)

const videoJob = read(VIDEO_JOB_PATH)
assert(/title\?: string \| null/.test(videoJob), `${VIDEO_JOB_PATH} must carry a saved title.`)
assert(/category\?: string \| null/.test(videoJob), `${VIDEO_JOB_PATH} must carry a saved category.`)
assert(/tags\?: string\[\]/.test(videoJob), `${VIDEO_JOB_PATH} must carry saved tags.`)

const videoBrowser = read(VIDEO_BROWSER_PATH)
assert(/category/.test(videoBrowser) && /tag/.test(videoBrowser), `${VIDEO_BROWSER_PATH} must send server-side metadata filters.`)
assert(
  /isFiltering:\s*debouncedSearch\.length > 0 \|\| category !== 'all' \|\| tag !== 'all'/.test(videoBrowser),
  `${VIDEO_BROWSER_PATH} must distinguish a filtered empty state from an empty archive.`,
)

const videoModal = read(VIDEO_MODAL_PATH)
assert(/CreationMetadataEditor/.test(videoModal), `${VIDEO_MODAL_PATH} must edit clip metadata.`)
assert(/VideoHistoryFilters/.test(videoModal), `${VIDEO_MODAL_PATH} must render the extracted filter toolbar.`)
assert(/isFiltered=\{isFiltering\}/.test(videoModal), `${VIDEO_MODAL_PATH} must show the filtered empty state for category and tag filters.`)

assert(exists(VIDEO_FILTERS_PATH), `${VIDEO_FILTERS_PATH} must exist.`)
const videoFilters = read(VIDEO_FILTERS_PATH)
assert(/Category/.test(videoFilters) && /Tag/.test(videoFilters), `${VIDEO_FILTERS_PATH} must render category and tag filters.`)

const videoCard = read(VIDEO_CARD_PATH)
assert(/onEditMetadata/.test(videoCard), `${VIDEO_CARD_PATH} must expose metadata editing.`)
assert(/clip\.title/.test(videoCard), `${VIDEO_CARD_PATH} must display the custom title.`)

console.log('Creation metadata contract passed')
