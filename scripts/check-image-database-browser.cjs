/**
 * Contract: the Image Library exposes a read-only database image browser.
 */

const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}
const equal = (received, expected, message) => {
  if (JSON.stringify(received) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nexpected: ${JSON.stringify(expected)}\nreceived: ${JSON.stringify(received)}`)
  }
}

const RECORDS_PATH = 'app/image-studio/components/ImageDatabaseBrowser/image-database-records.ts'
const BROWSER_PATH = 'app/image-studio/components/ImageDatabaseBrowser/ImageDatabaseBrowser.tsx'
const TABS_PATH = 'app/image-studio/components/ImageLibraryTabs.tsx'
const SHELL_PATH = 'app/image-studio/components/Studio/StudioShell.tsx'

function loadRecordsModule() {
  const { outputText } = ts.transpileModule(read(RECORDS_PATH), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: RECORDS_PATH,
  })
  const mod = { exports: {} }
  new Function('exports', 'require', 'module', outputText)(mod.exports, () => ({}), mod)
  return mod.exports
}

const { buildImageDatabaseRecords, filterImageDatabaseRecords } = loadRecordsModule()

const records = buildImageDatabaseRecords({
  history: [{
    id: 'h1',
    prompt: 'Golden product photo',
    aspectRatio: '1:1',
    imageUrls: ['https://blob.example/history-a.png', 'https://blob.example/history-b.png'],
    timestamp: 300,
  }],
  favorites: [{
    id: 'f1',
    url: 'https://blob.example/favorite.png',
    timestamp: 200,
    metadata: { style: 'Realistic' },
  }],
  logoHistory: [{
    id: 'l1',
    imageUrl: 'https://blob.example/logo.png',
    prompt: 'Blue monogram',
    timestamp: 100,
    style: 'Minimal',
  }],
})

equal(records.map((record) => record.source), [
  'generation_history',
  'generation_history',
  'favorites',
  'logo_history',
], 'A batch must become individual previewable records from all three Neon-backed sources.')
equal(records.map((record) => record.recordId), ['h1:1', 'h1:2', 'f1', 'l1'], 'Every image needs a stable record id.')
equal(
  filterImageDatabaseRecords(records, 'logo_history', '').map((record) => record.recordId),
  ['l1'],
  'The source filter must isolate one database table.',
)
equal(
  filterImageDatabaseRecords(records, 'all', 'golden').map((record) => record.recordId),
  ['h1:1', 'h1:2'],
  'Search must match prompt metadata without dropping images from the same generation.',
)

const browser = read(BROWSER_PATH)
for (const endpoint of ['/api/history?', '/api/favorites?', '/api/logo-history?']) {
  assert(browser.includes(endpoint), `${BROWSER_PATH} must read ${endpoint}.`)
}
assert(
  !/method:\s*['"](?:POST|PATCH|DELETE)['"]/.test(browser),
  `${BROWSER_PATH} must remain read-only.`,
)
assert(/loading="lazy"/.test(browser), `${BROWSER_PATH} must lazy-load thumbnails.`)
assert(/slice\(0, visibleCount\)/.test(browser), `${BROWSER_PATH} must cap the initial rendered image count.`)
assert(/<ImageLightbox/.test(browser), `${BROWSER_PATH} must open images full-size.`)

const tabs = read(TABS_PATH)
assert(/onSelectTab\('database'\)/.test(tabs), `${TABS_PATH} must expose a Database tab.`)

const shell = read(SHELL_PATH)
assert(
  /state\.imageLibraryTab === 'database'/.test(shell) && /<ImageDatabaseBrowser/.test(shell),
  `${SHELL_PATH} must render the database browser in the shared Image Library board.`,
)

console.log('✅ Read-only image database browser contract holds')
