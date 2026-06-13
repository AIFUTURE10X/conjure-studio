# YouTube Thumbnail Generator — Spec / Proposal

**Status:** Draft proposal · **Owner:** TBD · **Last updated:** 2026-06-13

A focused "Thumbnail" mode for the Image Studio that helps creators produce
high–click-through YouTube thumbnails. It is deliberately built as a **5th
mode** alongside Image / Logo / Mockups / BG Remover, reusing the studio's
existing engines rather than inventing new ones.

---

## 1. Verdict (why it's worth doing)

- **High demand, paying users.** A thumbnail directly drives a creator's
  click-through rate = their income, so creators readily pay for tools that
  help. Strong fit for the existing credits/Stripe layer.
- **We already own ~80% of the pieces** (see §3). The MVP is mostly a new
  *workflow + presets* on top of existing engines.
- **Marketing hook.** "AI YouTube Thumbnail Maker" is a far stronger
  landing-page / SEO magnet than "image generator."

**The one rule that makes or breaks it:** the headline text is an **editable
overlay layer**, never baked into the generated pixels. AI models render text
poorly; we composite instead of pure-generate.

---

## 2. Goals / Non-goals

**Goals**
- Produce an export-ready **1280×720 (16:9)** thumbnail in a few clicks.
- Combine: a background (generated or uploaded), a cut-out subject/face, big
  editable headline text, and optional graphics (channel logo, arrows, emoji).
- Offer AI assistance: video title → thumbnail concepts + punchy text.

**Non-goals (for MVP)**
- Video editing, A/B CTR analytics, or auto-publishing to YouTube.
- Animated thumbnails.
- Pixel-perfect Photoshop-grade layer editing (keep it opinionated/templated).

---

## 3. Reuse map — how existing features complement this

This is the core argument: the thumbnail tool is mostly **composition of
features we already shipped.**

| Existing feature | Where it lives today | Role in the thumbnail tool |
|---|---|---|
| **Background removal** (PhotoRoom / imgly) | `/api/remove-background`, BG Remover mode | Cut out the creator's face/subject — the #1 thumbnail building block |
| **Image generation** (Gemini 3.1 Flash / GPT-Image-2 / Gemini 3 Pro) | `/api/generate-image` | Generate or restyle the **background** from a prompt or reference |
| **20 style presets** (Realistic→Spider-Verse) | `constants/camera-options.ts` | One-tap background styling (gaming → 3D Render, vlog → Realistic, etc.) |
| **Text overlay editor** | `components/TextOverlayEditor` | The editable headline layer — outline/shadow/gradient text |
| **Real font overlay** | `components/Logo/RealFontOverlay` | High-quality typographic headlines with real fonts |
| **WYSIWYG export** (`html-to-image`) | `Logo/MockupPreview/generic/useGenericExport.ts` | Pixel-perfect **1280×720** export of the layered canvas (same engine as mockups) |
| **4K upscale** | `/api/upscale-logo` | Sharpen the final composite for crisp uploads |
| **Recolor** | `/api/recolor-logo` | Snap text/graphics to the channel's brand colors |
| **Reference images** (subject / scene / style) | Image mode upload panel | Match a creator's existing look or a reference thumbnail |
| **AI helper + prompt suggestion** | `/api/generate-prompt-suggestion`, `/api/enhance-logo-prompt` | Title → 3 concepts + headline text suggestions |
| **Image analysis** | `/api/analyze-image` | Analyze an uploaded reference thumbnail to extract its style/composition |
| **Brand kit / logo** | `/api/brand-kit`, Logo mode | Drop the channel logo / watermark onto the thumbnail |
| **Favorites + history + presets** | studio core | Save brand thumbnail templates and reuse past thumbnails |
| **Seed control** | `SeedControlDropdown` | Consistent background series across an episode set |
| **Creative direction (141 opts) + camera angle/lens** | `constants/*` | Dramatic, high-contrast background shots |
| **Mockup compositing model** (layered DOM → export) | `Logo/MockupPreview/*` | The thumbnail canvas *is* a mockup: stacked layers exported via WYSIWYG |

