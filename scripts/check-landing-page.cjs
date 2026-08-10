const fs = require('fs')
const path = require('path')

const root = process.cwd()
const pagePath = path.join(root, 'app', 'page.tsx')
const heroAssetPath = path.join(root, 'public', 'conjure-hero-atelier.webp')
const page = fs.readFileSync(pagePath, 'utf8')

const checks = [
  {
    name: 'landing page uses the current Conjure Studio icon brand',
    pass: /\/icon\.svg/.test(page) && /Conjure Studio/.test(page),
  },
  {
    name: 'hero has a direct primary action into the studio',
    pass: /href="\/image-studio"/.test(page) && /Enter the studio/.test(page),
  },
  {
    name: 'hero includes the generated creative atelier artwork',
    pass: /conjure-hero-atelier\.webp/.test(page) && fs.existsSync(heroAssetPath),
  },
  {
    name: 'landing page explains the real image logo video and mockup workflow',
    pass: ['Images', 'Logos', 'Motion', 'Mockups'].every((label) => page.includes(label)),
  },
  {
    name: 'landing page provides anchored product navigation',
    pass: ['#work', '#workflow', '#capabilities'].every((anchor) => page.includes(anchor)),
  },
  {
    name: 'landing page has a mobile navigation treatment',
    pass: /md:hidden/.test(page) && /hidden[^\"]*md:flex/.test(page),
  },
]

const failures = checks.filter((check) => !check.pass)

checks.forEach((check) => {
  console.log(`${check.pass ? 'PASS' : 'FAIL'} ${check.name}`)
})

if (failures.length > 0) {
  console.error(`\n${failures.length} landing-page contract check(s) failed.`)
  process.exit(1)
}

console.log('\nLanding-page contract checks passed.')
