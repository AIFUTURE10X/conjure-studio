/**
 * Pins the seed/model capability contract.
 *
 * OpenAI's images API accepts no seed, so both generation routes call
 * generateOpenAIImage without one. A seed control offered for an OpenAI model is
 * therefore inert. The image studio used to show exactly that with no indication,
 * which reads as "locked seed = reproducible" when it is not.
 */

const fs = require('fs')
const path = require('path')

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

/** modelSupportsSeed is pure — execute it rather than regexing the source. */
function loadCapabilities() {
  const ts = require('typescript')
  const js = ts.transpileModule(read('lib/model-capabilities.ts'), {
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
    name: 'modelSupportsSeed reports OpenAI image models as seedless',
    pass: () => {
      const { modelSupportsSeed, seedUnsupportedReason } = loadCapabilities()
      const cases = [
        ['gpt-image-2', false],
        ['gemini-3.1-flash-image-preview', true],
        ['gemini-3-pro-image-preview', true],
        ['gemini-2.5-flash-image', true],
        [undefined, true],
        [null, true],
      ]
      let ok = true
      for (const [model, expected] of cases) {
        const received = modelSupportsSeed(model)
        if (received !== expected) {
          console.log(`     modelSupportsSeed(${JSON.stringify(model)}) expected: ${expected}, received: ${received}`)
          ok = false
        }
      }
      // The reason string is what the UI renders; it must exist exactly when
      // seed is unsupported, and be absent otherwise.
      if (!seedUnsupportedReason('gpt-image-2')) {
        console.log('     expected a seedUnsupportedReason for gpt-image-2, received none')
        ok = false
      }
      if (seedUnsupportedReason('gemini-3-pro-image-preview') !== null) {
        console.log('     expected no seedUnsupportedReason for a Gemini model')
        ok = false
      }
      return ok
    },
  },
  {
    name: 'the OpenAI generation branches genuinely drop seed',
    // Guards the premise: if a future SDK adds seed support and these branches
    // start passing it, this check fails and the UI gating should be revisited.
    pass: () => {
      const logo = read('app/api/generate-logo/logo-image-pipeline.ts')
      const image = read('app/api/generate-image/route.ts')
      const openAiCallHasSeed = (source) => {
        const start = source.indexOf('generateOpenAIImage({')
        if (start === -1) return null
        const end = source.indexOf('})', start)
        return /(^|\s)seed\s*[,:]/.test(source.slice(start, end))
      }
      const logoHasSeed = openAiCallHasSeed(logo)
      const imageHasSeed = openAiCallHasSeed(image)
      if (logoHasSeed === null || imageHasSeed === null) {
        console.log('     could not locate a generateOpenAIImage({ ... }) call to inspect')
        return false
      }
      if (logoHasSeed || imageHasSeed) {
        console.log(`     generateOpenAIImage now receives seed (logo: ${logoHasSeed}, image: ${imageHasSeed}) — revisit the UI gating`)
        return false
      }
      return true
    },
  },
  {
    name: 'both seed controls gate on model capability, not a hardcoded id',
    // Anchored to the specific expressions rather than the whole file so a
    // stray mention of the helper elsewhere cannot satisfy this.
    pass: () => {
      const dropdown = read('app/image-studio/components/SeedControlDropdown.tsx')
      const logoSettings = read('app/image-studio/components/Logo/LogoAdvancedSettings.tsx')
      return /modelSupportsSeed/.test(dropdown) &&
        /selectedModel\?: string/.test(dropdown) &&
        /const seedUnsupported = !modelSupportsSeed\(selectedModel\)/.test(dropdown) &&
        /const seedDisabled = isDisabled \|\| !modelSupportsSeed\(selectedModel\)/.test(logoSettings)
    },
  },
  {
    name: 'every SeedControlDropdown call site passes the selected model',
    pass: () => {
      const callSites = [
        'app/image-studio/components/Studio/SettingsRail/ImageSettingsRail.tsx',
        'app/image-studio/components/GeneratePanel.tsx',
      ]
      let ok = true
      for (const file of callSites) {
        const source = read(file)
        const match = source.match(/<SeedControlDropdown[^>]*>/)
        if (!match) {
          console.log(`     ${file}: no <SeedControlDropdown> usage found`)
          ok = false
          continue
        }
        if (!/selectedModel=/.test(match[0])) {
          console.log(`     ${file}: <SeedControlDropdown> is missing selectedModel`)
          ok = false
        }
      }
      return ok
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
  console.error(`${failed} seed/model capability contract check(s) failed`)
  process.exit(1)
}
