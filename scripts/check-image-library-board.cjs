/**
 * Contract: image History and Favorites share one board with two tabs.
 *
 * The image studio used to maintain two independent booleans and render two
 * unrelated overlays. That made the archive feel like two different tools,
 * unlike the logo board's History/Favorites tabs. Pin the shared state and tab
 * wiring so either top-bar action opens the same mutually-exclusive board.
 */

const fs = require('fs')
const path = require('path')

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const STATE_PATH = 'app/image-studio/hooks/useImageStudioState.ts'
const TOP_BAR_PATH = 'app/image-studio/components/Studio/StudioTopBar.tsx'
const SHELL_PATH = 'app/image-studio/components/Studio/StudioShell.tsx'
const TABS_PATH = 'app/image-studio/components/ImageLibraryTabs.tsx'
const HISTORY_HEADER_PATH = 'app/image-studio/components/ParameterHistoryPanel/HistoryHeader.tsx'
const FAVORITES_PATH = 'app/image-studio/components/Favorites/FavoritesModal.tsx'

const state = read(STATE_PATH)
assert(
  /imageLibraryTab:\s*ImageLibraryTab \| null/.test(state) &&
    /setImageLibraryTab:\s*\(tab: ImageLibraryTab \| null\)/.test(state),
  `${STATE_PATH} must expose one nullable imageLibraryTab state for the shared board.`,
)
assert(
  !/showFavorites:\s*boolean/.test(state) && !/showParameterHistory:\s*boolean/.test(state),
  `${STATE_PATH} must not retain two independent modal-open booleans.`,
)

const topBar = read(TOP_BAR_PATH)
assert(
  /onShowHistory=\{\(\) => state\.setImageLibraryTab\('history'\)\}/.test(topBar),
  `${TOP_BAR_PATH} must open the shared board on the History tab.`,
)
assert(
  /onShowFavorites=\{\(\) => state\.setImageLibraryTab\('favorites'\)\}/.test(topBar),
  `${TOP_BAR_PATH} must open the shared board on the Favorites tab.`,
)

const shell = read(SHELL_PATH)
assert(
  /state\.imageLibraryTab === 'favorites'/.test(shell) &&
    /state\.imageLibraryTab === 'history'/.test(shell),
  `${SHELL_PATH} must render exactly the selected tab of the shared board.`,
)
assert(
  /onSelectTab=\{selectImageLibraryTab\}/.test(shell) &&
    /onClose=\{\(\) => state\.setImageLibraryTab\(null\)\}/.test(shell),
  `${SHELL_PATH} must switch image tabs in-place and close the shared board through one state setter.`,
)
assert(
  /if \(tab === 'database'\)[\s\S]*?setCreationLibraryTab\('images'\)/.test(shell),
  `${SHELL_PATH} must hand the legacy Database tab to the unified Creation Library.`,
)

const tabs = read(TABS_PATH)
assert(
  /onClick=\{\(\) => onSelectTab\('history'\)\}/.test(tabs) &&
    /onClick=\{\(\) => onSelectTab\('favorites'\)\}/.test(tabs),
  `${TABS_PATH} must expose directly clickable History and Favorites tabs.`,
)

for (const relativePath of [HISTORY_HEADER_PATH, FAVORITES_PATH]) {
  assert(
    /<ImageLibraryTabs/.test(read(relativePath)),
    `${relativePath} must render the same shared tab control.`,
  )
}

console.log('✅ Image History/Favorites share one tabbed board')
