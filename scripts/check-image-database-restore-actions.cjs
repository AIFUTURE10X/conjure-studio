/**
 * Contract: any database image can be restored to History or Favorites
 * without copying an already-durable Blob or creating a URL duplicate.
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

const ACTIONS_PATH = 'app/image-studio/components/ImageDatabaseBrowser/image-database-actions.ts'
const BROWSER_PATH = 'app/image-studio/components/ImageDatabaseBrowser/ImageDatabaseBrowser.tsx'
// The restore buttons were extracted out of the browser into a card component.
// This check asserted the labels against BROWSER_PATH and silently rotted,
// because it was never wired into CI and so never ran.
const CARD_PATH = 'app/image-studio/components/ImageDatabaseBrowser/ImageDatabaseCard.tsx'
const HISTORY_ROUTE_PATH = 'app/api/history/route.ts'
const FAVORITES_ROUTE_PATH = 'app/api/favorites/route.ts'

function loadActionsModule() {
  const { outputText } = ts.transpileModule(read(ACTIONS_PATH), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: ACTIONS_PATH,
  })
  const mod = { exports: {} }
  new Function('exports', 'require', 'module', outputText)(mod.exports, () => ({}), mod)
  return mod.exports
}

const {
  favoriteRestorePayload,
  historyRestorePayload,
  restoredTargetsForUrl,
} = loadActionsModule()

const record = {
  recordId: 'logo:7',
  sourceId: '7',
  source: 'logo_history',
  url: 'https://assets.public.blob.vercel-storage.com/logo.png',
  prompt: 'Blue monogram',
  aspectRatio: '1:1',
  style: 'Minimal',
  timestamp: 100,
}

equal(historyRestorePayload(record, 'device-1'), {
  userId: 'device-1',
  prompt: 'Blue monogram',
  aspectRatio: '1:1',
  imageUrls: [record.url],
  metadata: { style: 'Minimal' },
  restoreOnlyIfMissing: true,
}, 'History restore must retain useful image metadata and request duplicate protection.')

equal(favoriteRestorePayload(record, 'device-1'), {
  userId: 'device-1',
  imageUrl: record.url,
  metadata: {
    ratio: '1:1',
    style: 'Minimal',
    params: { mainPrompt: 'Blue monogram', aspectRatio: '1:1' },
  },
  restoreOnlyIfMissing: true,
}, 'Favorite restore must retain useful metadata and reuse the durable image URL.')

equal(restoredTargetsForUrl([
  { ...record, source: 'generation_history' },
  { ...record, recordId: 'favorite:9', sourceId: '9', source: 'favorites' },
], record.url), { history: true, favorites: true }, 'Existing source URLs must disable duplicate restore actions.')

const browser = read(BROWSER_PATH)
const card = read(CARD_PATH)

// Labels live on the card. Asserting the string alone is weak — a label can
// survive while the handler that makes it do anything is gone — so also assert
// the browser wires a restore handler into the card for each target.
for (const label of ['Add to History', 'Add to Favorites']) {
  assert(card.includes(label), `${CARD_PATH} must expose ${label}.`)
}
for (const handler of ['onRestoreHistory', 'onRestoreFavorite']) {
  assert(card.includes(handler), `${CARD_PATH} must accept ${handler}.`)
  assert(
    new RegExp(`${handler}=\\{`).test(browser),
    `${BROWSER_PATH} must pass ${handler} to ${CARD_PATH}.`,
  )
}
assert(
  /restoreRecord\(record, 'history'\)/.test(browser) && /restoreRecord\(record, 'favorites'\)/.test(browser),
  `${BROWSER_PATH} must route both restore targets through restoreRecord.`,
)
assert(/method:\s*['"]POST['"]/.test(browser), `${BROWSER_PATH} must use explicit POST restore actions.`)

const historyRoute = read(HISTORY_ROUTE_PATH)
const favoritesRoute = read(FAVORITES_ROUTE_PATH)
assert(historyRoute.includes('restoreOnlyIfMissing'), `${HISTORY_ROUTE_PATH} must protect URL restores from duplicates.`)
assert(favoritesRoute.includes('restoreOnlyIfMissing'), `${FAVORITES_ROUTE_PATH} must reuse a durable restored URL.`)

console.log('✅ Image database restore actions contract holds')
