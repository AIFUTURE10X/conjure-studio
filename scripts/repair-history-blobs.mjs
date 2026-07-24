/**
 * One-time repair + retention migration for generation_history / logo_history.
 *
 * Problem: rows saved while Blob was unconfigured store full base64 data URIs
 * inline (generation rows store them TWICE — image_urls and blob_urls), so
 * `SELECT *` for a heavy user exceeds the Neon HTTP driver's 64MB response cap
 * (HTTP 507) and every history sync 500s.
 *
 * This script:
 *  1. Prunes rows beyond the app's own retention window (newest 100 per user;
 *     favorited logo rows are never pruned) — these rows are invisible to the
 *     UI (GET LIMIT 100) and are what resurrected "deleted" history.
 *  2. Uploads every remaining inline data-URI image to Vercel Blob and rewrites
 *     the row to reference the Blob URL (image preserved, row shrinks ~99%).
 *
 * Idempotent: re-running finds fewer/no data-URI rows. Reads NEON_DATABASE_URL
 * and BLOB_READ_WRITE_TOKEN from .env.local.
 *
 * Usage: node scripts/repair-history-blobs.mjs [--dry-run]
 */
import { readFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'
import { put } from '@vercel/blob'

const DRY_RUN = process.argv.includes('--dry-run')
const RETAIN = 100
const CONCURRENCY = 5
const PLACEHOLDER_SUFFIX = '...[base64]'

// --- env ---------------------------------------------------------------
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split(/\r?\n/)) {
  const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim())
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2]
}
if (!process.env.NEON_DATABASE_URL) throw new Error('NEON_DATABASE_URL missing')
if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN missing')

const sql = neon(process.env.NEON_DATABASE_URL)

// --- helpers -----------------------------------------------------------
function dataUriToUpload(dataUri) {
  const match = /^data:(image\/[a-z0-9+.-]+);base64,(.+)$/s.exec(dataUri)
  if (!match) return null
  const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' }[match[1]] ?? 'png'
  return { contentType: match[1], ext, buffer: Buffer.from(match[2], 'base64') }
}

async function uploadDataUri(dataUri, name) {
  const parsed = dataUriToUpload(dataUri)
  if (!parsed) return null
  const result = await put(`${name}.${parsed.ext}`, parsed.buffer, {
    access: 'public',
    contentType: parsed.contentType,
    addRandomSuffix: true,
  })
  return result.url
}

async function pool(items, worker) {
  const queue = [...items.entries()]
  let ok = 0
  let failed = 0
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (;;) {
        const next = queue.shift()
        if (!next) return
        const [index, item] = next
        try {
          await worker(item)
          ok++
        } catch (err) {
          failed++
          console.error(`  row ${item.id ?? index} FAILED: ${String(err).slice(0, 200)}`)
        }
        const done = ok + failed
        if (done % 25 === 0) console.log(`  ...${done}/${items.length}`)
      }
    }),
  )
  return { ok, failed }
}

async function tableStats(table) {
  const [gen] = await sql`
    SELECT COUNT(*)::int AS rows,
           COALESCE(SUM(pg_column_size(t.*)), 0)::bigint AS bytes
    FROM public.generation_history t
  `
  const [logo] = await sql`
    SELECT COUNT(*)::int AS rows,
           COALESCE(SUM(pg_column_size(t.*)), 0)::bigint AS bytes
    FROM public.logo_history t
  `
  const fmt = (s) => `${s.rows} rows / ${(Number(s.bytes) / 1048576).toFixed(1)} MB`
  console.log(`[${table}] generation_history: ${fmt(gen)} | logo_history: ${fmt(logo)}`)
}

// --- 1. retention prune ------------------------------------------------
await tableStats('before')

if (DRY_RUN) {
  const [g] = await sql`
    SELECT COUNT(*)::int AS n FROM (
      SELECT ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC, id DESC) rn
      FROM public.generation_history
    ) t WHERE rn > ${RETAIN}
  `
  const [l] = await sql`
    SELECT COUNT(*)::int AS n FROM (
      SELECT is_favorited, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC, id DESC) rn
      FROM public.logo_history
    ) t WHERE rn > ${RETAIN} AND is_favorited IS NOT TRUE
  `
  console.log(`[dry-run] would prune ${g.n} generation rows, ${l.n} logo rows`)
} else {
  const prunedGen = await sql`
    DELETE FROM public.generation_history WHERE id IN (
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC, id DESC) rn
        FROM public.generation_history
      ) t WHERE rn > ${RETAIN}
    ) RETURNING id
  `
  const prunedLogo = await sql`
    DELETE FROM public.logo_history WHERE id IN (
      SELECT id FROM (
        SELECT id, is_favorited, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC, id DESC) rn
        FROM public.logo_history
      ) t WHERE rn > ${RETAIN} AND is_favorited IS NOT TRUE
    ) RETURNING id
  `
  console.log(`[prune] removed ${prunedGen.length} generation rows, ${prunedLogo.length} logo rows (beyond newest ${RETAIN}/user)`)
}