**Takeaway:** the only genuinely new code is (a) the 1280×720 layered canvas
with drag/resize, (b) a small set of templates, and (c) the AI "title →
concepts" prompt. Everything else is wiring existing engines together.

---

## 4. UX — the "Thumbnail" mode

Add `'thumbnail'` to `StudioMode` and a **Thumbnail** tab in `StudioTopBar`
(between Image and Logo, or after Mockups). Layout mirrors the other modes:

- **Left (AI Helper panel):** "Paste your video title" box → generates concepts
  + suggested headline text; chat refine.
- **Center (canvas):** fixed **16:9** stage with safe-zone guides, layered:
  `background → subject cutout → headline text → graphics/logo`. Drag, resize,
  reorder, nudge. Live, true-to-export preview.
- **Right (settings rail):** `ThumbnailSettingsRail` — template picker,
  background source (generate / upload / solid / gradient), style preset,
  text style presets (outline/shadow/gradient/highlight), brand colors,
  logo/watermark toggle, export controls.

### Core workflow
1. Pick a **template** (or start blank).
2. **Background:** generate from a prompt (reuse image gen + styles), upload an
   image, or pick a solid/gradient.
3. **Subject:** upload a photo → auto background-removal cutout → position it.
4. **Headline:** type text (or accept an AI suggestion) → apply a high-CTR text
   preset (bold + outline + shadow).
5. **Polish:** add channel logo/emoji/arrow, recolor to brand, optional upscale.
6. **Export** exact 1280×720 PNG/JPG (`html-to-image`), under YouTube's 2 MB.

### Templates (MVP set, 5–6)
- Face-left + big text-right
- Big number / "TOP 10"
- Reaction face + bold word
- VS / comparison split
- Before/After
- Full-bleed background + lower-third text

---

## 5. AI angle (the differentiator)

Reuse the AI helper + Gemini. New prompt flow:

- **Input:** video title (+ optional channel niche, tone).
- **Output:** 3 thumbnail *concepts* (layout + background idea + 2–4 word
  headline + suggested emotion/color), rendered as pickable cards.
- Picking a concept pre-fills the template, background prompt, and headline.

This is what turns it from "another canvas" into "an AI thumbnail assistant,"
and it leans entirely on infrastructure we already have.

---

## 6. Output / technical spec

- **Canvas:** 1280×720 logical; export at 2× (`pixelRatio: 2`) for crispness,
  then downscale to 1280×720 on export, or export native and document size.
- **Formats:** PNG (default) + JPG (smaller); enforce **≤ 2 MB** (YouTube cap).
- **Safe zones:** overlay guide for the bottom-right timestamp area and the
  title-bar crop; toggle off for export (filter by class, like mockups do).
- **Export engine:** `html-to-image` `toCanvas` — same WYSIWYG pattern
  documented in `image-studio/CLAUDE.md`, so preview === export.

---

## 7. Data model (sketch)

```ts
interface ThumbnailConfig {
  templateId: string
  background:
    | { type: 'generated'; url: string; prompt: string; style: string; seed?: number }
    | { type: 'upload'; url: string }
    | { type: 'solid' | 'gradient'; colors: string[] }
  subject?: { url: string; cutout: boolean; x: number; y: number; scale: number; flip?: boolean }
  headline: { text: string; preset: TextPresetId; color: string; x: number; y: number; rotation: number }
  graphics: Array<{ type: 'logo' | 'emoji' | 'shape'; url?: string; x: number; y: number; scale: number }>
  brandColors?: string[]
}
```

Persist to `localStorage` + (signed-in) the existing history tables; "Save as
template" reuses the presets system.

---

## 8. New vs reused surface

**Reused (no new backend):** image gen, bg removal, upscale, recolor,
analyze-image, prompt-suggestion, favorites/history, export hook.

**New, small:**
- `'thumbnail'` mode wiring: `studio-types.ts`, `StudioTopBar` tab,
  `CanvasPanel`, a `ThumbnailCanvas`, a `ThumbnailSettingsRail`.
