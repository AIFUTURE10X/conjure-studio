/**
 * Contract: one Creation Library entry point switches between image, video,
 * and logo records without merging their existing persistence models.
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
const TABS_PATH = 'app/image-studio/components/CreationLibraryTabs.tsx'
const STATE_PATH = 'app/image-studio/hooks/useImageStudioState.ts'
const TOP_BAR_PATH = 'app/image-studio/components/Studio/StudioTopBar.tsx'
const SHELL_PATH = 'app/image-studio/components/Studio/StudioShell.tsx'
const IMAGE_BROWSER_PATH = 'app/image-studio/components/ImageDatabaseBrowser/ImageDatabaseBrowser.tsx'
const VIDEO_CANVAS_PATH = 'app/image-studio/components/Video/VideoCanvas.tsx'
const VIDEO_HEADER_PATH = 'app/image-studio/components/Video/VideoHistory/VideoHistoryHeader.tsx'
const VIDEO_MODAL_PATH = 'app/image-studio/components/Video/VideoHistory/VideoHistoryModal.tsx'

function loadRecordsModule() {
  const { outputText } = ts.transpileModule(read(RECORDS_PATH), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: RECORDS_PATH,
  })
  const mod = { exports: {} }
  new Function('exports', 'require', 'module', outputText)(mod.exports, () => ({}), mod)
  return mod.exports
}

const { buildImageDatabaseRecords, filterImageDatabaseRecordsByMedia } = loadRecordsModule()
const records = buildImageDatabaseRecords({
  history: [{ id: 'image-1', imageUrls: ['https://blob.example/image.png'], timestamp: 30 }],
  favorites: [{ id: 'favorite-1', url: 'https://blob.example/favorite.png', timestamp: 20 }],
  logoHistory: [{ id: 'logo-1', imageUrl: 'https://blob.example/logo.png', timestamp: 10 }],
})

assert(typeof filterImageDatabaseRecordsByMedia === 'function', `${RECORDS_PATH} must export the media filter.`)
equal(
  filterImageDatabaseRecordsByMedia(records, 'images').map((record) => record.recordId),
  ['image-1:1', 'favorite-1'],
  'Images must include image history and image favorites, but not logo rows.',
)
equal(
  filterImageDatabaseRecordsByMedia(records, 'logos').map((record) => record.recordId),
  ['logo-1'],
  'Logos must include only logo_history rows.',
)

const tabs = read(TABS_PATH)
for (const tab of ['images', 'videos', 'logos']) {
  assert(tabs.includes(`id: '${tab}'`), `${TABS_PATH} must expose the ${tab} tab.`)
}
assert(/onSelect\(id\)/.test(tabs), `${TABS_PATH} must route tab clicks through the shared selection callback.`)

const state = read(STATE_PATH)
assert(/CreationLibraryTab = 'images' \| 'videos' \| 'logos'/.test(state), `${STATE_PATH} must define all three media tabs.`)
assert(/creationLibraryTab: CreationLibraryTab \| null/.test(state), `${STATE_PATH} must expose the nullable Creation Library state.`)

const topBar = read(TOP_BAR_PATH)
assert(/Creation Library/.test(topBar), `${TOP_BAR_PATH} must expose one Creation Library entry point.`)
assert(/setCreationLibraryTab/.test(topBar), `${TOP_BAR_PATH} must open the library through shared state.`)

const shell = read(SHELL_PATH)
assert(/creationLibraryTab === 'images'/.test(shell) && /creationLibraryTab === 'logos'/.test(shell), `${SHELL_PATH} must render image and logo library tabs.`)
assert(/<ImageDatabaseBrowser/.test(shell), `${SHELL_PATH} must reuse the database image browser.`)

const imageBrowser = read(IMAGE_BROWSER_PATH)
assert(/<CreationLibraryTabs/.test(imageBrowser), `${IMAGE_BROWSER_PATH} must render the shared media tabs.`)
assert(/Creation Library/.test(imageBrowser), `${IMAGE_BROWSER_PATH} must use the unified library title.`)
assert(/filterImageDatabaseRecordsByMedia/.test(imageBrowser), `${IMAGE_BROWSER_PATH} must isolate images from logos by media tab.`)

const videoCanvas = read(VIDEO_CANVAS_PATH)
assert(/creationLibraryTab === 'videos'/.test(videoCanvas), `${VIDEO_CANVAS_PATH} must open video history from the shared media state.`)
assert(/onSelectMedia=\{state\.setCreationLibraryTab\}/.test(videoCanvas), `${VIDEO_CANVAS_PATH} must switch library media without leaving the modal flow.`)

const videoHeader = read(VIDEO_HEADER_PATH)
assert(/<CreationLibraryTabs/.test(videoHeader), `${VIDEO_HEADER_PATH} must render the shared media tabs.`)
assert(/Creation Library/.test(videoHeader), `${VIDEO_HEADER_PATH} must use the unified library title.`)

const videoModal = read(VIDEO_MODAL_PATH)
assert(
  /createPortal/.test(videoModal) && /document\.body/.test(videoModal),
  `${VIDEO_MODAL_PATH} must escape VideoCanvas's mounted-hidden container when opened from another mode.`,
)

console.log('Creation Library contract passed')
