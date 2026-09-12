const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

const IDENTITY_PATH = 'lib/favorites/identity.ts'
const ROUTE_PATH = 'app/api/favorites/route.ts'
const HOOK_PATH = 'app/image-studio/components/SimpleFavorites.tsx'
const SERVICE_PATH = 'lib/db/dbService.ts'
const MIGRATION_PATH = 'scripts/016_favorites_source_url.sql'

/**
 * Pins the favorites star.
 *
 * The regression this exists for: /api/favorites uploaded each click to a fresh
 * `favorites/temp-<now>.png` and returned THAT url, so the client — which only
 * ever holds the image's own url — never matched, never filled the star, and
 * inserted a new row on every click (three identical 2.8 MB copies for one user
 * in production). Two invariants keep it dead:
 *
 *   1. matching accepts the source url, not just the server's blob copy, and
 *   2. the server dedupes on image content, so a missed match still cannot
 *      create a second row.
 *
 * Invariant 1 is EXECUTED below against the real helpers. A regex-only contract
 * would keep passing after the behavior regressed, because dead code or a
 * leftover matching string still satisfies it.
 */
function loadIdentityModule() {
  const { outputText } = ts.transpileModule(read(IDENTITY_PATH), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: IDENTITY_PATH,
  })
  const mod = { exports: {} }
  // identity.ts is deliberately import-free, so this stub is never reached.
  const stubRequire = () => ({})
  new Function('exports', 'require', 'module', '__filename', '__dirname', outputText)(
    mod.exports,
    stubRequire,
    mod,
    IDENTITY_PATH,
    path.dirname(IDENTITY_PATH),
  )
  return mod.exports
}

const identity = loadIdentityModule()
const { matchesFavorite, findFavoriteByUrl, persistableSourceUrl } = identity

const BLOB = 'https://blob.vercel-storage.com/favorites/abc123.png'
const SOURCE = 'https://blob.vercel-storage.com/history/original-9.png'
const DATA_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=='

/** Executed against the real helpers — these fail if the matching logic regresses. */
const MATCH_CASES = [
  {
    name: 'matches the stored blob copy (the favorites modal removes by this url)',
    favorite: { url: BLOB, sourceUrl: SOURCE },
    url: BLOB,
    want: true,
  },
  {
    name: 'matches the source url — the grid only ever knows this one',
    favorite: { url: BLOB, sourceUrl: SOURCE },
    url: SOURCE,
    want: true,
  },
  {
    name: 'matches a data: URI source recorded for the click that saved it',
    favorite: { url: BLOB, sourceUrl: DATA_URI },
    url: DATA_URI,
    want: true,
  },
  {
    name: 'does not match an unrelated url',
    favorite: { url: BLOB, sourceUrl: SOURCE },
    url: 'https://example.com/other.png',
    want: false,
  },
  {
    name: 'a favorite with no source url still does not match a foreign url',
    favorite: { url: BLOB },
    url: SOURCE,
    want: false,
  },
  {
    name: 'a null source url does not match an empty query',
    favorite: { url: BLOB, sourceUrl: null },
    url: '',
    want: false,
  },
  {
    name: 'an empty query never matches',
    favorite: { url: BLOB, sourceUrl: SOURCE },
    url: '',
    want: false,
  },
]

/** Executed — this is what keeps multi-MB data URIs out of the table and the GET. */
const SOURCE_URL_CASES = [
  { name: 'keeps an https url', input: SOURCE, want: SOURCE },
  { name: 'keeps an http url', input: 'http://localhost:3000/img.png', want: 'http://localhost:3000/img.png' },
  { name: 'refuses a data: URI', input: DATA_URI, want: null },
  { name: 'refuses an oversized url', input: `https://x.test/${'a'.repeat(4096)}`, want: null },
  { name: 'refuses an empty url', input: '', want: null },
  { name: 'refuses a blob: url', input: 'blob:http://localhost/9f2e', want: null },
]

