const fs = require('fs')
const path = require('path')

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

const client = read('lib/gemini-client.ts')

// Isolate the inspire branch (everything after the replicate check) so a phrase
// in the replicate copy can't satisfy an inspire-mode assertion.
const inspireBranch = client.split("referenceMode === 'replicate'")[1] || ''

const checks = [
  {
    name: 'gemini inspire mode still incorporates the user prompt',
    pass: () => /applies this request: \$\{prompt\}/.test(inspireBranch),
  },
  {
    name: 'gemini inspire mode preserves a person\'s identity, gated on the reference being a person',
    pass: () =>
      /if the reference shows a person/i.test(inspireBranch) &&
      /recognizably the SAME individual/i.test(inspireBranch) &&
      /baldness/i.test(inspireBranch) &&
      /facial hair/i.test(inspireBranch),
  },
  {
    name: 'gemini replicate mode remains an exact copy that ignores the prompt',
    pass: () => /Generate an EXACT replica of this image/.test(client),
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
  console.error('Gemini inspire identity checks failed:')
  for (const failure of failures) {
    console.error(`- ${failure.name}`)
  }
  process.exit(1)
}

console.log('Gemini inspire identity checks passed')
