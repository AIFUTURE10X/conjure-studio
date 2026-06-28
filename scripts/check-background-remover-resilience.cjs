const fs = require('fs')
const path = require('path')

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const checks = [
  {
    name: 'PhotoRoom errors keep provider status metadata',
    pass: () => {
      const source = read('lib/photoroom-bg-removal.ts')
      return /class\s+PhotoRoomBgRemovalError\s+extends\s+Error/.test(source) &&
        /status:\s*number/.test(source) &&
        /isPhotoRoomBgRemovalError/.test(source) &&
        /new\s+PhotoRoomBgRemovalError\(/.test(source)
    },
  },
  {
    name: 'remove-background falls back from PhotoRoom to fal',
    pass: () => {
      const source = read('app/api/remove-background/route.ts')
      return /runPhotoRoomBackgroundRemoval/.test(source) &&
        /isPhotoRoomBgRemovalError/.test(source) &&
        /removeBackgroundWithFal/.test(source) &&
        /PhotoRoom failed; falling back to fal/.test(source) &&
        /fallbackWarning/.test(source)
    },
  },
  {
    name: 'remove-background returns provider errors without generic 500',
    pass: () => {
      const source = read('app/api/remove-background/route.ts')
      return /provider_error/.test(source) &&
        /provider_unavailable/.test(source) &&
        /status:\s*providerStatus/.test(source)
    },
  },
  {
    name: 'background remover client shows API error body',
    pass: () => {
      const source = read('app/image-studio/hooks/useBackgroundRemoverState.ts')
      const jsonReadIndex = source.indexOf('await response.json()')
      const okCheckIndex = source.indexOf('if (!response.ok)')
      return jsonReadIndex !== -1 &&
        okCheckIndex !== -1 &&
        jsonReadIndex < okCheckIndex &&
        /data\.error/.test(source) &&
        /HTTP \$\{response\.status\}/.test(source)
    },
  },
  {
    name: 'logo-history handles missing database as local-only mode',
    pass: () => {
      const source = read('app/api/logo-history/route.ts')
      return /hasDatabaseConnection/.test(source) &&
        /database_unconfigured/.test(source) &&
        /localOnly/.test(source)
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
  console.error(`${failed} background remover resilience contract check(s) failed`)
  process.exit(1)
}
