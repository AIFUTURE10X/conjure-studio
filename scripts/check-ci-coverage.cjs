/**
 * Contract: every check:* script in package.json actually runs in CI.
 *
 * Adding a contract check takes three edits — the script, the package.json
 * alias, and a step in .github/workflows/ci.yml. Missing the third one is
 * silent: the check passes locally, never runs on a PR, and the behaviour it
 * was written to protect regresses anyway. That is exactly how the image
 * history guards (check:persistence-identity, check:history-blob-fallback)
 * sat unenforced while history broke repeatedly.
 *
 * This check closes the loop in both directions:
 *   - every alias in package.json has a CI step
 *   - every CI step names an alias that exists
 *
 * It reads the real files, so it fails for real when either drifts.
 */

const fs = require('fs')
const path = require('path')

const root = process.cwd()

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

const packageJson = JSON.parse(read('package.json'))
const workflow = read('.github/workflows/ci.yml')

const declared = Object.keys(packageJson.scripts || {})
  .filter((name) => name.startsWith('check:'))
  .sort()

if (declared.length === 0) {
  throw new Error('No check:* scripts found in package.json — did the alias block move?')
}

// `run: npm run check:foo`, tolerating extra args and quoting.
const wired = new Set()
for (const match of workflow.matchAll(/npm\s+run\s+(check:[a-z0-9:-]+)/gi)) {
  wired.add(match[1])
}

const missingFromCi = declared.filter((name) => !wired.has(name))
if (missingFromCi.length > 0) {
  throw new Error(
    `These contract checks are defined in package.json but never run in CI:\n` +
      missingFromCi.map((name) => `  - ${name}`).join('\n') +
      `\n\nAdd a step to .github/workflows/ci.yml:\n` +
      missingFromCi
        .map((name) => `      - name: Contract — ${name.replace('check:', '')}\n        run: npm run ${name}`)
        .join('\n'),
  )
}

const unknownInCi = [...wired].filter((name) => !declared.includes(name)).sort()
if (unknownInCi.length > 0) {
  throw new Error(
    `ci.yml runs check scripts that package.json does not define (typo or deleted alias):\n` +
      unknownInCi.map((name) => `  - ${name}`).join('\n'),
  )
}

console.log(`✅ CI coverage: all ${declared.length} check:* scripts run in CI`)
