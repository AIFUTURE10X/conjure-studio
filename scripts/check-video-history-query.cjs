const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

const QUERY_PATH = 'lib/video/history-query.ts'
const ROUTE_PATH = 'app/api/video-history/route.ts'

/**
 * Load and EXECUTE the real query contract.
 *
 * A regex-only check keeps passing after the runtime behavior regresses — dead code
 * or a leftover matching string still satisfies it — so these assertions run the
 * shipped schema. The module is transpiled with the repo's own TypeScript and
 * evaluated with `require` passed through to the real zod (its only import), so
 * nothing here is stubbed away.
 */
function loadQueryModule() {
  const { outputText } = ts.transpileModule(read(QUERY_PATH), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: QUERY_PATH,
  })
  const mod = { exports: {} }
  const passthroughRequire = (id) => {
    if (id === 'zod') return require('zod')
    throw new Error(`unexpected import in ${QUERY_PATH}: ${id}`)
  }
  new Function('exports', 'require', 'module', '__filename', '__dirname', outputText)(
    mod.exports,
    passthroughRequire,
    mod,
    QUERY_PATH,
    path.dirname(QUERY_PATH),
  )
  return mod.exports
}

const queryModule = loadQueryModule()
const schema = queryModule.videoHistoryListParamsSchema
const { buildPromptSearchPattern, pageFetchLimit, splitPage } = queryModule

const parse = (params) => schema.safeParse(params)

/** Executed against the real schema — these fail if the query contract regresses. */
const PARAM_CASES = [
  {
    name: 'no params falls back to the first page, all clips',
    input: {},
    wantOk: true,
    want: { limit: 50, offset: 0, search: undefined, favoritesOnly: false },
  },
  {
    name: 'string query params are coerced to numbers',
    input: { limit: '25', offset: '100' },
    wantOk: true,
    want: { limit: 25, offset: 100, search: undefined, favoritesOnly: false },
  },
  {
    name: 'favoritesOnly=true parses as a real boolean, not a truthy string',
    input: { favoritesOnly: 'true' },
    wantOk: true,
    want: { limit: 50, offset: 0, search: undefined, favoritesOnly: true },
  },
  {
    name: 'favoritesOnly=false stays false',
    input: { favoritesOnly: 'false' },
    wantOk: true,
    want: { limit: 50, offset: 0, search: undefined, favoritesOnly: false },
  },
  {
    name: 'a cleared search box (blank) is treated as absent, not an empty filter',
    input: { search: '   ' },
    wantOk: true,
    want: { limit: 50, offset: 0, search: undefined, favoritesOnly: false },
  },
  {
    name: 'a real search term is trimmed and kept',
    input: { search: '  neon city  ' },
    wantOk: true,
    want: { limit: 50, offset: 0, search: 'neon city', favoritesOnly: false },
  },
  // Rejections: the point of AC-1 is that bad input 400s rather than being
  // silently coerced into a working query.
  { name: 'limit above the cap is rejected, not clamped', input: { limit: '500' }, wantOk: false },
  { name: 'limit of zero is rejected', input: { limit: '0' }, wantOk: false },
  { name: 'a malformed offset is rejected, not silently zeroed', input: { offset: 'abc' }, wantOk: false },
  { name: 'a negative offset is rejected', input: { offset: '-1' }, wantOk: false },
  { name: 'a fractional limit is rejected', input: { limit: '10.5' }, wantOk: false },
  { name: 'a non-boolean favoritesOnly is rejected', input: { favoritesOnly: 'yes' }, wantOk: false },
]

const checks = [
  { name: 'query schema is exported and parseable', pass: () => typeof schema?.safeParse === 'function' },
  ...PARAM_CASES.map((testCase) => ({
    name: `params — ${testCase.name}`,
    pass: () => {
      const result = parse(testCase.input)
      if (result.success !== testCase.wantOk) {
        console.error(`    expected parse to ${testCase.wantOk ? 'succeed' : 'fail'}`)
        console.error(`    received: ${JSON.stringify(result.success ? result.data : result.error.issues)}`)
        return false
      }
      if (!testCase.wantOk) return true
      const got = JSON.stringify(result.data)
      const want = JSON.stringify(testCase.want)
      if (got !== want) {
        console.error(`    expected: ${want}`)
        console.error(`    received: ${got}`)
        return false
      }
      return true
    },
  })),
  {
    name: 'search — ILIKE wildcards in user input are escaped',
    pass: () => {
      const cases = [
        ['50%', '%50\\%%'],
        ['a_b', '%a\\_b%'],
        ['back\\slash', '%back\\\\slash%'],
        ['plain', '%plain%'],
      ]
      return cases.every(([input, want]) => {
        const got = buildPromptSearchPattern(input)
        if (got !== want) {
          console.error(`    input: ${JSON.stringify(input)}`)
          console.error(`    expected: ${JSON.stringify(want)}`)
          console.error(`    received: ${JSON.stringify(got)}`)
          return false
        }
        return true
      })
    },
  },
  {
    name: 'paging — one row is over-fetched so hasMore needs no COUNT',
    pass: () => pageFetchLimit(50) === 51 && pageFetchLimit(1) === 2,
  },
  {
    name: 'paging — a full over-fetched page reports hasMore and is trimmed to size',
    pass: () => {
      const rows = Array.from({ length: 51 }, (_, index) => index)
      const { page, hasMore } = splitPage(rows, 50)
      return hasMore === true && page.length === 50 && page[49] === 49
    },
  },
  {
    name: 'paging — a short page reports no more and is left intact',
    pass: () => {
      const { page, hasMore } = splitPage([1, 2, 3], 50)
      return hasMore === false && page.length === 3
    },
  },
  // Wiring stays source-level: the route body needs a live Neon connection to
  // invoke, so these confirm the executed helpers are actually reached by it and
  // that filtering did not drift back to being client-side.
  {
    name: 'wiring — the route composes the executed schema and returns hasMore',
    pass: () => {
      const route = read(ROUTE_PATH)
      return /videoHistoryListParamsSchema\.extend\(\{\s*userId: userIdSchema\s*\}\)/.test(route) &&
        /splitPage\(rows, limit\)/.test(route) &&
        /pageFetchLimit\(limit\)/.test(route) &&
        /NextResponse\.json\(\{ videos, hasMore \}\)/.test(route)
    },
  },
  {
    name: 'wiring — favorites and search are filtered in SQL, not after the fetch',
    pass: () => {
      const route = read(ROUTE_PATH)
      return /is_favorited = true/.test(route) &&
        /prompt ILIKE \$\{searchPattern\} ESCAPE/.test(route) &&
        /LIMIT \$\{pageFetchLimit\(limit\)\} OFFSET \$\{offset\}/.test(route)
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
  console.error('Video history query checks failed:')
  for (const failure of failures) {
    console.error(`- ${failure.name}`)
  }
  process.exit(1)
}

console.log(
  `Video history query checks passed (${checks.length} assertions; ${PARAM_CASES.length + 4} executed against the real module)`,
)
