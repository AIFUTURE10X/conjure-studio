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
    if (request === 'node:crypto') return { randomUUID: () => '00000000-0000-4000-8000-000000000000' }
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
  const route = read('app/api/history/route.ts')
  const limits = read('lib/history-limits.ts')
  const uploadSource = read('lib/edit-upload.ts')
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
    /MAX_INLINE_HISTORY_DATA_URI_LENGTH/.test(provider) && /3_500_000/.test(limits),
    'Provider must use the shared safe inline history data-URI threshold.',
  )
  assert(
    /url\.startsWith\('data:'\)\s*&&\s*url\.length\s*>\s*MAX_INLINE_HISTORY_DATA_URI_LENGTH/.test(provider),
    'Provider must skip oversized data-URI history POSTs.',
  )
  assert(
    /image too large to upload/.test(provider),
    'Provider must show the accurate oversized-image toast.',
  )
  assert(
    /MAX_INLINE_HISTORY_DATA_URI_LENGTH/.test(route) && /superRefine/.test(route),
    'History API must enforce the same inline data-URI limit server-side.',
  )
  assert(
    /MAX_BLOB_UPLOAD_ATTEMPTS\s*=\s*3/.test(uploadSource) &&
      /BLOB_UPLOAD_ATTEMPT_TIMEOUT_MS\s*=\s*10_000/.test(uploadSource) &&
      /MAX_INLINE_EDIT_IMAGE_BYTES\s*=\s*3_000_000/.test(uploadSource) &&
      /abortSignal:\s*controller\.signal/.test(uploadSource) &&
      /Promise\.race\(\[upload, timeoutGuard\]\)/.test(uploadSource),
    'Blob uploads must bound SDK retries with an abort deadline.',
  )
  assert(/randomUUID\(\)/.test(uploadSource) && !/allowOverwrite/.test(uploadSource),
    'Blob upload paths must be collision-resistant without overwrite semantics.')
  // Source-anchored limitation: this contract intentionally exercises the
  // retry/fallback boundary, while CI remains the authority for full Next.js type/build checks.

  process.env.BLOB_READ_WRITE_TOKEN = 'contract-test-token'
  let attempts = 0
  let uploadOptions
  let pathname
  const uploadEditImage = loadUploadModule(async (candidatePathname, _body, options) => {
    attempts += 1
    pathname = candidatePathname
    uploadOptions = options
    if (attempts < 3) throw new Error(`transient-${attempts}`)
    return { url: 'https://blob.example/edit.png' }
  }).uploadEditImage
  const retried = await uploadEditImage(Buffer.from('image'))
  assert(attempts === 3, `expected three attempts, got ${attempts}`)
  assert(/^edits\/[0-9a-f-]{36}\.png$/.test(pathname), 'uploads must use UUID-based paths')
  assert(uploadOptions.abortSignal, 'uploads must pass an abort signal to bound SDK retries')
  assert(retried === 'https://blob.example/edit.png', 'retry success must return the Blob URL')

  attempts = 0
  const exhausted = loadUploadModule(async () => {
    attempts += 1
    throw new Error('permanent')
  }).uploadEditImage
  const fallback = await exhausted(Buffer.from('image'))
  assert(attempts === 3, `expected three attempts before fallback, got ${attempts}`)
  assert(fallback.startsWith('data:image/png;base64,'), 'exhausted retries must preserve the data URI fallback')

  const oversized = loadUploadModule(async () => {
    const error = new Error('invalid token')
    error.status = 401
    throw error
  }).uploadEditImage
  let oversizedRejected = false
  try {
    await oversized(Buffer.alloc(3_000_001))
  } catch (error) {
    oversizedRejected = /too large for inline fallback/.test(error.message)
  }
  assert(oversizedRejected, 'oversized Blob failures must not fall back to an inline response')

  attempts = 0
  const permanent = loadUploadModule(async () => {
    attempts += 1
    const error = new Error('invalid token')
    error.status = 401
    throw error
  }).uploadEditImage
  await permanent(Buffer.from('image'))
  assert(attempts === 1, `permanent Blob errors must not be retried, got ${attempts} attempts`)

  console.log('Applied edit history contract passed')
}

run().catch((error) => {
  console.error('Applied edit history contract failed:')
  console.error(error.message)
  process.exitCode = 1
})
