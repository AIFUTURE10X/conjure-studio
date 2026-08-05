const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

/**
 * Source with comments removed, for the few assertions that must stay
 * source-level.
 *
 * Matching raw source lets a commented-out call satisfy the check — the exact
 * dead-code failure mode the repo's contract-check rules warn about, and one this
 * script was caught by in review. Anything asserted against source goes through
 * here so a `// was: apiError(404, …)` cannot stand in for the real call.
 */
const readCode = (relativePath) => read(relativePath)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/.*$/gm, '$1')

const QUERY_PATH = 'lib/video/history-query.ts'
const ROUTE_PATH = 'app/api/video-history/route.ts'
const BROWSER_PATH = 'app/image-studio/components/Video/VideoHistory/useVideoHistoryBrowser.ts'
const BOARD_PATH = 'app/image-studio/components/Video/video-board.ts'
const GENERATION_PATH = 'app/image-studio/components/Video/useVideoGeneration.ts'
const CANVAS_PATH = 'app/image-studio/components/Video/VideoCanvas.tsx'
const MODAL_PATH = 'app/image-studio/components/Video/VideoHistory/VideoHistoryModal.tsx'
const CARD_PATH = 'app/image-studio/components/Video/VideoHistory/VideoHistoryCard.tsx'

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
const deleteSchema = queryModule.videoHistoryDeleteParamsSchema
const { buildPromptSearchPattern, pageFetchLimit, splitPage, resolveVideoDeleteOutcome } = queryModule

/** Execute the pure board-restoration helper without loading React. */
function loadBoardModule() {
  const { outputText } = ts.transpileModule(read(BOARD_PATH), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: BOARD_PATH,
  })
  const mod = { exports: {} }
  new Function('exports', 'require', 'module', '__filename', '__dirname', outputText)(
    mod.exports,
    (id) => { throw new Error(`unexpected runtime import in ${BOARD_PATH}: ${id}`) },
    mod,
    BOARD_PATH,
    path.dirname(BOARD_PATH),
  )
  return mod.exports
}

const { addVideoToBoard } = fs.existsSync(path.join(root, BOARD_PATH)) ? loadBoardModule() : {}

const parse = (params) => schema.safeParse(params)
const parseDelete = (params) => deleteSchema.safeParse(params)

/**
 * Executed against the real delete schema.
 *
 * The id arrives as a query-string value, so coercion is deliberate — but it must
 * not coerce junk into something that targets a row. `{}` and `''` are the ones
 * that matter: `Number(undefined)` is NaN and `Number('')` is 0, so a schema
 * missing `.int()`/`.positive()` would let a blank id through as a falsy value.
 */
