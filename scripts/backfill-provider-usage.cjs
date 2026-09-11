/**
 * Backfill estimated provider_usage rows from the history tables (issue #50, AC-7).
 *
 * Live recording starts the day the ledger ships; everything generated before
 * that only exists in generation_history / logo_history / video_history. This
 * script writes one `source = 'backfill'`, `confidence = 'estimated'` row per
 * history row created before the first live row, priced by the rate card in
 * lib/costs/provider-rates.ts at the rate in force on the row's created_at:
 *
 *   generation_history  each image URL = one gpt-image-2 medium 1024×1024
 *                       generation (1756 image output tokens)
 *   logo_history        one such generation, plus one fal ben/v2/image call
 *                       (assumed 1024×1024 input) when wasBackgroundRemoval
 *   video_history       duration × the fal endpoint's rate for its resolution
 *                       and audio flag; failed rows cost 0
 *
 * Idempotent: source_ref is `<table>:<id>` under a unique index, so re-running
 * inserts nothing. Text-helper calls left no history and are not estimated.
 *
 * Usage: node scripts/backfill-provider-usage.cjs   (reads .env.local like run-sql.cjs)
 */
const fs = require('fs')
const path = require('path')
const ts = require('typescript')

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line)
    if (!match || process.env[match[1]]) continue
    let value = match[2]
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
    process.env[match[1]] = value
  }
}

/** lib/costs/provider-rates.ts is pure apart from its sibling rate-card module; both transpile the same way, every other require is stubbed. */
function loadTsModule(file) {
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: file,
  })
  const mod = { exports: {} }
  const localRequire = (id) => (id.startsWith('./') ? loadTsModule(path.join(path.dirname(file), `${id.slice(2)}.ts`)) : {})
  new Function('exports', 'require', 'module', '__filename', '__dirname', outputText)(mod.exports, localRequire, mod, file, path.dirname(file))
  return mod.exports
}

function loadRates() {
  return loadTsModule(path.join(__dirname, '..', 'lib', 'costs', 'provider-rates.ts'))
}

async function main() {
  loadEnvLocal()
  const url = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
  if (!url) {
    console.error('NEON_DATABASE_URL is not set (checked process env and .env.local)')
    process.exit(1)
  }
  const { neon } = require('@neondatabase/serverless')
  const sql = neon(url)
  const rates = loadRates()

  const [{ cutoff }] = await sql`SELECT COALESCE(MIN(occurred_at), NOW()) AS cutoff FROM public.provider_usage WHERE source = 'live'`
  console.log(`Estimating history created before ${new Date(cutoff).toISOString()} (first live row, or now)`)

  const rows = []
  const push = (sourceRef, occurredAt, userId, identity, units, status = 'succeeded') => {
    const priced = status === 'failed'
      ? { costUsd: 0, unitPrices: {}, rateEffectiveFrom: null, confidence: 'rate' }
      : rates.priceUsage({ ...identity, units }, new Date(occurredAt))
    rows.push({
      occurred_at: new Date(occurredAt).toISOString(),
      provider: identity.provider,
      model: identity.model,
      operation: identity.operation,
      feature: identity.feature,
      user_id: userId,
      status,
      units,
      unit_prices: priced.unitPrices,
      cost_usd: priced.costUsd,
      // A rate with no billable units (lipsync/upscale rows without a duration) stays unknown, never $0.
      confidence: priced.confidence === 'rate' ? 'estimated' : priced.confidence,
      rate_effective_from: priced.rateEffectiveFrom,
      source_ref: sourceRef,
    })
  }

  const images = await sql`
    SELECT id, user_id, created_at, COALESCE(array_length(image_urls, 1), 1) AS image_count
    FROM public.generation_history WHERE created_at < ${cutoff}
  `
  for (const row of images) {
    const count = Math.max(1, Number(row.image_count) || 1)
    push(`generation_history:${row.id}`, row.created_at, row.user_id,
      { provider: 'openai', model: 'gpt-image-2', operation: 'image-generate', feature: 'generate-image' },
      { image_tokens_out: 1756 * count, images_out: count, quality: 'medium' })
  }

  const logos = await sql`
    SELECT id, user_id, created_at, (config->>'wasBackgroundRemoval') AS was_bg_removal
    FROM public.logo_history WHERE created_at < ${cutoff}
  `
  for (const row of logos) {
    push(`logo_history:${row.id}`, row.created_at, row.user_id,
      { provider: 'openai', model: 'gpt-image-2', operation: 'image-generate', feature: 'generate-logo' },
      { image_tokens_out: 1756, images_out: 1, quality: 'medium' })
    if (String(row.was_bg_removal) === 'true') {
      push(`logo_history:${row.id}:bg`, row.created_at, row.user_id,
        { provider: 'fal', model: 'fal-ai/ben/v2/image', operation: 'bg-removal', feature: 'generate-logo' },
        { calls: 1, megapixels: 1.048576 })
    }
  }

  const videos = await sql`
    SELECT id, user_id, created_at, model, fal_endpoint, duration_seconds, resolution, has_audio, status
    FROM public.video_history WHERE created_at < ${cutoff}
  `
  for (const row of videos) {
    // Only completed or failed jobs are history; a job still pending at backfill
    // time never finished and is not estimated (AC-7: completed rows).
    if (row.status === 'pending') continue
    const operation = rates.operationForFalEndpoint(row.fal_endpoint)
    const seconds = Number(row.duration_seconds) || 0
    const units = operation === 'lipsync' ? { input_seconds: seconds }
      : operation === 'compose' ? { compute_seconds: seconds }
        : { seconds, resolution: row.resolution || undefined, audio: Boolean(row.has_audio) }
    const feature = operation === 'lipsync' ? 'lipsync' : operation === 'video-upscale' ? 'enhance-video' : operation === 'compose' ? 'assemble-film' : 'generate-video'
    push(`video_history:${row.id}`, row.created_at, row.user_id,
      { provider: 'fal', model: row.fal_endpoint, operation, feature },
      units, row.status === 'failed' ? 'failed' : 'succeeded')
  }

  let inserted = 0
  let total = 0
  for (const row of rows) {
    const result = await sql`
      INSERT INTO public.provider_usage (
        occurred_at, provider, model, operation, feature, user_id, status,
        units, unit_prices, cost_usd, confidence, rate_effective_from, source, source_ref
      ) VALUES (
        ${row.occurred_at}, ${row.provider}, ${row.model}, ${row.operation}, ${row.feature}, ${row.user_id}, ${row.status},
        ${JSON.stringify(row.units)}::jsonb, ${JSON.stringify(row.unit_prices)}::jsonb, ${row.cost_usd}, ${row.confidence}, ${row.rate_effective_from}, 'backfill', ${row.source_ref}
      )
      ON CONFLICT (source, source_ref) WHERE source_ref IS NOT NULL DO NOTHING
      RETURNING id
    `
    if (result.length > 0) {
      inserted += 1
      total += Number(row.cost_usd) || 0
    }
  }
  console.log(`Candidates: ${rows.length} (images ${images.length}, logos ${logos.length}, videos ${videos.length})`)
  console.log(`Inserted: ${inserted} rows, estimated total $${total.toFixed(4)}`)
}

main().catch((error) => {
  console.error('Backfill failed:', error)
  process.exit(1)
})
