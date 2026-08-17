/**
 * Pins the text-position setting shared by the logo and image generators.
 *
 * The critical property is that 'auto' is inert: every existing prompt, preset,
 * and saved generation must produce byte-identical output to before the setting
 * existed. The directive builder is pure, so it is executed here rather than
 * regexed — a regex would keep passing if the directives stopped being applied.
 */

const fs = require('fs')
const path = require('path')

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

function loadTextPosition() {
  const ts = require('typescript')
  const js = ts.transpileModule(read('lib/text-position.ts'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText
  const mod = { exports: {} }
  // Safe: this module has no imports.
  new Function('exports', 'require', 'module', js)(mod.exports, require, mod)
  return mod.exports
}

const checks = [
  {
    name: "'auto' leaves prompts completely untouched",
    pass: () => {
      const { applyTextPositionToPrompt, getTextPositionDirective, getTextPositionNegative } = loadTextPosition()
      const prompt = 'A beach club logo for Azzurra Mia, gold and blue'
      let ok = true
      if (applyTextPositionToPrompt(prompt, 'auto') !== prompt) {
        console.log('     expected auto to return the prompt unchanged')
        ok = false
      }
      if (getTextPositionDirective('auto') !== null) {
        console.log('     expected no directive for auto')
        ok = false
      }
      if (getTextPositionNegative('auto') !== null) {
        console.log('     expected no negative terms for auto')
        ok = false
      }
      return ok
    },
  },
  {
    name: 'each position emits a distinct, correctly-oriented directive',
    pass: () => {
      const { applyTextPositionToPrompt, getTextPositionDirective } = loadTextPosition()
      const prompt = 'Base prompt'
      let ok = true

      // Orientation matters: 'right' must put the MARK on the left, and vice
      // versa. Swapping these is the easiest possible regression to introduce.
      const right = getTextPositionDirective('right')
      const left = getTextPositionDirective('left')
      if (!/RIGHT of the symbol/.test(right) || !/mark on the left/.test(right)) {
        console.log(`     'right' directive is wrong: ${right}`)
        ok = false
      }
      if (!/LEFT of the symbol/.test(left) || !/mark on the right/.test(left)) {
        console.log(`     'left' directive is wrong: ${left}`)
        ok = false
      }

      const directives = ['below', 'above', 'left', 'right', 'center', 'none'].map(getTextPositionDirective)
      if (directives.some((d) => !d)) {
        console.log('     every non-auto position must produce a directive')
        ok = false
      }
      if (new Set(directives).size !== directives.length) {
        console.log('     directives must be distinct per position')
        ok = false
      }

      // The prompt must be preserved, with the directive appended after it.
      const applied = applyTextPositionToPrompt(prompt, 'right')
      if (!applied.startsWith(prompt) || !applied.includes(right)) {
        console.log(`     expected base prompt preserved and directive appended, received: ${applied}`)
        ok = false
      }
      return ok
    },
  },
  {
    name: 'repeated application does not stack duplicate directives',
    pass: () => {
      const { applyTextPositionToPrompt } = loadTextPosition()
      const once = applyTextPositionToPrompt('Base prompt', 'below')
      const twice = applyTextPositionToPrompt(once, 'below')
      if (once !== twice) {
        console.log('     expected re-applying the same position to be idempotent')
        return false
      }
      return true
    },
  },
  {
    name: "'none' carries negative terms that suppress lettering",
    pass: () => {
      const { getTextPositionNegative } = loadTextPosition()
      const none = getTextPositionNegative('none')
      const missing = ['text', 'lettering', 'brand name', 'watermark'].filter((t) => !none.includes(t))
      if (missing.length) {
        console.log(`     'none' negatives missing: ${missing.join(', ')}`)
        return false
      }
      return true
    },
  },
  {
    name: 'unknown input falls back to auto rather than throwing',
    pass: () => {
      const { normalizeTextPosition, DEFAULT_TEXT_POSITION } = loadTextPosition()
      const cases = [null, undefined, '', 'sideways', 'RIGHT', '../etc/passwd']
      let ok = true
      for (const input of cases) {
        const received = normalizeTextPosition(input)
        if (received !== DEFAULT_TEXT_POSITION) {
          console.log(`     normalizeTextPosition(${JSON.stringify(input)}) expected: ${DEFAULT_TEXT_POSITION}, received: ${received}`)
          ok = false
        }
      }
      if (normalizeTextPosition('right') !== 'right') {
        console.log('     a valid position must pass through unchanged')
        ok = false
      }
      return ok
    },
  },
  {
    name: 'both generation routes apply the directive',
    pass: () => {
      const logoRoute = read('app/api/generate-logo/route.ts')
      const imageRoute = read('app/api/generate-image/route.ts')
      return /applyTextPositionToPrompt\(enhancedPrompt, logoRequest\.textPosition\)/.test(logoRoute) &&
        /getTextPositionNegative\(logoRequest\.textPosition\)/.test(logoRoute) &&
        /applyTextPositionToPrompt\(parsedFields\.data\.prompt, textPosition\)/.test(imageRoute)
    },
  },
  {
    name: 'both clients send textPosition to their route',
    pass: () => {
      const logoHook = read('app/image-studio/hooks/useLogoGeneration.ts')
      const imageHook = read('app/image-studio/hooks/useImageGeneration.ts')
      return /formData\.append\('textPosition'/.test(logoHook) &&
        /formData\.append\('textPosition'/.test(imageHook)
    },
  },
  {
    name: 'the selector is mounted in both studios',
    pass: () => {
      const logoSettings = read('app/image-studio/components/Logo/LogoAdvancedSettings.tsx')
      const imageRail = read('app/image-studio/components/Studio/SettingsRail/ImageSettingsRail.tsx')
      return /<TextPositionSelector/.test(logoSettings) && /<TextPositionSelector/.test(imageRail)
    },
  },
]

let failed = 0
for (const check of checks) {
  const ok = check.pass()
  console.log(`${ok ? 'PASS' : 'FAIL'} ${check.name}`)
  if (!ok) failed += 1
}

if (failed > 0) {
  console.error(`${failed} text position contract check(s) failed`)
  process.exit(1)
}