// --- 2. repair generation_history -------------------------------------
const genIds = await sql`
  SELECT id FROM public.generation_history
  WHERE EXISTS (SELECT 1 FROM unnest(blob_urls) u WHERE u LIKE 'data:%')
     OR EXISTS (SELECT 1 FROM unnest(image_urls) u WHERE u LIKE 'data:%')
  ORDER BY id
`
console.log(`[repair] generation_history rows with inline data URIs: ${genIds.length}`)

if (!DRY_RUN && genIds.length) {
  const result = await pool(genIds, async ({ id }) => {
    const [row] = await sql`SELECT id, image_urls, blob_urls FROM public.generation_history WHERE id = ${id}`
    if (!row) return
    const source = row.blob_urls ?? row.image_urls ?? []
    const newBlob = []
    const newImage = []
    for (let i = 0; i < source.length; i++) {
      const url = source[i]
      const imageEntry = row.image_urls?.[i] ?? url
      if (url.startsWith('data:')) {
        const uploaded = await uploadDataUri(url, `history/repair-g${id}-${i}`)
        if (uploaded) {
          newBlob.push(uploaded)
          newImage.push(url.substring(0, 50) + PLACEHOLDER_SUFFIX)
        } else {
          newBlob.push(url) // unparseable — keep as-is, GET guards against it
          newImage.push(imageEntry)
        }
      } else {
        newBlob.push(url)
        newImage.push(
          imageEntry.startsWith('data:') ? imageEntry.substring(0, 50) + PLACEHOLDER_SUFFIX : imageEntry,
        )
      }
    }
    await sql`
      UPDATE public.generation_history
      SET blob_urls = ${newBlob}, image_urls = ${newImage}
      WHERE id = ${id}
    `
  })
  console.log(`[repair] generation_history: ${result.ok} repaired, ${result.failed} failed`)
}

// --- 3. repair logo_history --------------------------------------------
const logoIds = await sql`
  SELECT id FROM public.logo_history
  WHERE COALESCE(blob_url, image_url) LIKE 'data:%'
  ORDER BY id
`
console.log(`[repair] logo_history rows with inline data URIs: ${logoIds.length}`)

if (!DRY_RUN && logoIds.length) {
  const result = await pool(logoIds, async ({ id }) => {
    const [row] = await sql`SELECT id, image_url, blob_url FROM public.logo_history WHERE id = ${id}`
    if (!row) return
    const dataUri = row.blob_url?.startsWith('data:') ? row.blob_url : row.image_url
    const uploaded = await uploadDataUri(dataUri, `logo-history/repair-l${id}`)
    if (!uploaded) return
    await sql`
      UPDATE public.logo_history
      SET blob_url = ${uploaded},
          image_url = ${dataUri.substring(0, 50) + PLACEHOLDER_SUFFIX}
      WHERE id = ${id}
    `
  })
  console.log(`[repair] logo_history: ${result.ok} repaired, ${result.failed} failed`)
}

await tableStats('after')

// --- 4. verify the previously-failing GET ------------------------------
const heavy = await sql`
  SELECT user_id, COUNT(*)::int AS n FROM public.generation_history
  GROUP BY user_id ORDER BY n DESC LIMIT 1
`
if (heavy.length) {
  const uid = heavy[0].user_id
  try {
    // Same worst-case query the deployed (pre-fix) GET route runs.
    const rows = await sql`
      SELECT * FROM public.generation_history
      WHERE user_id = ${uid} ORDER BY created_at DESC LIMIT 100
    `
    console.log(`[verify] GET simulation for ${uid}: ${rows.length} rows, JSON ${(JSON.stringify(rows).length / 1048576).toFixed(2)} MB — OK`)
  } catch (err) {
    console.log(`[verify] GET simulation for ${uid} still failing: ${String(err).slice(0, 160)}`)
  }
}
console.log(DRY_RUN ? 'DRY RUN complete (no writes).' : 'Repair complete.')