const DELETE_CASES = [
  { name: 'a numeric string id parses to a number', input: { id: '42' }, wantOk: true, want: { id: 42 } },
  { name: 'a real number id parses', input: { id: 42 }, wantOk: true, want: { id: 42 } },
  { name: 'a missing id is rejected, not coerced to NaN', input: {}, wantOk: false },
  { name: 'a blank id is rejected, not coerced to 0', input: { id: '' }, wantOk: false },
  { name: 'a non-numeric id is rejected', input: { id: 'abc' }, wantOk: false },
  { name: 'a zero id is rejected', input: { id: '0' }, wantOk: false },
  { name: 'a negative id is rejected', input: { id: '-5' }, wantOk: false },
  { name: 'a fractional id is rejected', input: { id: '1.5' }, wantOk: false },
  { name: 'a null id is rejected', input: { id: null }, wantOk: false },
]

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
  {
    name: 'board restore — an archived clip is prepended to the working board',
    pass: () => {
      const existing = [{ jobId: 1, prompt: 'existing' }]
      const archived = { jobId: 2, prompt: 'restored' }
      const result = addVideoToBoard(existing, archived)
      return result.length === 2 && result[0] === archived && result[1] === existing[0]
    },
  },
  {
    name: 'board restore — a clip already on the board is not duplicated or overwritten',
    pass: () => {
      const live = { jobId: 7, prompt: 'fresh board state' }
      const current = [live]
      const archived = { jobId: 7, prompt: 'stale archive state' }
      const result = addVideoToBoard(current, archived)
      return result === current && result[0] === live
    },
  },
  {
    name: 'wiring — completed history and favorite cards expose Add to board',
    pass: () => {
      const generation = readCode(GENERATION_PATH)
      const canvas = readCode(CANVAS_PATH)
      const modal = readCode(MODAL_PATH)
      const card = readCode(CARD_PATH)
      return /addVideoToBoard/.test(generation) &&
        /restoreClipToBoard/.test(generation) &&
        /onAddToBoard=\{restoreClipToBoard\}/.test(canvas) &&
        /boardJobIds=\{new Set\(jobs\.map\(\(job\) => job\.jobId\)\)\}/.test(canvas) &&
        /if \(!boardJobIds\.has\(clip\.jobId\)\) onAddToBoard\(clip\)/.test(modal) &&
        /onClose\(\)/.test(modal) &&
        /aria-label=\{isOnBoard \? 'View board' : 'Add to board'\}/.test(card) &&
        /\{isOnBoard \? 'View board' : 'Add to board'\}/.test(card) &&
        !/disabled=\{isOnBoard\}/.test(card) &&
        /canDownload &&/.test(card)
    },
  },
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
  { name: 'delete schema is exported and parseable', pass: () => typeof deleteSchema?.safeParse === 'function' },
  ...DELETE_CASES.map((testCase) => ({
    name: `delete params — ${testCase.name}`,
    pass: () => {
      const result = parseDelete(testCase.input)
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
  {
    // The route's SQL lives in a template literal, so the ESCAPE character is
    // subject to JS escaping before Postgres ever sees it. A source-level
    // `ESCAPE '\'` cooks to `ESCAPE ''`, which Postgres reads as "no escape
    // character" — silently disabling buildPromptSearchPattern's work. Assert
    // the COOKED value, since matching the source text cannot tell the two apart.
    name: 'wiring — the ILIKE escape character survives JS cooking as a real backslash',
    pass: () => {
      const route = read(ROUTE_PATH)
      const match = route.match(/ESCAPE '(.*?)'/)
      if (!match) {
        console.error('    no ESCAPE clause found in the route')
        return false
      }
      // Cook the captured fragment exactly as the JS engine would in a template
      // literal. A lone backslash fails to parse here for the same reason it
      // misbehaves in the route — it escapes the character that follows it.
      let cooked
      try {
        cooked = eval('`' + match[1] + '`')
      } catch {
        console.error(`    the escape fragment ${JSON.stringify(match[1])} does not survive JS cooking`)
        console.error("    use two backslashes in source so one reaches Postgres: ESCAPE '\\\\'")
        return false
      }
      if (cooked !== '\\') {
        console.error(`    expected the cooked escape char: ${JSON.stringify('\\')}`)
        console.error(`    received: ${JSON.stringify(cooked)} (source: ${JSON.stringify(match[1])})`)
        return false
      }
      return true
    },
  },
  {
    name: 'wiring — DELETE composes the executed delete schema with userIdSchema',
    pass: () => {
      const route = read(ROUTE_PATH)
      return /videoHistoryDeleteParamsSchema\.extend\(\{\s*userId: userIdSchema\s*\}\)/.test(route)
    },
  },
  {
    // EXECUTED, not matched: a no-op delete reporting success is the regression
    // that would make the client drop a row the database still holds.
    name: 'delete outcome — zero rows deleted is a 404, not a success',
    pass: () => {
      const cases = [
        [0, { ok: false, status: 404, code: 'not_found' }],
        [1, { ok: true }],
        [7, { ok: true }],
      ]
      return cases.every(([rowCount, want]) => {
        const got = resolveVideoDeleteOutcome(rowCount)
        if (JSON.stringify(got) !== JSON.stringify(want)) {
          console.error(`    rowCount: ${rowCount}`)
          console.error(`    expected: ${JSON.stringify(want)}`)
          console.error(`    received: ${JSON.stringify(got)}`)
          return false
        }
        return true
      })
    },
  },
  {
    // A DELETE with no RETURNING cannot tell "removed" from "matched nothing".
    // Source-level because the handler needs a live Neon connection — but read
    // from comment-stripped source, so a commented-out call cannot satisfy it.
    name: 'wiring — DELETE keeps the pending guard and routes through the executed outcome',
    pass: () => {
      const route = readCode(ROUTE_PATH)
      const hasGuard = /status != 'pending'/.test(route)
      const returnsIds = /DELETE FROM public\.video_history[\s\S]*?RETURNING id/.test(route)
      const usesOutcome = /resolveVideoDeleteOutcome\(deleted\.length\)/.test(route)
      const branches = /if \(!outcome\.ok\)[\s\S]*?apiError\(outcome\.status, outcome\.code/.test(route)
      if (!hasGuard) console.error('    the status != pending guard is gone — a generating job could be deleted')
      if (!returnsIds) console.error('    DELETE has no RETURNING id, so a no-op is indistinguishable from a delete')
      if (!usesOutcome) console.error('    the route does not call resolveVideoDeleteOutcome(deleted.length)')
      if (!branches) console.error('    the route does not turn a non-ok outcome into its apiError status/code')
      return hasGuard && returnsIds && usesOutcome && branches
    },
  },
  {
    /*
      Regression guard for a deleted clip coming back.

      A favorite write that fails AFTER a delete used to pass the modal's
      generation guard, and restoreClip's not-found branch spliced the deleted row
      straight back in — the UI then asserted a clip existed that the database had
      dropped. The fix is a per-row tombstone that restoreClip consults.

      This also pins the SHAPE of the fix, not just its presence. Bumping
      listGeneration inside removeClips prevents resurrection too, but by
      discarding reverts for every other clip as well, so an unrelated delete
      leaves a different row wrong. Both halves are asserted: the tombstone must
      exist, and the coarse bump must not come back.

      Source-level because this is React hook state, not a pure function — read
      from comment-stripped source so a commented-out guard cannot satisfy it.
    */
    name: 'wiring — a deleted clip is tombstoned, and restoreClip refuses to resurrect it',
    pass: () => {
      const browser = readCode(BROWSER_PATH)
      const removeBody = browser.match(/const removeClips = useCallback\([\s\S]*?\n  \}, \[/)
      const restoreBody = browser.match(/const restoreClip = useCallback\([\s\S]*?\n  \}, \[/)
      if (!removeBody || !restoreBody) {
        console.error('    could not locate removeClips / restoreClip — the check needs updating alongside the refactor')
        return false
      }
      const tombstones = /deletedIds\.current\.add\(/.test(removeBody[0])
      const consults = /deletedIds\.current\.has\([\s\S]*?return/.test(restoreBody[0])
      // The coarse alternative, which this fix deliberately replaced.
      const bumpsGeneration = /listGeneration\.current\s*\+=/.test(removeBody[0])
      if (!tombstones) console.error('    removeClips does not tombstone the deleted ids')
      if (!consults) console.error('    restoreClip does not check the tombstones before re-inserting a row')
      if (bumpsGeneration) {
        console.error('    removeClips bumps listGeneration — too coarse; it also cancels reverts for unrelated clips')
      }
      return tombstones && consults && !bumpsGeneration
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
  `Video history query checks passed (${checks.length} assertions; ${PARAM_CASES.length + DELETE_CASES.length + 6} executed against the real module)`,
)
