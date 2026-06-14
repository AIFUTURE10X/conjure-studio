const fs = require('fs')
const path = require('path')

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

const route = read('app/api/generate-prompt-suggestion/route.ts')
// The helper's chat logic lives in the chat controller hook since the
// studio workspace migration.
const sidebar = read('app/image-studio/components/AIHelper/useAIHelperChatController.ts')
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
    name: 'vague requests can ask clarification before the AI model is required',
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
    name: 'settings questions can be answered locally before the AI model is required',
    expected: [
      /buildLocalDiagnosticResponse/,
      /buildOperationalDiagnosticFindings/,
      /const earlyDiagnosticResponse = buildLocalDiagnosticResponse/,
      /return earlyDiagnosticResponse/,
      /before the AI model is required/,
      /Current model:/,
      /Background removal:/,
      /PhotoRoom/,
      /transparent PNG/,
      /responseMode: 'diagnostic'/,
    ],
  },
  {
    name: 'capability questions can be answered locally before the AI model is required',
    expected: [
      /isCapabilityGuideRequest/,
      /buildLocalCapabilityGuideResponse/,
      /const earlyCapabilityGuideResponse = buildLocalCapabilityGuideResponse/,
      /return earlyCapabilityGuideResponse/,
      /AI helper can help with:/,
      /Reference matching/,
      /Follow-up edits/,
      /PhotoRoom \/ transparent PNG/,
      /Try asking:/,
      /before the AI model is required/,
    ],
  },
  {
    name: 'generator-loaded reference images are active prompt context',
    expected: [
      /hasCurrentSettingsReference/,
      /formatCurrentGeneratorReferenceContext/,
      /CURRENT GENERATOR REFERENCE CONTEXT/,
      /Treat this as active reference context even if no separate AI-helper image analysis is available/,
      /logoHasReferenceImage/,
      /logoReferenceMode/,
      /referenceImageMode/,
      /hasSettingsReference/,
      /hasActiveReferenceContext/,
      /Reference-following rule/,
    ],
  },
  {
    name: 'memory questions can be answered locally before the AI model is required',
    expected: [
      /isMemoryStatusRequest/,
      /buildLocalMemoryStatusResponse/,
      /const earlyMemoryStatusResponse = buildLocalMemoryStatusResponse/,
      /return earlyMemoryStatusResponse/,
      /Memory status:/,
      /Last prompt:/,
      /Active task:/,
      /Saved preferences:/,
      /Reference memory:/,
      /Restore Last Prompt/,
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
const imageHandlerIndex = route.indexOf('Generate Prompt Suggestion called')
const postModelCheckIndex = route.indexOf('if (!hasOpenAITextApiKey())', imageHandlerIndex)
if (postImageClarificationIndex === -1 || postModelCheckIndex === -1 || postImageClarificationIndex > postModelCheckIndex) {
  failures.push({
    name: 'image clarification happens before OpenAI availability check',
    missing: [/return buildClarificationResponse\('image', earlyClarificationGate\) before OpenAI availability check/],
  })
}

const postImageDiagnosticIndex = route.indexOf('return earlyDiagnosticResponse')
if (postImageDiagnosticIndex === -1 || postModelCheckIndex === -1 || postImageDiagnosticIndex > postModelCheckIndex) {
  failures.push({
    name: 'image diagnostics happen before OpenAI availability check',
    missing: [/return earlyDiagnosticResponse before OpenAI availability check/],
  })
}

const postImageCapabilityIndex = route.indexOf('return earlyCapabilityGuideResponse')
if (postImageCapabilityIndex === -1 || postModelCheckIndex === -1 || postImageCapabilityIndex > postModelCheckIndex) {
  failures.push({
    name: 'image capability guide happens before OpenAI availability check',
    missing: [/return earlyCapabilityGuideResponse before OpenAI availability check/],
  })
}

const postImageMemoryIndex = route.indexOf('return earlyMemoryStatusResponse')
if (postImageMemoryIndex === -1 || postModelCheckIndex === -1 || postImageMemoryIndex > postModelCheckIndex) {
  failures.push({
    name: 'image memory status happens before OpenAI availability check',
    missing: [/return earlyMemoryStatusResponse before OpenAI availability check/],
  })
}

const logoHandlerIndex = route.indexOf('async function handleLogoMode')
const logoClarificationIndex = route.indexOf("return buildClarificationResponse('logo', earlyClarificationGate)", logoHandlerIndex)
const logoModelCheckIndex = route.indexOf('if (!hasOpenAITextApiKey())', logoHandlerIndex)
if (logoClarificationIndex === -1 || logoModelCheckIndex === -1 || logoClarificationIndex > logoModelCheckIndex) {
  failures.push({
    name: 'logo clarification happens before OpenAI availability check',
    missing: [/return buildClarificationResponse\('logo', earlyClarificationGate\) before OpenAI availability check/],
  })
}

const logoDiagnosticIndex = route.indexOf('return earlyDiagnosticResponse', logoHandlerIndex)
if (logoDiagnosticIndex === -1 || logoModelCheckIndex === -1 || logoDiagnosticIndex > logoModelCheckIndex) {
  failures.push({
    name: 'logo diagnostics happen before OpenAI availability check',
    missing: [/return earlyDiagnosticResponse before logo OpenAI availability check/],
  })
}

const logoCapabilityIndex = route.indexOf('return earlyCapabilityGuideResponse', logoHandlerIndex)
if (logoCapabilityIndex === -1 || logoModelCheckIndex === -1 || logoCapabilityIndex > logoModelCheckIndex) {
  failures.push({
    name: 'logo capability guide happens before OpenAI availability check',
    missing: [/return earlyCapabilityGuideResponse before logo OpenAI availability check/],
  })
}

const logoMemoryIndex = route.indexOf('return earlyMemoryStatusResponse', logoHandlerIndex)
if (logoMemoryIndex === -1 || logoModelCheckIndex === -1 || logoMemoryIndex > logoModelCheckIndex) {
  failures.push({
    name: 'logo memory status happens before OpenAI availability check',
    missing: [/return earlyMemoryStatusResponse before logo OpenAI availability check/],
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
