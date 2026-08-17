const fs = require('fs')
const path = require('path')

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

/**
 * Load bright-detail-recovery for real execution. Its only import is `sharp`,
 * which we pass straight through, so evaluating it in isolation is safe.
 */
function loadRecovery() {
  const ts = require('typescript')
  const js = ts.transpileModule(read('lib/bright-detail-recovery.ts'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText
  const mod = { exports: {} }
  new Function('exports', 'require', 'module', js)(mod.exports, require, mod)
  return mod.exports.recoverBrightDetailOnDarkBackground
}

/** Deterministic PRNG — no Math.random, so the check is reproducible. */
function makeRng(seed) {
  let s = seed
  return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
}

/**
 * Build a logo-on-dark-background scenario: noisy backdrop at `bgLuma`, a solid
 * subject blob, and faint sparkles outside the blob that the matte dropped.
 */
async function buildScenario(sharp, bgLuma) {
  const W = 200
  const H = 200
  const rnd = makeRng(3)
  const img = Buffer.alloc(W * H * 4)
  for (let p = 0; p < W * H; p++) {
    const i = p * 4
    const n = Math.max(0, Math.round(bgLuma + (rnd() - 0.5) * 8))
    img[i] = n; img[i + 1] = n; img[i + 2] = n; img[i + 3] = 255
  }
  const inBlob = (x, y) => x >= 70 && x < 130 && y >= 70 && y < 130
  for (let y = 70; y < 130; y++) {
    for (let x = 70; x < 130; x++) {
      const i = (y * W + x) * 4
      img[i] = 220; img[i + 1] = 220; img[i + 2] = 220
    }
  }
  const sparkles = new Set()
  for (let k = 0; k < 150; k++) {
    const x = Math.floor(rnd() * W)
    const y = Math.floor(rnd() * H)
    if (inBlob(x, y)) continue
    const i = (y * W + x) * 4
    img[i] = 212; img[i + 1] = 175; img[i + 2] = 55
    sparkles.add(y * W + x)
  }

  const matte = Buffer.alloc(W * H * 4)
  for (let y = 70; y < 130; y++) {
    for (let x = 70; x < 130; x++) {
      const i = (y * W + x) * 4
      matte[i] = 220; matte[i + 1] = 220; matte[i + 2] = 220; matte[i + 3] = 255
    }
  }

  const toPng = (buf) => sharp(buf, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer()
  return {
    W, H, sparkles, inBlob,
    originalB64: (await toPng(img)).toString('base64'),
    matteB64: (await toPng(matte)).toString('base64'),
  }
}

const checks = [
  {
    name: 'PhotoRoom errors keep provider status metadata',
    pass: () => {
      const source = read('lib/photoroom-bg-removal.ts')
      return /class\s+PhotoRoomBgRemovalError\s+extends\s+Error/.test(source) &&
        /status:\s*number/.test(source) &&
        /isPhotoRoomBgRemovalError/.test(source) &&
        /new\s+PhotoRoomBgRemovalError\(/.test(source)
    },
  },
  {
    name: 'remove-background falls back from PhotoRoom to fal',
    pass: () => {
      const source = read('app/api/remove-background/route.ts')
      return /runPhotoRoomBackgroundRemoval/.test(source) &&
        /isPhotoRoomBgRemovalError/.test(source) &&
        /removeBackgroundWithFal/.test(source) &&
        /PhotoRoom failed; falling back to fal/.test(source) &&
        /fallbackWarning/.test(source)
    },
  },
  {
    // Source-level: the route imports Blob/Neon/credit-guard, so executing it
    // here is impractical. Anchored to the specific default assignment rather
    // than the whole file so a stray 'fal' elsewhere can't satisfy it.
    name: 'remove-background defaults to fal when the caller omits a method',
    pass: () => {
      const source = read('app/api/remove-background/route.ts')
      return /bgRemovalMethod = \(formData\.get\('bgRemovalMethod'\) as BackgroundRemovalMethod\) \|\| 'fal'/.test(source) &&
        // The fal path must keep its PhotoRoom safety net for unset FAL_KEY.
        /bgRemovalMethod === 'fal' && !isFalBgRemovalAvailable\(\)/.test(source)
    },
  },
  {
    name: 'remove-background returns provider errors without generic 500',
    pass: () => {
      const source = read('app/api/remove-background/route.ts')
      return /provider_error/.test(source) &&
        /provider_unavailable/.test(source) &&
        /status:\s*providerStatus/.test(source)
    },
  },
  {
    name: 'background remover client shows API error body',
    pass: () => {
      const source = read('app/image-studio/hooks/useBackgroundRemoverState.ts')
      const jsonReadIndex = source.indexOf('await response.json()')
      const okCheckIndex = source.indexOf('if (!response.ok)')
      return jsonReadIndex !== -1 &&
        okCheckIndex !== -1 &&
        jsonReadIndex < okCheckIndex &&
        /data\.error/.test(source) &&
        /HTTP \$\{response\.status\}/.test(source)
    },
  },
  {
    // EXECUTED, not regexed. Fails in both directions: over-firing (the bug
    // where a charcoal background came back as haze) and under-firing (a lazy
    // "always return the matte" fix that quietly drops the sparkle feature).
    name: 'bright-detail recovery restores sparkles without resurrecting the background',
    pass: async () => {
      const sharp = require('sharp')
      const recover = loadRecovery()
      let ok = true

      // bgLuma 26 sits inside the old danger band (gate was mean < 28 with a
      // hardcoded floor of 18) — this scenario used to resurrect 100% of it.
      for (const bgLuma of [5, 22, 26]) {
        const s = await buildScenario(sharp, bgLuma)
        const outB64 = await recover(s.originalB64, s.matteB64)
        const { data } = await sharp(Buffer.from(outB64, 'base64'))
          .ensureAlpha().raw().toBuffer({ resolveWithObject: true })

        let ghost = 0, bgCount = 0, bleed = 0, transparent = 0
        for (let p = 0; p < s.W * s.H; p++) {
          const x = p % s.W
          const y = Math.floor(p / s.W)
          const a = data[p * 4 + 3]
          if (!s.inBlob(x, y) && !s.sparkles.has(p)) {
            bgCount += 1
            if (a > 16) ghost += 1
          }
          if (a === 0) {
            transparent += 1
            if (data[p * 4] + data[p * 4 + 1] + data[p * 4 + 2] > 3) bleed += 1
          }
        }
        let restored = 0
        for (const p of s.sparkles) if (data[p * 4 + 3] > 64) restored += 1

        const ghostPct = (100 * ghost) / bgCount
        const bleedPct = transparent > 0 ? (100 * bleed) / transparent : 0
        const restoredPct = (100 * restored) / s.sparkles.size

        if (ghostPct > 1) {
          console.log(`     bgLuma ${bgLuma}: expected background ghosting <= 1%, received ${ghostPct.toFixed(2)}%`)
          ok = false
        }
        if (bleedPct > 1) {
          console.log(`     bgLuma ${bgLuma}: expected RGB bleed under transparent px <= 1%, received ${bleedPct.toFixed(2)}%`)
          ok = false
        }
        // Asserted at EVERY brightness, not just near-black. A hardcoded
        // recovery floor makes the safety gate bail out on the brighter
        // backdrops — no ghosting, but no sparkles either. This catches that.
        if (restoredPct < 90) {
          console.log(`     bgLuma ${bgLuma}: expected >= 90% of sparkles restored, received ${restoredPct.toFixed(1)}%`)
          ok = false
        }
      }

      return ok
    },
  },
  {
    name: 'logo-history handles missing database as local-only mode',
    pass: () => {
      const source = read('app/api/logo-history/route.ts')
      return /hasDatabaseConnection/.test(source) &&
        /database_unconfigured/.test(source) &&
        /localOnly/.test(source)
    },
  },
]

async function main() {
  let failed = 0
  for (const check of checks) {
    // Checks may be sync (source assertions) or async (executed behavior).
    const ok = await check.pass()
    console.log(`${ok ? 'PASS' : 'FAIL'} ${check.name}`)
    if (!ok) failed += 1
  }

  if (failed > 0) {
    console.error(`${failed} background remover resilience contract check(s) failed`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('background remover resilience checks crashed:', err)
  process.exit(1)
})