- `useThumbnail` state hook + `thumbnail-templates.ts` constants.
- One new prompt path: `/api/generate-thumbnail-concepts` (or extend
  `generate-prompt-suggestion`) for title → concepts.
- Credit costs in `lib/credits/cost-map.ts` (background-gen and concepts reuse
  existing image-gen/AI costs; canvas edit/export are free).

---

## 9. Phasing

**MVP (validate demand, ~small because of reuse):**
- Thumbnail mode + 16:9 canvas + safe-zone guide.
- Background: generate (reuse) / upload / solid.
- Subject upload → cutout (reuse bg removal).
- Headline text + 3–4 text presets (reuse overlay editor).
- 4 templates + AI "title → 3 concepts + text."
- Export 1280×720 PNG/JPG.

**V2:** more templates, emoji/arrow/sticker library, brand-color lock + logo
watermark, recolor + upscale buttons, reference-thumbnail analysis, A/B
side-by-side preview, "thumbnail pack" (generate 3 variants at once).

**Later:** CTR guidance, channel branding profiles, batch from a list of titles.

---

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Crowded market (Canva, Pikzels, etc.) | Lead with the AI "title → concepts" + tight reuse of our gen/cutout; ship an opinionated, fast flow, not a blank canvas |
| AI text is garbled | Text is always an overlay layer, never generated |
| Scope creep into a full editor | Templates-first, limited layer types in MVP |
| Focus dilution across modes | Reuse-heavy MVP keeps maintenance low; gate behind the existing mode system |
| Export size > 2 MB | JPG fallback + quality clamp on export |

---

## 11. Open questions

1. Tab placement/name: "Thumbnail" vs "YouTube"? Visible to all users or gated
   (e.g., signed-in / credits)?
2. MVP template set — which 4 first?
3. Should "Save as template" be per-user brand kits (needs the brand-color +
   logo profile)?
4. Concepts: one combined AI call (concept + text) or two steps?

---

## 12. Backlog / next to-dos (live)

Running list of follow-ups. Checked = shipped.

**From the AI-panel screenshot (2026-06-13):**
- [x] Put the **Style** selector and the **Image generator** (model + size) in
  their own labelled containers.
- [x] Add a **4K** quality option (alongside 1K / 2K).

**Settings panel — split AI vs Manual (requested 2026-06-13):**
- [x] First cut: a "Manual editor" header now divides the AI tools (top) from
  the manual controls (`ThumbnailSettingsRail.tsx` → renders `ThumbnailAiPanel`
  then Template / Background / Subject / Headline / Stickers / Export).
- [x] **Fuller version:** AI and Manual are now two distinct *features* behind an
  **AI | Manual** tab switcher at the top of the rail. `ThumbnailSettingsRail.tsx`
  is a thin shell (tabs + state) that swaps between `ThumbnailAiPanel` and the new
  `ThumbnailManualPanel.tsx` (extracted Template / Background / Subject / Headline /
  Stickers / Export). Both panels stay mounted (the inactive one is `hidden`) so a
  typed video title or fetched AI concepts survive switching tabs; shared canvas
  state lives in `ThumbnailProvider`, so edits from either tab compose together.

**Shipped (batch, 2026-06-13):**
- [x] **Model + size on the "3 concepts" step.** Picking a concept already
  generates its background with the panel-selected model + size (incl. 4K);
  added a hint in `ThumbnailAiPanel` to make that explicit.
- [x] **History save + reopen.** `useThumbnailHistory` saves the composite PNG +
  full editable config to the shared `logo_history` table (`style='thumbnail'`,
  no migration needed); `ThumbnailHistoryStrip` lists them — click to reopen &
  edit (`applyConfig`), hover to delete. Large 4K-background saves can exceed the
  request limit and fail gracefully with a toast (acceptable MVP).
- [x] **Brand kit / channel-logo watermark.** `ThumbnailLogoPanel` — upload a
  logo or pull a recent one from Logo mode (`/api/logo-history`); added as a
  draggable **image sticker** layer (new `type:'image'`), inlined as a data URL
  so it never taints the export canvas.
