const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const root = process.cwd()

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function loadUploadModule(put) {
  const { outputText } = ts.transpileModule(read('lib/edit-upload.ts'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: 'lib/edit-upload.ts',
  })
  const mod = { exports: {} }
  const stubRequire = (request) => {
    if (request === '@vercel/blob') return { put }
    throw new Error(`unexpected import: ${request}`)
  }
  new Function('exports', 'require', 'module', '__filename', '__dirname', outputText)(
    mod.exports,
    stubRequire,
    mod,
    'lib/edit-upload.ts',
    path.dirname('lib/edit-upload.ts'),
  )
  return mod.exports
}

async function run() {
  const provider = read('app/image-studio/context/ImageGenerationProvider.tsx')
  const packageJson = JSON.parse(read('package.json'))
  const workflow = read('.github/workflows/ci.yml')

  assert(
    packageJson.scripts['check:applied-edit-history'] === 'node scripts/check-applied-edit-history.cjs',
    'package.json must expose the applied-edit history contract check.',
  )
  assert(
    /check:applied-edit-history/.test(workflow),
    'CI must run the applied-edit history contract check.',
  )
  assert(
    /MAX_INLINE_HISTORY_DATA_URI_LENGTH\s*=\s*3_500_000/.test(provider),
    'Provider must define the safe inline history data-URI threshold.',
  )
  assert(
    /url\.startsWith\('data:'\)\s*&&\s*url\.length\s*>\s*MAX_INLINE_HISTORY_DATA_URI_LENGTH/.test(provider),
    'Provider must skip oversized data-URI history POSTs.',
  )
  assert(
    /image too large to upload/.test(provider),
    'Provider must show the accurate oversized-image toast.',
  )

  process.env.BLOB_READ_WRITE_TOKEN = 'contract-test-token'
  let attempts = 0
  let uploadOptions
  const uploadEditImage = loadUploadModule(async (_pathname, _body, options) => {
    attempts += 1
    uploadOptions = options
    if (attempts < 3) throw new Error(`transient-${attempts}`)
    return { url: 'https://blob.example/edit.png' }
  }).uploadEditImage
  const retried = await uploadEditImage(Buffer.from('image'))
  assert(attempts === 3, `expected three attempts, got ${attempts}`)
  assert(uploadOptions.allowOverwrite === true, 'retries must allow overwriting the stable pathname')
  assert(retried === 'https://blob.example/edit.png', 'retry success must return the Blob URL')

  attempts = 0
  const exhausted = loadUploadModule(async () => {
    attempts += 1
    throw new Error('permanent')
  }).uploadEditImage
  const fallback = await exhausted(Buffer.from('image'))
  assert(attempts === 3, `expected three attempts before fallback, got ${attempts}`)
  assert(fallback.startsWith('data:image/png;base64,'), 'exhausted retries must preserve the data URI fallback')

  console.log('Applied edit history contract passed')
}

run().catch((error) => {
  console.error('Applied edit history contract failed:')
  console.error(error.message)
  process.exitCode = 1
})
