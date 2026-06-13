# E2E tests (Playwright)

Headless-browser smoke tests that actually drive the **Thumbnail generator** in
the Image Studio — the layer the build/type-check can't reach (mode routing,
the AI | Manual tabs, live canvas edits, the AI flows, and PNG export).

## What they cover

`e2e/thumbnail.spec.ts`:

1. Thumbnail mode renders the 1280×720 stage + default headline.
2. **Manual** — typing a headline updates the canvas live.
3. **Manual** — selecting a template marks it active.
4. **Manual** — a solid background reveals a colour picker.
5. **AI** — title → 3 concepts renders cards, and applying one sets the
   headline + builds the background.
6. **AI** — "Generate background" adds an image layer.
7. **Manual** — "Export PNG" downloads `youtube-thumbnail.png`.

The AI endpoints (`/api/generate-thumbnail-concepts`, `/api/generate-image`)
are **mocked** with `page.route`, so the suite is deterministic and needs **no
API keys**. It verifies wiring and client-side behaviour, not real model
output. To exercise the live AI/upscale/recolor/edit paths end-to-end, use a
Vercel preview deploy with the real environment variables.

## Run locally

```bash
npm run test:e2e:install   # one-time: download the Chromium browser
npm run test:e2e           # run headless (boots `next dev` automatically)
npm run test:e2e:ui        # interactive UI mode for debugging
```

The config starts the dev server for you (`webServer` in
`playwright.config.ts`) and reuses one that's already running. On the studio
page's first compile, Next fetches the self-hosted display fonts from Google
Fonts, so the machine running the tests needs **outbound network** (CI and
normal local dev have it; a locked-down sandbox does not).

## CI

`.github/workflows/e2e.yml` runs the suite on pushes/PRs that touch the studio,
the tests, or the deps. No secrets required.

## Adding tests

Prefer accessible selectors (`getByRole`, `getByPlaceholder`, `getByLabel`).
Two stable hooks exist for the canvas: `data-testid="thumbnail-stage"` (the
captured 1280×720 node) and `data-testid="thumbnail-headline"` (the editable
headline layer). Mock any route that hits an external model so tests stay
deterministic and key-free.
