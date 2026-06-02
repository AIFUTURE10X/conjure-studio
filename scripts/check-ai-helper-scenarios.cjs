const fs = require('fs')
const path = require('path')

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

const route = read('app/api/generate-prompt-suggestion/route.ts')
const sidebar = read('app/image-studio/components/AIHelperSidebar.tsx')
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
  {
    name: 'vague requests can ask clarification before Gemini is required',
    expected: [
      /buildClarificationResponse/,
      /const earlyClarificationGate = buildClarificationGate/,
      /return buildClarificationResponse\('image', earlyClarificationGate\)/,
      /return buildClarificationResponse\('logo', earlyClarificationGate\)/,
      /plannerDecision: 'ask_follow_up'/,
      /suggestions: undefined/,
    ],
  },
  {
    name: 'settings questions can be answered locally before Gemini is required',
    expected: [
      /buildLocalDiagnosticResponse/,
      /buildOperationalDiagnosticFindings/,
      /const earlyDiagnosticResponse = buildLocalDiagnosticResponse/,
      /return earlyDiagnosticResponse/,
      /before Gemini is required/,
      /Current model:/,
      /Background removal:/,
      /PhotoRoom/,
      /Native PNG/,
      /responseMode: 'diagnostic'/,
    ],
  },
  {
    name: 'capability questions can be answered locally before Gemini is required',
    expected: [
      /isCapabilityGuideRequest/,
      /buildLocalCapabilityGuideResponse/,
      /const earlyCapabilityGuideResponse = buildLocalCapabilityGuideResponse/,
      /return earlyCapabilityGuideResponse/,
      /AI helper can help with:/,
      /Reference matching/,
      /Follow-up edits/,
      /PhotoRoom \/ Native PNG/,
      /Try asking:/,
      /before Gemini is required/,
    ],
  },
  {
    name: 'server recognizes structured clarification continuation answers',
    expected: [
      /hasStructuredClarificationContinuation/,
      /CLARIFICATION CONTINUATION/i,
      /original question:/i,
      /user answer:/i,
      /hasLegacyClarificationAnswer/,
      /hasClarificationAnswer = hasLegacyClarificationAnswer \|\| hasStructuredClarificationContinuation/,
    ],
  },
  {
    name: 'clarification answers carry structured continuity context',
    expected: [
      /buildClarificationContinuationRequest/,
      /CLARIFICATION CONTINUATION/,
      /Original question:/,
      /User answer:/,
      /Active design brief:/,
      /Active task:/,
      /Current generator prompt:/,
      /Continue from the pending clarification/,
      /buildClarificationContinuationRequest\(/,
    ],
    source: sidebar,
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

const postImageClarificationIndex = route.indexOf("return buildClarificationResponse('image', earlyClarificationGate)")
const postGeminiCheckIndex = route.indexOf('// Check if Gemini is available')
if (postImageClarificationIndex === -1 || postGeminiCheckIndex === -1 || postImageClarificationIndex > postGeminiCheckIndex) {
  failures.push({
    name: 'image clarification happens before Gemini availability check',
    missing: [/return buildClarificationResponse\('image', earlyClarificationGate\) before \/\/ Check if Gemini is available/],
  })
}

const postImageDiagnosticIndex = route.indexOf('return earlyDiagnosticResponse')
if (postImageDiagnosticIndex === -1 || postGeminiCheckIndex === -1 || postImageDiagnosticIndex > postGeminiCheckIndex) {
  failures.push({
    name: 'image diagnostics happen before Gemini availability check',
    missing: [/return earlyDiagnosticResponse before \/\/ Check if Gemini is available/],
  })
}

const postImageCapabilityIndex = route.indexOf('return earlyCapabilityGuideResponse')
if (postImageCapabilityIndex === -1 || postGeminiCheckIndex === -1 || postImageCapabilityIndex > postGeminiCheckIndex) {
  failures.push({
    name: 'image capability guide happens before Gemini availability check',
    missing: [/return earlyCapabilityGuideResponse before \/\/ Check if Gemini is available/],
  })
}

const logoHandlerIndex = route.indexOf('async function handleLogoMode')
const logoClarificationIndex = route.indexOf("return buildClarificationResponse('logo', earlyClarificationGate)", logoHandlerIndex)
const logoGeminiCheckIndex = route.indexOf('// Check if Gemini is available', logoHandlerIndex)
if (logoClarificationIndex === -1 || logoGeminiCheckIndex === -1 || logoClarificationIndex > logoGeminiCheckIndex) {
  failures.push({
    name: 'logo clarification happens before Gemini availability check',
    missing: [/return buildClarificationResponse\('logo', earlyClarificationGate\) before \/\/ Check if Gemini is available/],
  })
}

const logoDiagnosticIndex = route.indexOf('return earlyDiagnosticResponse', logoHandlerIndex)
if (logoDiagnosticIndex === -1 || logoGeminiCheckIndex === -1 || logoDiagnosticIndex > logoGeminiCheckIndex) {
  failures.push({
    name: 'logo diagnostics happen before Gemini availability check',
    missing: [/return earlyDiagnosticResponse before logo \/\/ Check if Gemini is available/],
  })
}

const logoCapabilityIndex = route.indexOf('return earlyCapabilityGuideResponse', logoHandlerIndex)
if (logoCapabilityIndex === -1 || logoGeminiCheckIndex === -1 || logoCapabilityIndex > logoGeminiCheckIndex) {
  failures.push({
    name: 'logo capability guide happens before Gemini availability check',
    missing: [/return earlyCapabilityGuideResponse before logo \/\/ Check if Gemini is available/],
  })
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
