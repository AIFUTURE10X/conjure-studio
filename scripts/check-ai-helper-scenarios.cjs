const fs = require('fs')
const path = require('path')

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

const route = read('app/api/generate-prompt-suggestion/route.ts')
const packageJson = read('package.json')

const scenarios = [
  {
    name: 'reference wordmark keeps typography instead of drifting into dot matrix',
    expected: [
      /SCENARIO QUALITY GATES/,
      /Reference wordmark typography/,
      /Do not replace a clean wordmark reference with dot matrix/,
      /letter proportions/,
      /stroke contrast/,
      /visual rhythm/,
    ],
  },
  {
    name: 'exact brand text uses overlay settings and blocks invented words',
    expected: [
      /Exact brand text/,
      /exact-text-overlay/,
      /do not invent words/,
      /misspelled text/,
      /incorrect capitalization/,
    ],
  },
  {
    name: 'white background and transparent png requests are resolved explicitly',
    expected: [
      /Background intent/,
      /white background means visible flat pure white/,
      /transparent PNG means no visible background/,
      /PhotoRoom/,
      /true PNG/,
    ],
  },
  {
    name: 'single-change follow-ups preserve locked visual elements',
    expected: [
      /Single-change follow-up/,
      /CHANGE CONTROL CONTEXT/,
      /change only the named attribute/,
      /preserve locked elements/,
      /do not reinterpret the concept/,
    ],
  },
  {
    name: 'scenario checker is wired into npm scripts',
    expected: [
      /"check:ai-helper-scenarios": "node scripts\/check-ai-helper-scenarios\.cjs"/,
    ],
    source: packageJson,
  },
]

const failures = []

for (const scenario of scenarios) {
  const source = scenario.source || route
  const missing = scenario.expected.filter((pattern) => !pattern.test(source))
  if (missing.length > 0) {
    failures.push({ name: scenario.name, missing })
  }
}

if (failures.length > 0) {
  console.error('AI helper scenario checks failed:')
  for (const failure of failures) {
    console.error(`- ${failure.name}`)
    for (const pattern of failure.missing) {
      console.error(`  missing ${pattern}`)
    }
  }
  process.exit(1)
}

console.log('AI helper scenario checks passed')