- [x] **Recolor / upscale.** Export panel does an AI **upscale** of the composite
  to 2K/4K (`/api/upscale-logo`) and downloads it; `ThumbnailRecolor` snaps the
  **background** to brand colors (`/api/recolor-logo`) while the headline stays an
  editable overlay (recolor on the full composite would destroy the text, so it
  targets the background only).
- [x] **A/B compare.** Select two saved thumbnails in the strip → `Compare A/B`
  opens `ThumbnailCompareModal` (side-by-side 16:9).
- [x] **JPG export + ≤2 MB clamp.** Export format toggle (PNG / JPG); JPG lowers
  quality until it fits YouTube's 2 MB cap (`canvasToJpegBlob`).
- [x] **More templates + emoji search.** 8 templates now (added Top-10/List, VS,
  Podcast, Lower-third); the sticker picker has a keyworded search over ~40
  emojis.
- [x] **On-canvas subject resize.** Selecting the subject shows a bounding box +
  corner handle; dragging it resizes (`useStageDrag` gained a resize mode).

**Architecture note:** provider stayed lean by extracting logic into hooks
(`useThumbnailGenerate` / `useThumbnailExport` / `useThumbnailHistory`) + utils
(`thumbnail-export.ts`, `thumbnail-stage-utils.tsx`, `thumbnail-ui.ts`) and
layer components (`ThumbnailLayers.tsx`). Every file is under the 300-line rule
except the pure data/types `thumbnail-constants.ts` (allowed).

**Canva-inspired batch (researched Canva's editor; 2026-06-13):**
- [x] **Subject pop FX** — drop shadow (color/offset/direction/blur/opacity),
  outline/stroke (color/thickness), and colored glow on the cutout. CSS
  drop-shadow stacks (`thumbnail-fx.ts` → `subjectImageFilter`),
  `ThumbnailSubjectFxPanel`. Default reproduces the old soft shadow.
- [x] **Photo adjustments + bg darken/blur** — brightness/contrast/saturation/
  blur on subject & background (`adjustToFilter`), plus a background **darken
  scrim** and one-click "Darken & blur (for text)". `ThumbnailControls`,
  `ThumbnailBackgroundFxPanel`.
- [x] **Headline text effects + fonts** — curated **font picker** (8 display
  fonts self-hosted via `next/font/google` in `thumbnail-fonts.ts`, applied as
  CSS vars on the captured node + `document.fonts.ready` before export),
  **gradient fill**, and a **highlight box** (color/roundness/opacity, Canva's
  "Background" effect). `ThumbnailHeadlineFxPanel`, `headlineStyle`. (Curved text
  deferred — SVG-textPath export complexity.)
- [x] **Editor UX** — drag **snapping** to center/thirds/edges with on-canvas
  guides (`useStageDrag`, Ctrl bypasses), **arrow-key nudge** of the selected
  layer, an **Arrange/align** panel, **sticker z-order** (send back / bring
  forward), the **headline is now selectable** (sentinel id), and a **small-size
  preview** modal (168/320/360 px — a gap Canva doesn't fill).
  `ThumbnailArrangePanel`, `ThumbnailPreviewModal`.

**Next up (not yet built):**
- [ ] Persist large saves reliably (upload bg/subject to Blob at save time and
  store hosted URLs in the config snapshot, so 4K-background thumbnails always
  save).
- [ ] **Bigger AI lifts** (Canva "Magic"): Magic Expand / outpaint to 16:9,
  Magic Eraser (object removal), Magic Edit (generative replace), enhance the
  source photo — all new Gemini image-edit routes.
- [ ] **Duotone**, blend modes, and **Styles + Shuffle** (one-click palette/font
  restyle → instant A/B variants).
- [ ] Cross-type **layer reordering** (subject vs headline z-order); frames
  (shape-masked subject crop).
- [ ] Brand-color **lock** across a series; "thumbnail pack" (3 variants at once);
  reference-thumbnail **analysis** (`/api/analyze-image`).

**Verify next session (couldn't browser-test here):** custom-font **export**
embedding (next/font self-hosted should inline cleanly in html-to-image), and the
subject outline/glow look at various sizes.

