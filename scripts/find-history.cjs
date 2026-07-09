/**
 * History recovery / inventory tool.
 *
 * Finds image + logo history that stopped showing up in the app. It reads
 * everything in the `generation_history` and `logo_history` Neon tables ACROSS
 * ALL user IDs (a cleared browser mints a fresh anonymous id and orphans old
 * rows under the previous id), and lists the Vercel Blob storage where the
 * actual PNGs live — so images are recoverable even if their DB rows were
 * deleted.
 *
 * Usage:
 *   node scripts/find-history.cjs
 *
 * Reads NEON_DATABASE_URL / DATABASE_URL and BLOB_READ_WRITE_TOKEN from
 * .env.local (falling back to the process environment). Nothing is modified —
 * this is read-only. A full dump is written to scripts/history-recovery.json
 * so you can pick out the URLs you want to re-add.
 */

const fs = require('fs')
const path = require('path')

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match) continue
    const key = match[1]
    let value = match[2]
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

function short(text, n = 60) {
  if (!text) return ''
  const s = String(text).replace(/\s+/g, ' ').trim()
  return s.length > n ? s.slice(0, n) + '…' : s
}

function firstUrl(value) {
  if (Array.isArray(value)) return value.find(Boolean) || null
  return value || null
}

async function tableExists(sql, table) {
  const rows = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${table}
    ) AS exists
  `
  return rows[0]?.exists === true
}

async function main() {
  loadEnvLocal()

  const conn = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
  if (!conn) {
    console.error('❌ NEON_DATABASE_URL / DATABASE_URL not set (checked env and .env.local).')
    console.error('   Run this from your project root where .env.local has the Neon connection string.')
    process.exit(1)
  }

  const { neon } = require('@neondatabase/serverless')
  const sql = neon(conn)

  const dump = { generation_history: [], logo_history: [], blobs: [] }

  console.log('🔎 History recovery — scanning Neon across ALL user IDs\n')

  // ---- generation_history (image generations) ----
  try {
    if (await tableExists(sql, 'generation_history')) {
      const rows = await sql`SELECT * FROM public.generation_history ORDER BY created_at DESC`
      console.log(`🖼️  generation_history: ${rows.length} row(s)`)
      const byUser = {}
      for (const r of rows) {
        byUser[r.user_id] = (byUser[r.user_id] || 0) + 1
        const urls = (r.blob_urls && r.blob_urls.length ? r.blob_urls : r.image_urls) || []
        dump.generation_history.push({
          id: r.id, userId: r.user_id, prompt: r.prompt,
          createdAt: r.created_at, imageUrls: urls,
        })
      }
      for (const [uid, count] of Object.entries(byUser)) console.log(`     • ${uid}: ${count}`)
      for (const r of rows.slice(0, 30)) {
        console.log(`     #${r.id} [${new Date(r.created_at).toISOString().slice(0, 10)}] "${short(r.prompt)}"`)
        console.log(`        ${firstUrl(r.blob_urls) || firstUrl(r.image_urls) || '(no url)'}`)
      }
    } else {
      console.log('🖼️  generation_history: TABLE DOES NOT EXIST (this is what makes the load 500).')
    }
  } catch (err) {
    console.log('🖼️  generation_history: query failed —', err.message)
  }

  console.log('')

  // ---- logo_history (logos) ----
  try {
    if (await tableExists(sql, 'logo_history')) {
      const rows = await sql`SELECT * FROM public.logo_history ORDER BY created_at DESC`
      console.log(`🎨 logo_history: ${rows.length} row(s)`)
      const byUser = {}
      for (const r of rows) {
        byUser[r.user_id] = (byUser[r.user_id] || 0) + 1
        dump.logo_history.push({
          id: r.id, userId: r.user_id, prompt: r.prompt,
          createdAt: r.created_at, isFavorited: r.is_favorited,
          imageUrl: r.blob_url || r.image_url,
        })
      }
      for (const [uid, count] of Object.entries(byUser)) console.log(`     • ${uid}: ${count}`)
      for (const r of rows.slice(0, 30)) {
        console.log(`     #${r.id} [${new Date(r.created_at).toISOString().slice(0, 10)}] "${short(r.prompt)}"`)
        console.log(`        ${r.blob_url || r.image_url || '(no url)'}`)
      }
    } else {
      console.log('🎨 logo_history: TABLE DOES NOT EXIST (this is what makes the load 500).')
    }
  } catch (err) {
    console.log('🎨 logo_history: query failed —', err.message)
  }

  console.log('')

  // ---- Vercel Blob storage (the actual PNGs, recoverable even without DB rows) ----
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (!blobToken) {
    console.log('📦 Vercel Blob: BLOB_READ_WRITE_TOKEN not set — skipping blob listing.')
  } else {
    try {
      const { list } = require('@vercel/blob')
      for (const prefix of ['history/', 'logo-history/']) {
        let cursor
        let count = 0
        do {
          const res = await list({ token: blobToken, prefix, cursor, limit: 1000 })
          for (const b of res.blobs) {
            count++
            dump.blobs.push({ pathname: b.pathname, url: b.url, size: b.size, uploadedAt: b.uploadedAt })
          }
          cursor = res.cursor
        } while (cursor)
        console.log(`📦 Blob "${prefix}": ${count} file(s)`)
      }
      for (const b of dump.blobs.slice(0, 40)) {
        console.log(`     ${b.url}`)
      }
    } catch (err) {
      console.log('📦 Vercel Blob: listing failed —', err.message)
    }
  }

  const outPath = path.join(__dirname, 'history-recovery.json')
  fs.writeFileSync(outPath, JSON.stringify(dump, null, 2))
  console.log(`\n✅ Full dump written to ${outPath}`)
  console.log(`   generation_history rows: ${dump.generation_history.length}`)
  console.log(`   logo_history rows:       ${dump.logo_history.length}`)
  console.log(`   blob files:              ${dump.blobs.length}`)
  console.log('\nOpen the URLs in a browser to confirm which are your 3 images, then re-add them.')

  process.exit(0)
}

main().catch((err) => {
  console.error('\n❌ Recovery scan failed:', err.message)
  process.exit(1)
})