const checks = [
  { name: 'matchesFavorite is exported and callable', pass: () => typeof matchesFavorite === 'function' },
  { name: 'findFavoriteByUrl is exported and callable', pass: () => typeof findFavoriteByUrl === 'function' },
  { name: 'persistableSourceUrl is exported and callable', pass: () => typeof persistableSourceUrl === 'function' },

  ...MATCH_CASES.map((testCase) => ({
    name: `behavior — matchesFavorite ${testCase.name}`,
    pass: () => {
      const got = matchesFavorite(testCase.favorite, testCase.url)
      if (got !== testCase.want) {
        console.error(`    expected: ${JSON.stringify(testCase.want)}`)
        console.error(`    received: ${JSON.stringify(got)}`)
        return false
      }
      return true
    },
  })),

  ...SOURCE_URL_CASES.map((testCase) => ({
    name: `behavior — persistableSourceUrl ${testCase.name}`,
    pass: () => {
      const got = persistableSourceUrl(testCase.input)
      if (got !== testCase.want) {
        console.error(`    expected: ${JSON.stringify(testCase.want)}`)
        console.error(`    received: ${JSON.stringify(got)}`)
        return false
      }
      return true
    },
  })),

  {
    name: 'behavior — findFavoriteByUrl finds a row by its source url',
    pass: () => {
      const list = [{ id: '1', url: 'https://x.test/a.png' }, { id: '2', url: BLOB, sourceUrl: SOURCE }]
      const got = findFavoriteByUrl(list, SOURCE)
      if (!got || got.id !== '2') {
        console.error(`    expected: the row with id 2`)
        console.error(`    received: ${JSON.stringify(got)}`)
        return false
      }
      return true
    },
  },
  {
    name: 'behavior — findFavoriteByUrl returns undefined when nothing matches',
    pass: () => findFavoriteByUrl([{ id: '1', url: BLOB }], SOURCE) === undefined,
  },
  {
    name: 'behavior — findFavoriteByUrl on an empty list is undefined, not a throw',
    pass: () => findFavoriteByUrl([], SOURCE) === undefined,
  },

  // Route and hook wiring stays source-level: the route needs Blob + Neon and the
  // hook is a React hook, so neither can be invoked headlessly here. These are
  // anchored to the specific statements that carry the invariant, but unlike the
  // executed cases above they would survive a regression that left the matching
  // text in place as dead code.
  {
    name: 'wiring — route hashes the image bytes and dedupes BEFORE uploading a blob',
    pass: () => {
      const route = read(ROUTE_PATH)
      const hashedAt = route.indexOf("createHash('sha256').update(imageBuffer).digest('hex')")
      const dedupedAt = route.indexOf('AND content_hash = ${contentHash}')
      const uploadedAt = route.indexOf('await put(')
      if (hashedAt === -1 || dedupedAt === -1 || uploadedAt === -1) {
        console.error(`    hash: ${hashedAt}, dedupe lookup: ${dedupedAt}, upload: ${uploadedAt} (-1 = missing)`)
        return false
      }
      // Ordering is the invariant: hashing or looking up AFTER the upload would
      // put a fresh blob on disk for every repeat click all over again.
      return hashedAt < uploadedAt && dedupedAt < uploadedAt
    },
  },
  {
    // The database-browser restore predates this fix and must survive it: its
    // url already points at durable storage, so it resolves by url and is never
    // re-fetched or re-uploaded. scripts/check-image-database-restore-actions.cjs
    // guards the feature's existence; this guards its ordering against the
    // hash-first flow added here.
    name: 'wiring — restore path resolves by url before any fetch or upload',
    pass: () => {
      const route = read(ROUTE_PATH)
      const restoreAt = route.indexOf('if (restoreOnlyIfMissing) {')
      const readAt = route.indexOf('await readImageBytes(imageUrl)')
      const uploadAt = route.indexOf('await put(')
      if (restoreAt === -1 || readAt === -1 || uploadAt === -1) {
        console.error(`    restore: ${restoreAt}, read: ${readAt}, upload: ${uploadAt} (-1 = missing)`)
        return false
      }
      return restoreAt < readAt && restoreAt < uploadAt &&
        /OR source_url = \$\{imageUrl\}/.test(route) &&
        /blobUrl = imageUrl/.test(route)
    },
  },
  {
    name: 'wiring — route insert carries source_url + content_hash and defers to the partial unique index',
    pass: () => {
      const route = read(ROUTE_PATH)
      return /INSERT INTO public\.favorites \([\s\S]*?source_url, content_hash,/.test(route) &&
        /ON CONFLICT \(user_id, content_hash\) WHERE content_hash IS NOT NULL DO NOTHING/.test(route)
    },
  },
  {
    name: 'wiring — route backfills source_url when a stable url finally arrives',
    pass: () => /UPDATE public\.favorites SET source_url = \$\{sourceUrl\} WHERE id =/.test(read(ROUTE_PATH)),
  },
  {
    name: 'wiring — route returns sourceUrl and never selects with *',
    pass: () => {
      const route = read(ROUTE_PATH)
      return /sourceUrl: storedSourceUrl \?\? clientSourceUrl/.test(route) &&
        /SELECT id, image_url, blob_url, source_url, content_hash/.test(route) &&
        // Anchored on `FROM` so the rule can be named in a comment without
        // tripping over itself.
        !/SELECT \*\s+FROM/i.test(route)
    },
  },
  {
    name: 'wiring — route only persists a source url vetted by persistableSourceUrl',
    pass: () => {
      const route = read(ROUTE_PATH)
      return /const sourceUrl = persistableSourceUrl\(imageUrl\)/.test(route) &&
        /from '@\/lib\/favorites\/identity'/.test(route)
    },
  },
  {
    name: 'wiring — hook matches via the shared helper, not a bare url equality',
    pass: () => {
      const hook = read(HOOK_PATH)
      return /const isFavorite = \(url: string\) => Boolean\(findFavoriteByUrl\(favorites, url\)\)/.test(hook) &&
        /const exists = findFavoriteByUrl\(favorites, url\) \?\? findFavoriteByUrl\(currentFavorites, url\)/.test(hook) &&
        !/favorites\.some\(f => f\.url === url\)/.test(hook) &&
        !/currentFavorites\.find\(f => f\.url === url\)/.test(hook)
    },
  },
  {
    name: 'wiring — hook replaces rather than stacks a server-deduped favorite',
    pass: () => /setFavorites\(prev => \[newFavorite, \.\.\.prev\.filter\(f => f\.id !== newFavorite\.id\)\]\)/.test(read(HOOK_PATH)),
  },
  {
    name: 'wiring — FavoriteImage exposes sourceUrl so the hook has something to match',
    pass: () => /sourceUrl\?: string/.test(read(SERVICE_PATH)),
  },
  {
    name: 'schema — migration adds both columns behind a PARTIAL unique index',
    pass: () => {
      if (!fs.existsSync(path.join(root, MIGRATION_PATH))) {
        console.error(`    missing migration: ${MIGRATION_PATH}`)
        return false
      }
      const migration = read(MIGRATION_PATH)
      return /ADD COLUMN IF NOT EXISTS source_url TEXT/.test(migration) &&
        /ADD COLUMN IF NOT EXISTS content_hash TEXT/.test(migration) &&
        // Partial, so legacy rows (content_hash IS NULL, duplicates included)
        // cannot block the migration on an existing database.
        /CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_content_hash_key[\s\S]*?WHERE content_hash IS NOT NULL/.test(migration)
    },
  },
]

const failures = checks.filter((check) => {
  try {
    return !check.pass()
  } catch (error) {
    console.error(`    threw: ${error && error.message}`)
    return true
  }
})

if (failures.length > 0) {
  console.error('Favorites toggle checks failed:')
  for (const failure of failures) {
    console.error(`- ${failure.name}`)
  }
  process.exit(1)
}

const executed = MATCH_CASES.length + SOURCE_URL_CASES.length + 3
console.log(
  `Favorites toggle checks passed (${checks.length} assertions; ${executed} executed against the real helpers)`,
)
