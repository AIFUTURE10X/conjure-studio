const fs = require('fs')
const path = require('path')

const root = process.cwd()

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath))

const checks = [
  {
    name: 'shared logo generation contract exists',
    pass: () => exists('lib/logo-generation-contract.ts'),
  },
  {
    name: 'contract defines exact-text overlay mode',
    pass: () => /exact-text-overlay/.test(read('lib/logo-generation-contract.ts')),
  },
  {
    name: 'logo API uses request parser helper',
    pass: () => /parseLogoGenerationRequest/.test(read('app/api/generate-logo/route.ts')),
  },
  {
    name: 'logo API uses image pipeline helper',
    pass: () => /generateLogoBaseImage/.test(read('app/api/generate-logo/route.ts')),
  },
  {
    name: 'prompt builder accepts text mode',
    pass: () => /LogoTextMode/.test(read('app/api/generate-logo/logo-prompts.ts')),
  },
  {
    name: 'advanced settings exposes text handling',
    pass: () => /Text Handling/.test(read('app/image-studio/components/Logo/LogoAdvancedSettings.tsx')),
  },
]

const failures = checks.filter((check) => {
  try {
    return !check.pass()
  } catch {
    return true
  }
})

if (failures.length > 0) {
  console.error('Logo generator contract checks failed:')
  for (const failure of failures) {
    console.error(`- ${failure.name}`)
  }
  process.exit(1)
}

console.log('Logo generator contract checks passed')
