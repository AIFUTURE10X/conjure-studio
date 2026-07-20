const fs = require('fs')
const path = require('path')

const root = process.cwd()

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const packageJson = read('package.json')
const studioTypes = read('app/image-studio/context/studio-types.ts')
const topBar = read('app/image-studio/components/Studio/StudioTopBar.tsx')
const canvasPanel = read('app/image-studio/components/Studio/CanvasPanel.tsx')
const route = read('app/api/translate-design-text/route.ts')
const panel = read('app/image-studio/components/TranslateText/TranslateTextPanel.tsx')

assert(
  /"check:translation-tool":\s*"node scripts\/check-translation-tool\.cjs"/.test(packageJson),
  'package.json must expose check:translation-tool.',
)

assert(
  /export type StudioMode = .*'translate'/.test(studioTypes) &&
    /translate:\s*'translate'/.test(studioTypes) &&
    /translate:\s*'translate'/.test(studioTypes),
  'Studio mode maps must include translate.',
)

assert(
  /\{ mode: 'translate', label: 'Translate' \}/.test(topBar),
  'StudioTopBar must expose the Translate mode.',
)

assert(
  /import \{ TranslateTextPanel \}/.test(canvasPanel) &&
    /mode === 'translate' && <TranslateTextPanel/.test(canvasPanel),
  'CanvasPanel must render TranslateTextPanel in translate mode.',
)

assert(
  /generateOpenAIVisionText/.test(route) &&
    /targetLanguageSchema/.test(route) &&
    /translatedText/.test(route) &&
    /sourceLanguage/.test(route),
  'translate-design-text API must use OpenAI vision and return translated text blocks.',
)

assert(
  /fetch\('\/api\/translate-design-text'/.test(panel) &&
    /targetLanguage/.test(panel) &&
    /copyTranslatedText/.test(panel) &&
    /handleUseInPrompt/.test(panel),
  'TranslateTextPanel must upload to the API, support target language, copy text, and use results in prompt.',
)

console.log('Translation tool contract passed')
