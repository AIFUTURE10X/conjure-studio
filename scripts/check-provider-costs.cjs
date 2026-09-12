/**
 * Contract check: the provider rate card prices real usage correctly (issue #50).
 *
 * Executes the shipped priceUsage() (transpiled with the repo's TypeScript)
 * against known inputs, so a wrong rate, a broken effective-date lookup, or an
 * unpriced endpoint silently becoming $0 fails CI. lib/costs/provider-rates.ts
 * is pure apart from its sibling rate-card module, which the loader below
 * transpiles the same way; every other require is stubbed.
 *
 * Mutation-tested (see PR #50's Evidence): altering a rate, or making an
 * unknown endpoint return 0, makes this fail.
 */
const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const root = process.cwd()
const RATES_PATH = 'lib/costs/provider-rates.ts'

/** Transpile a lib/costs module; relative sibling imports load the same way, everything else is stubbed. */
function loadTsModule(relativePath) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: relativePath,
  })
  const mod = { exports: {} }
  const localRequire = (id) => (id.startsWith('./') ? loadTsModule(path.posix.join(path.posix.dirname(relativePath), `${id.slice(2)}.ts`)) : {})
  new Function('exports', 'require', 'module', '__filename', '__dirname', outputText)(mod.exports, localRequire, mod, relativePath, path.dirname(relativePath))
  return mod.exports
}

const rates = loadTsModule(RATES_PATH)
const { priceUsage, defaultImageOutputTokens, RATE_CARD } = rates

