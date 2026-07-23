# Movie / TV / Series Logo Fonts

A curated reference library of **108 design-rich movie & TV title logos** (53 films, 55 TV shows) for Conjure Studio — the fancy, ornate, custom-lettered, emblem-driven title treatments worth recreating.

> Folder name uses hyphens (`Movie-TV-Series`) because Windows folder names can't contain `/`.

## Contents

| File | What it is |
|------|------------|
| `great-title-logos-gallery.html` | Browsable gallery. Open in any browser. Filter by Movies/TV and by design approach, search, preview each title in its base font, and click **View reference** to see the real logo. |
| `great-title-logos.json` | The canonical data (108 entries + metadata). Regenerate this, then re-derive the TS module below. |
| `logos/` | Local PNG copies of the reference artwork, for the offline gallery only. **Gitignored** (13MB of third-party studio logos) — the app never reads these. |

The app imports the typed module at **`lib/logo-templates/great-title-logos.ts`** — `TITLE_LOGOS`, `LOGO_DESIGN_APPROACHES`, `LOGO_BASE_FONTS`, and the `getLogosByType` / `getLogosByApproach` / `findLogo` helpers. That file is the single source of truth for anything under `app/`; it resolves artwork through the TMDB CDN (`logoUrl`), not through `logos/`.

## Each logo entry has

- **signatureElement** — the one thing that makes it iconic (e.g. Harry Potter's lightning-bolt P, The Sopranos' revolver-R, Breaking Bad's periodic-table tiles).
- **designBreakdown** — a full recreation brief: letterforms, colour/finish, effects, emblem, composition.
- **designApproach** — one of 9 design families (Ornate/Fantasy Serif, Decorative & Ornamental, Art Deco/Period, Custom Script, Sci-Fi/Tech, Horror/Distressed, Emblem/Motif, Metallic/3D Effect, Hand-Drawn/Cartoon).
- **fontStartingPoint** — a real Google Font to use as a **base** to build on (then add the ornament, finish, emblem or effect from the breakdown). Loadable via `lib/font-loader.ts`.
- **traits** — defining visual descriptors.
- **promptSnippet** — a ready-to-use regeneration prompt.
- **referenceUrl** — an image-search link to view the real title treatment.

## Notes

- These are chosen for distinctive **logo design**, not font. The real title cards are mostly bespoke lettering; `fontStartingPoint` is a starting base, not a claim of an exact match.
- The actual studio logos are copyrighted, so references are links (not hosted images).

_Generated 2026-07-23._
