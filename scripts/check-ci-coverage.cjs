/**
 * Contract: every check:* script in package.json actually runs on a PR.
 *
 * Adding a contract check takes three edits — the script, the package.json
 * alias, and a step in .github/workflows/ci.yml. Missing the third one is
 * silent: the check passes locally, never runs on a PR, and the behaviour it
 * was written to protect regresses anyway. That is exactly how the image
 * history guards (check:persistence-identity, check:history-blob-fallback)
 * sat unenforced while history broke repeatedly.
 *
 * This check closes the loop in both directions:
 *   - every alias in package.json runs in some pull_request workflow
 *   - every `npm run check:*` in those workflows names an alias that exists
 *
 * Two things it deliberately does NOT assume:
 *
 *   1. That ci.yml is the only workflow. check:conventions runs from its own
 *      conventions.yml so it can skip `npm ci` — a real PR gate that an
 *      ci.yml-only scan reported as missing, turning the whole verify job red.
 *   2. That a check is always invoked through its npm alias. conventions.yml
 *      runs `node scripts/check-conventions.mjs` directly for the same reason,
 *      so the alias's own command is matched too.
 *
 * Only workflows triggered by pull_request count. A check that runs solely on
 * a tag or a manual dispatch is not guarding the PRs this contract is about.
 *
 * It reads the real files, so it fails for real when any of them drift.
 */

const fs = require('fs')
const path = require('path')

const root = process.cwd()
const WORKFLOW_DIR = '.github/workflows'

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

const packageJson = JSON.parse(read('package.json'))

const declared = Object.keys(packageJson.scripts || {})
  .filter((name) => name.startsWith('check:'))
  .sort()

if (declared.length === 0) {
  throw new Error('No check:* scripts found in package.json — did the alias block move?')
}

/** True when the workflow's `on:` block lists pull_request. */
function runsOnPullRequest(text) {
  const header = text.split(/^jobs:/m)[0]
  return /^\s*pull_request\s*:?\s*$/m.test(header)
}

const prWorkflows = fs
  .readdirSync(path.join(root, WORKFLOW_DIR))
  .filter((file) => /\.ya?ml$/.test(file))
  .map((file) => ({ file, text: read(`${WORKFLOW_DIR}/${file}`) }))
  .filter((workflow) => runsOnPullRequest(workflow.text))

if (prWorkflows.length === 0) {
  throw new Error(`No workflow in ${WORKFLOW_DIR} runs on pull_request — nothing gates a PR.`)
}

const workflowText = prWorkflows.map((workflow) => workflow.text).join('\n')

// `run: npm run check:foo`, tolerating extra args and quoting.
const wired = new Set()
for (const match of workflowText.matchAll(/npm\s+run\s+(check:[a-z0-9:-]+)/gi)) {
  wired.add(match[1])
}

/** The script file an alias shells out to, e.g. `scripts/check-conventions.mjs`. */
function aliasScriptPath(command) {
  const match = String(command || '').match(/(scripts\/[\w.-]+\.(?:cjs|mjs|js))/)
  return match ? match[1] : null
}

const missingFromCi = declared.filter((name) => {
  if (wired.has(name)) return false
  // Invoked directly rather than through the alias still counts as run.
  const scriptPath = aliasScriptPath(packageJson.scripts[name])
  return !(scriptPath && workflowText.includes(scriptPath))
})

if (missingFromCi.length > 0) {
  throw new Error(
    `These contract checks are defined in package.json but never run on a PR:\n` +
      missingFromCi.map((name) => `  - ${name}`).join('\n') +
      `\n\nScanned pull_request workflows: ${prWorkflows.map((w) => w.file).join(', ')}` +
      `\n\nAdd a step to ${WORKFLOW_DIR}/ci.yml:\n` +
      missingFromCi
        .map((name) => `      - name: Contract — ${name.replace('check:', '')}\n        run: npm run ${name}`)
        .join('\n'),
  )
}

const unknownInCi = [...wired].filter((name) => !declared.includes(name)).sort()
if (unknownInCi.length > 0) {
  throw new Error(
    `A pull_request workflow runs check scripts that package.json does not define (typo or deleted alias):\n` +
      unknownInCi.map((name) => `  - ${name}`).join('\n'),
  )
}

console.log(
  `✅ CI coverage: all ${declared.length} check:* scripts run on a PR ` +
    `(workflows: ${prWorkflows.map((w) => w.file).join(', ')})`,
)