const failures = []
let executed = 0
function check(name, received, expected) {
  executed += 1
  const ok = JSON.stringify(received) === JSON.stringify(expected)
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`)
  if (!ok) {
    console.log(`     expected: ${JSON.stringify(expected)}`)
    console.log(`     received: ${JSON.stringify(received)}`)
    failures.push(name)
  }
}

const at = '2026-09-11T12:00:00Z'
const price = (provider, model, operation, units, when = at) => priceUsage({ provider, model, operation, units }, when)

// OpenAI images: 50 text tokens in + 1056 image tokens out = 50×5/1M + 1056×30/1M.
check('OpenAI image usage prices text-in and image-out tokens exactly',
  price('openai', 'gpt-image-2.5-flare', 'image-generate', { text_tokens_in: 50, image_tokens_out: 1056 }).costUsd, 0.03193)
check('OpenAI image input tokens bill at $8/1M',
  price('openai', 'gpt-image-2.5-flare', 'image-edit', { text_tokens_in: 50, image_tokens_in: 2000, image_tokens_out: 1056 }).costUsd, 0.04793)
check('OpenAI image usage is priced at confidence rate (the recorder upgrades it to exact)',
  price('openai', 'gpt-image-2.5-flare', 'image-generate', { image_tokens_out: 100 }).confidence, 'rate')

// OpenAI text: cached tokens are a subset of input and bill at the cached rate.
check('OpenAI text: 1000 in (200 cached) + 500 out on gpt-5.4-mini',
  price('openai', 'gpt-5.4-mini', 'text', { text_tokens_in: 1000, cached_tokens_in: 200, text_tokens_out: 500 }).costUsd,
  Math.round((800 * 0.75 + 200 * 0.075 + 500 * 4.5) / 1_000_000 * 1e6) / 1e6)

// Effective dates: Sol is on promo ($4/1M in) until 2026-11-21, list price ($5/1M) after.
check('a rate dated in the future is not applied to an earlier call',
  price('openai', 'gpt-5.6-sol', 'text', { text_tokens_in: 1_000_000 }, '2026-09-11T00:00:00Z').unitPrices.text_token_in, 4 / 1_000_000)
check('a call after a new rate takes effect uses the new rate',
  price('openai', 'gpt-5.6-sol', 'text', { text_tokens_in: 1_000_000 }, '2026-12-01T00:00:00Z').unitPrices.text_token_in, 5 / 1_000_000)
check('two entries for one model: a call between them uses the earlier',
  price('openai', 'gpt-5.6-sol', 'text', { text_tokens_in: 1_000_000 }, '2026-11-21T23:00:00Z').costUsd, 4)

// fal video per second, keyed by resolution and audio.
check('Kling 3 Pro: 8 s without audio = 8 × $0.112',
  price('fal', 'fal-ai/kling-video/v3/pro/image-to-video', 'video', { seconds: 8, resolution: '1080p', audio: false }).costUsd, 0.896)
check('Kling 3 Pro: 5 s with audio = 5 × $0.168',
  price('fal', 'fal-ai/kling-video/v3/pro/text-to-video', 'video', { seconds: 5, audio: true }).costUsd, 0.84)
check('Veo 3.1: 5 s 1080p with audio = $2.00',
  price('fal', 'fal-ai/veo3.1', 'video', { seconds: 5, resolution: '1080p', audio: true }).costUsd, 2)
check('Veo 3.1: 4k without audio = $0.40/s',
  price('fal', 'fal-ai/veo3.1/image-to-video', 'video', { seconds: 4, resolution: '4k', audio: false }).costUsd, 1.6)
check('Seedance Fast: 1080p 5 s = 243,000 tokens ≈ $0.243',
  price('fal', 'fal-ai/bytedance/seedance/v1/pro/fast/image-to-video', 'video', { seconds: 5, resolution: '1080p' }).costUsd, 0.243)
check('Seedance 2.0: 4k uses the cheaper per-token rate',
  price('fal', 'bytedance/seedance-2.0/image-to-video', 'video', { seconds: 5, resolution: '4k' }).unitPrices.video_token, 0.008 / 1000)
check('Lipsync: 7 s of input rounds up to two 5-second blocks',
  price('fal', 'fal-ai/kling-video/lipsync/audio-to-video', 'lipsync', { input_seconds: 7 }).costUsd, 0.028)
check('SeedVR: 1920×1080 × 121 frames = $0.25 (fal example)',
  price('fal', 'fal-ai/seedvr/upscale/video', 'video-upscale', { megapixels: 1920 * 1080 * 121 / 1e6 }).costUsd, 0.250906)
check('ElevenLabs TTS: 1,000 characters = $0.10',
  price('fal', 'fal-ai/elevenlabs/tts/eleven-v3', 'tts', { characters: 1000 }).costUsd, 0.1)
check('BEN2: a 1024×1024 input = 1.048576 MP × $0.025',
  price('fal', 'fal-ai/ben/v2/image', 'bg-removal', { calls: 1, megapixels: 1.048576 }).costUsd, 0.026214)

// Gemini per-image pricing when the provider gave no token counts.
check('Gemini 3.1 Flash Image: one 1K image = $0.067',
  price('gemini', 'gemini-3.1-flash-image-preview', 'image-generate', { images_out: 1, image_size: '1K' }).costUsd, 0.067)
check('Gemini 3 Pro Image: one 4K image = $0.24',
  price('gemini', 'gemini-3-pro-image-preview', 'image-generate', { images_out: 1, image_size: '4K' }).costUsd, 0.24)
check('Gemini token usage bills image output at $60/1M',
  price('gemini', 'gemini-3.1-flash-image-preview', 'image-generate', { text_tokens_in: 100, image_tokens_out: 1120 }).costUsd,
  Math.round((100 * 0.5 + 1120 * 60) / 1_000_000 * 1e6) / 1e6)

// Per-call providers.
check('PhotoRoom: one call = $0.02',
  price('photoroom', 'sdk.photoroom.com/v1/segment', 'bg-removal', { calls: 1 }).costUsd, 0.02)
check('Replicate BRIA: one image = $0.018',
  price('replicate', 'bria/remove-background', 'bg-removal', { calls: 1 }).costUsd, 0.018)

// AC-4: unknown endpoints are unpriced, never $0.
const unknown = price('fal', 'fal-ai/does-not-exist', 'video', { seconds: 5 })
check('unknown endpoint → cost null', unknown.costUsd, null)
check('unknown endpoint → confidence unpriced', unknown.confidence, 'unpriced')

// A priced model with none of its billable units is unknown, never a free call
// (lipsync / SeedVR jobs whose duration was not captured).
const noUnits = price('fal', 'fal-ai/kling-video/lipsync/audio-to-video', 'lipsync', {})
check('priced endpoint with no billable units → cost null', noUnits.costUsd, null)
check('priced endpoint with no billable units → confidence unknown', noUnits.confidence, 'unknown')
check('a $0 compute-second endpoint still prices (as $0, confidence rate), distinct from unknown',
  price('fal', 'fal-ai/whisper', 'transcribe', { seconds: 30 }).confidence, 'rate')

// Timeout / backfill estimates.
check('default output tokens: gpt-image-2 medium 1024² = 1756', defaultImageOutputTokens('gpt-image-2', 'medium', '1024x1024'), 1756)
check('default output tokens: 2.5 Flare low 1024² = 196', defaultImageOutputTokens('gpt-image-2.5-flare', 'low', '1024x1024'), 196)
check('default output tokens scale with pixel area (1536×1024 = 1.5×)', defaultImageOutputTokens('gpt-image-2.5-flare', 'medium', '1536x1024'), Math.round(439 * 1.5))

// Every entry carries a verifiable source.
check('every rate-card entry has an effectiveFrom date and an https source',
  RATE_CARD.every((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry.effectiveFrom) && /^https:\/\//.test(entry.sourceUrl)), true)

if (failures.length > 0) {
  console.error(`\n${failures.length} provider cost check(s) failed`)
  process.exit(1)
}
console.log(`\nProvider cost checks passed (${RATE_CARD.length} rate entries, ${executed} executed cases)`)
