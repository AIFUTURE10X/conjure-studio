/**
 * scripts/compare-bg-removers.cjs
 *
 * Side-by-side bake-off of every background remover available to us, so
 * "fal is worse than PhotoRoom" can be judged on pixels instead of vibes.
 *
 * Crucially it runs fal BiRefNet BOTH raw and with our
 * recoverBrightDetailOnDarkBackground() post-process, because that pass runs on
 * the fal path only — so any artifact it introduces looks like a fal problem.
 *
 * Usage:
 *   node scripts/compare-bg-removers.cjs <image-path-or-url> [outDir]
 *
 * Writes each cutout as a PNG plus an index.html contact sheet that renders
 * them over a checkerboard (artifacts are invisible on white, obvious on
 * checkerboard) with a dark/light toggle.
 *
 * Costs a few cents per run in real API calls. Needs FAL_KEY and
 * PHOTOROOM_API_KEY, read from .env.local.
 */

const fs = require('fs')
const path = require('path')

const root = process.cwd()

// ---------- env ----------

function loadEnvLocal() {
  const envPath = path.join(root, '.env.local')
  if (!fs.existsSync(envPath)) return {}
  const out = {}
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
    if (!m) continue
    out[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return out
}

const env = { ...loadEnvLocal(), ...process.env }
const FAL_KEY = env.FAL_KEY
const PHOTOROOM_API_KEY = env.PHOTOROOM_API_KEY

// ---------- input ----------

async function loadInput(src) {
  if (/^https?:\/\//.test(src)) {
    const res = await fetch(src)
    if (!res.ok) throw new Error(`Failed to fetch input image: ${res.status}`)
    return Buffer.from(await res.arrayBuffer())
  }
  return fs.readFileSync(path.resolve(root, src))
}

function detectMime(buf) {
  const b64 = buf.toString('base64')
  if (b64.startsWith('/9j/')) return 'image/jpeg'
  if (b64.startsWith('iVBOR')) return 'image/png'
  if (b64.startsWith('UklGR')) return 'image/webp'
  return 'image/png'
}

// ---------- providers ----------

async function falRun(endpoint, input) {
  if (!FAL_KEY) throw new Error('FAL_KEY not set')
  const res = await fetch(`https://fal.run/${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    throw new Error(`fal ${endpoint} → ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }
  const json = await res.json()
  const url = json?.image?.url || json?.url || json?.images?.[0]?.url
  if (!url) throw new Error(`fal ${endpoint}: no image url in ${JSON.stringify(json).slice(0, 300)}`)
  const img = await fetch(url)
  if (!img.ok) throw new Error(`fal ${endpoint}: result fetch ${img.status}`)
  return Buffer.from(await img.arrayBuffer())
}

const birefnet = (model, extra = {}) => (dataUri) =>
  falRun('fal-ai/birefnet/v2', {
    image_url: dataUri,
    model,
    output_format: 'png',
    refine_foreground: true,
    ...extra,
  })

async function photoroom(buf) {
  if (!PHOTOROOM_API_KEY) throw new Error('PHOTOROOM_API_KEY not set')
  const form = new FormData()
  form.append('image_file', new Blob([buf], { type: 'image/png' }), 'image.png')
  form.append('format', 'png')
  const res = await fetch('https://sdk.photoroom.com/v1/segment', {
    method: 'POST',
    headers: { 'x-api-key': PHOTOROOM_API_KEY, Accept: 'image/png' },
    body: form,
  })
  if (!res.ok) throw new Error(`PhotoRoom → ${res.status}: ${(await res.text()).slice(0, 300)}`)
  return Buffer.from(await res.arrayBuffer())
}

// Our production post-process, applied to a fal result so we can see exactly
// what it adds. Imported from the real module via transpile so this compares
// the shipped behavior, not a reimplementation.
function loadBrightDetailRecovery() {
  const ts = require('typescript')
  const file = path.join(root, 'lib/bright-detail-recovery.ts')
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    // esModuleInterop matters: without it the emitted `sharp_1.default(...)`
    // call resolves to undefined and the recovery pass silently no-ops.
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText
  const mod = { exports: {} }
  // Safe: this module's only import is `sharp`, which we pass through.
  new Function('exports', 'require', 'module', js)(mod.exports, require, mod)
  return mod.exports.recoverBrightDetailOnDarkBackground
}

// ---------- variants ----------

const VARIANTS = [
  {
    key: 'photoroom',
    label: 'PhotoRoom',
    note: 'Current quality bar (raw API output, no post-process)',
    run: ({ buf }) => photoroom(buf),
  },
  {
    key: 'fal-heavy-shipped',
    label: 'fal Heavy + our recovery pass',
    note: 'EXACTLY what production does today',
    run: async ({ buf, dataUri, recover }) => {
      const out = await birefnet('General Use (Heavy)')(dataUri)
      const fixed = await recover(buf.toString('base64'), out.toString('base64'))
      return Buffer.from(fixed, 'base64')
    },
  },
  {
    key: 'fal-heavy-raw',
    label: 'fal Heavy (RAW)',
    note: 'Same model, post-process removed — the control',
    run: ({ dataUri }) => birefnet('General Use (Heavy)')(dataUri),
  },
  {
    key: 'fal-matting',
    label: 'fal BiRefNet Matting',
    note: 'Trained for matting; best candidate for fine edges',
    run: ({ dataUri }) => birefnet('Matting')(dataUri),
  },
  {
    key: 'fal-portrait',
    label: 'fal BiRefNet Portrait',
    note: 'Portrait-tuned; for the people-cutout path',
    run: ({ dataUri }) => birefnet('Portrait')(dataUri),
  },
  {
    key: 'fal-dynamic',
    label: 'fal BiRefNet Dynamic',
    note: 'Dynamic resolution to 2304px — thin strokes survive better',
    run: ({ dataUri }) => birefnet('General Use (Dynamic)')(dataUri),
  },
  {
    key: 'fal-bria',
    label: 'fal Bria RMBG 2.0',
    note: 'Licensed-data model; same family as our Replicate BRIA',
    run: ({ dataUri }) => falRun('fal-ai/bria/background/remove', { image_url: dataUri }),
  },
  {
    key: 'fal-rembg',
    label: 'fal rembg',
    note: 'Cheap baseline for reference',
    run: ({ dataUri }) => falRun('fal-ai/imageutils/rembg', { image_url: dataUri }),
  },
]

// ---------- contact sheet ----------

function buildHtml(results, inputName) {
  const cards = results.map((r) => {
    const body = r.ok
      ? `<img src="./${r.key}.png" alt="${r.label}">`
      : `<div class="err">FAILED<br><span>${escapeHtml(r.error)}</span></div>`
    return `<figure>
      <figcaption><b>${escapeHtml(r.label)}</b><span>${escapeHtml(r.note)}</span>
      ${r.ok ? `<em>${r.ms}ms · ${(r.bytes / 1024).toFixed(0)}KB</em>` : ''}</figcaption>
      <div class="pane">${body}</div>
    </figure>`
  }).join('\n')

  return `<!doctype html><meta charset="utf-8">
<title>BG remover bake-off — ${escapeHtml(inputName)}</title>
<style>
  :root { --bg:#18181b; --fg:#fafafa; --muted:#a1a1aa; --card:#27272a; }
  body { margin:0; padding:24px; background:var(--bg); color:var(--fg);
         font:14px/1.5 ui-sans-serif,system-ui,sans-serif; }
  h1 { font-size:18px; margin:0 0 4px; }
  p.sub { color:var(--muted); margin:0 0 20px; }
  .controls { margin-bottom:20px; display:flex; gap:8px; flex-wrap:wrap; }
  button { background:var(--card); color:var(--fg); border:1px solid #3f3f46;
           padding:6px 12px; border-radius:6px; cursor:pointer; font:inherit; }
  button.on { background:linear-gradient(90deg,#c99850,#dbb56e); color:#000; border-color:transparent; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:16px; }
  figure { margin:0; background:var(--card); border:1px solid #3f3f46; border-radius:10px; overflow:hidden; }
  figcaption { padding:10px 12px; display:flex; flex-direction:column; gap:2px; border-bottom:1px solid #3f3f46; }
  figcaption span { color:var(--muted); font-size:12px; }
  figcaption em { color:#71717a; font-size:11px; font-style:normal; }
  .pane { aspect-ratio:1; display:grid; place-items:center; padding:12px;
          background-image:
            linear-gradient(45deg,#808080 25%,transparent 25%),
            linear-gradient(-45deg,#808080 25%,transparent 25%),
            linear-gradient(45deg,transparent 75%,#808080 75%),
            linear-gradient(-45deg,transparent 75%,#808080 75%);
          background-size:16px 16px;
          background-position:0 0,0 8px,8px -8px,-8px 0; }
  body.light .pane { background-image:none; background:#fff; }
  body.dark .pane  { background-image:none; background:#000; }
  body.mag .pane   { background-image:none; background:#f0f; }
  img { max-width:100%; max-height:100%; display:block; }
  .err { color:#f87171; text-align:center; font-size:12px; }
  .err span { color:var(--muted); }
</style>
<h1>Background remover bake-off</h1>
<p class="sub">Input: <code>${escapeHtml(inputName)}</code> — artifacts hide on white and show on checkerboard. Toggle the backdrop.</p>
<div class="controls">
  <button class="on" onclick="setBg(this,'')">Checkerboard</button>
  <button onclick="setBg(this,'light')">White</button>
  <button onclick="setBg(this,'dark')">Black</button>
  <button onclick="setBg(this,'mag')">Magenta</button>
</div>
<div class="grid">${cards}</div>
<script>
function setBg(btn, cls) {
  document.body.className = cls
  document.querySelectorAll('.controls button').forEach(b => b.classList.remove('on'))
  btn.classList.add('on')
}
</script>`
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

// ---------- main ----------

async function main() {
  const src = process.argv[2]
  if (!src) {
    console.error('Usage: node scripts/compare-bg-removers.cjs <image-path-or-url> [outDir]')
    process.exit(1)
  }
  const outDir = path.resolve(root, process.argv[3] || 'bg-comparison')
  fs.mkdirSync(outDir, { recursive: true })

  const buf = await loadInput(src)
  const dataUri = `data:${detectMime(buf)};base64,${buf.toString('base64')}`
  const recover = loadBrightDetailRecovery()

  fs.writeFileSync(path.join(outDir, 'input.png'), buf)
  console.log(`Input: ${src} (${(buf.length / 1024).toFixed(0)}KB)`)
  console.log(`Running ${VARIANTS.length} variants...\n`)

  const results = await Promise.all(VARIANTS.map(async (v) => {
    const started = Date.now()
    try {
      const out = await v.run({ buf, dataUri, recover })
      fs.writeFileSync(path.join(outDir, `${v.key}.png`), out)
      const ms = Date.now() - started
      console.log(`  PASS ${v.label} — ${ms}ms, ${(out.length / 1024).toFixed(0)}KB`)
      return { ...v, ok: true, ms, bytes: out.length }
    } catch (err) {
      console.log(`  FAIL ${v.label} — ${err.message}`)
      return { ...v, ok: false, error: err.message }
    }
  }))

  const html = buildHtml(results, path.basename(src))
  fs.writeFileSync(path.join(outDir, 'index.html'), html)

  console.log(`\nContact sheet: ${path.join(outDir, 'index.html')}`)
  const failed = results.filter((r) => !r.ok).length
  if (failed) console.log(`(${failed} variant(s) failed — see above)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
