# Conjure Studio - Project Notes

Part of Phil's AI OS — registry slug: `conjure-studio` (project id 21).
Work state (tasks, findings, decisions) → the ai-os Neon DB tagged to that project;
durable learnings → this file or the OS vault.

## 🚀 Deployment Workflow

### Branches
- **`master`** - Production branch (Vercel deploys from here)
- **`Main-GeniePrompts`** - Backup/sync branch

### To Deploy to Production
```bash
git add .
git commit -m "your commit message"
git push origin master:master
```

### Required Vercel Environment Variables
These MUST be set in Vercel → Settings → Environment Variables (for ALL environments: Production, Preview, Development). The full annotated list lives in `.env.example`.

| Variable | Description |
|----------|-------------|
| `NEON_DATABASE_URL` | Neon PostgreSQL connection string |
| `DATABASE_URL` | Same value — legacy alias used by image-analysis routes |
| `OPENAI_API_KEY` | Primary OpenAI key (ChatGPT Images, AI helper, image analysis, prompt enhancement, logos, recolor) |
| `GOOGLE_AI_API_KEY` | Optional Gemini key for fallback/model picker paths |
| `PHOTOROOM_API_KEY` | PhotoRoom API key for default professional logo PNG background removal |
| `FAL_KEY` | fal.ai key — REQUIRED for video generation (Seedance/Kling/Veo) and the BG Remover's default BiRefNet method (falls back to PhotoRoom without it) |
| `REPLICATE_API_TOKEN` | Replicate API key (upscaling fallbacks) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token (auto-provisioned on Vercel) |
| `ADMIN_API_KEY` | Optional — gates `/api/logo-history/debug` (account merge); endpoint stays closed when unset |
| `BETTER_AUTH_SECRET` | Auth signing secret (required for accounts/sign-in) |
| `STRIPE_SECRET_KEY` | Stripe secret key (required to sell credits) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the `/api/stripe/webhook` endpoint |
| `SAAS_ENFORCEMENT` | `off` (default) = free/anonymous as before; `on` = generation requires sign-in + credits |
| `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` | Optional — enables the Google sign-in button |

### SaaS layer (Phase 3)
- **Auth**: Better Auth on Neon (`lib/auth.ts`, tables in `scripts/008_better_auth_tables.sql`). Sign-in page at `/sign-in`; account menu in the studio top bar.
- **Credits**: `profiles` + append-only `credit_ledger` (`scripts/010_credits.sql`); ops in `lib/credits/`; costs in `lib/credits/cost-map.ts`; signup grant 30.
- **Billing**: Stripe Checkout credit packs (`lib/billing/packs.ts` — edit prices there); idempotent webhook grants on `checkout.session.completed`; buy page at `/credits`.
- **Gating**: `withCreditGuard` (`lib/api/guard.ts`) wraps the 7 generation/transform routes — reserve → refund on failure. Controlled by `SAAS_ENFORCEMENT` (default off = legacy behavior).
- **Legacy data**: signed-in users claim their anonymous device data via the account menu (`/api/account/claim`, single-claim per legacy id).
- **Migrations**: apply with `node scripts/run-sql.cjs scripts/<file>.sql` (reads `.env.local`). 008/009/010 are applied to the production Neon DB.

### Deployment Checklist
1. ✅ Test locally with `npm run build`
2. ✅ Commit changes to `master`
3. ✅ Push to `origin master:master`
4. ✅ Check Vercel dashboard for successful build
5. ✅ Hard refresh (Ctrl+Shift+R) to see changes

---

## 🎬 Video Generation (fal.ai queue)

- **Models**: config-driven registry in `lib/video/providers.ts` — Seedance Fast (draft), Seedance 2.0, Kling 3.0 Pro, Veo 3.1. Adding a model = new registry entry (endpoint resolver + input builder + capability flags).
- **Flow**: `POST /api/generate-video` submits to the fal queue (credit-guarded via `videoFormCost`), inserts a `pending` row in `video_history` (migration `scripts/011_video_history.sql`); the client polls `GET /api/generate-video/status` every 5s. On completion the MP4 is copied to Vercel Blob (falls back to the fal URL if no `BLOB_READ_WRITE_TOKEN`); on failure the debit is refunded idempotently (job-scoped key).
- **Costs**: `VIDEO_CREDITS_PER_SECOND` in `lib/credits/cost-map.ts` (audio + 4K multipliers).
- **UI**: Video studio mode (`components/Video/` — VideoCanvas stays mounted-hidden so polling survives mode switches). Images feed video via the **Animate** button (sets start frame) and **End Frame** button (sets that image as the end frame) on `GeneratedImageCard`; the video panel's empty end slot offers "Generate from start frame" (replicate-mode reference) when only a start is set.
- **Image batching**: the image API caps `count` at 4 per request; `useImageGeneration` splits bigger batches (up to 10) into parallel chunked requests that land in the grid progressively.

---

## 💻 Coding Preferences

### General Style
- Use TypeScript strict mode - no `any` types
- Prefer `const` over `let`, never use `var`
- Use arrow functions for components and callbacks
- Destructure props and state
- Use early returns to reduce nesting

### React Patterns
- Functional components only (no class components)
- Custom hooks for reusable logic (`use` prefix)
- Keep components focused - one responsibility each
- Colocate state with the component that uses it
- Use `useMemo` and `useCallback` for expensive operations

### Import Order
1. React imports
2. Third-party libraries
3. UI components (`@/components/ui/*`)
4. Local components
5. Hooks
6. Constants/types
7. Utilities

### Comments
- Only add comments for complex logic ("why" not "what")
- Use JSDoc for exported functions/components
- No commented-out code - delete it

---

## 🧪 Testing Requirements

### Before Marking Feature Complete
1. **Happy path** - Does it work with normal input?
2. **Edge cases** - Empty state, null values, long text
3. **State updates** - Does UI reflect changes immediately?
4. **Persistence** - Refresh page, is data restored?
5. **Error handling** - What happens when API fails?

### When to Test
- After implementing any new feature
- After fixing a bug (verify fix works)
- After refactoring (verify nothing broke)
- Before deploying to production

### Local Testing Commands
```bash
npm run dev      # Development server
npm run build    # Production build (catches type errors)
```

---

## ✅ CI & Contract Checks

### What CI runs
`.github/workflows/ci.yml` → the **`verify`** job, in order:
`npm run lint` → `npx tsc --noEmit` → each named contract check → `npm run build`.
A separate `e2e` workflow runs Playwright. All must pass before merge.

### Contract checks
Behavior we don't want silently regressed is pinned by a plain Node script in
`scripts/check-*.cjs`, each with an npm alias:

| Alias | Pins |
|-------|------|
| `check:logo` | Logo generator contract |
| `check:ai-helper-ui` / `check:ai-helper-scenarios` | AI helper UI + behavior (protected surface) |
| `check:image-references` | Subject/Reference upload copy |
| `check:gemini-identity` | Gemini inspire-mode identity preservation |
| `check:prompt-merge` | Typed prompt + reference-analysis merging |

**Adding a check requires three edits** — the script, the `package.json` alias, and a step in
`ci.yml`. Miss the third and it never runs in CI.

> ⚠️ Adding a `ci.yml` step makes the PR unmergeable via `gh pr merge` (the CLI token lacks the
> `workflow` OAuth scope). Merge that PR in the GitHub web UI instead.

### Write checks that can actually fail
Most older check scripts only regex the source. **That is not sufficient for new checks** — a
regex-only contract keeps passing after the runtime behavior regresses, because dead code or a
leftover matching string still satisfies it. (This was raised in code review on PR #21.)

For a **pure** function, execute it. See `scripts/check-prompt-merge.cjs` as the reference:

- Transpile with the repo's own `typescript` devDep (`ts.transpileModule`) — no new dependencies.
- Evaluate via `new Function('exports','require','module', …)` with a stubbed `require`. Safe when
  the target function doesn't touch the module's other imports; say so in a comment.
- Assert real input→output cases and print `expected:` / `received:` on failure.
- **Mutation-test the check itself** before trusting it: break the implementation and confirm the
  check fails; then restore the matching text as dead code and confirm it *still* fails.
- Fall back to source-level assertions only where execution is genuinely impossible (e.g. call
  sites inside React components) — anchor those to the specific rendered element, not the whole
  file, and note the limitation rather than implying full coverage.

### Local lint noise — don't chase it
`eslint .` may report ~1500 `Parsing error: No tsconfigRootDir was set …`. That comes from a second
`tsconfig.json` inside `.claude/worktrees/**`; CI checks out clean and never sees it. To lint
honestly, target files directly:
```bash
npx eslint --no-warn-ignored path/to/file.tsx
```

---

## 📝 Naming Conventions

### Files & Folders
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `LogoPanel.tsx`, `ImageStudioHeader.tsx` |
| Hooks | camelCase with `use` | `useLogoGeneration.ts`, `useImageStudio.ts` |
| Constants | kebab-case | `logo-constants.ts`, `ai-logo-knowledge.ts` |
| Utilities | kebab-case | `image-utils.ts`, `format-helpers.ts` |
| Types | kebab-case or with component | `types.ts`, `LogoPanel.types.ts` |

### Variables & Functions
| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `selectedImage`, `isLoading` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `DEFAULT_COLORS` |
| Functions | camelCase | `handleSubmit`, `formatDate` |
| Event handlers | `handle` prefix | `handleClick`, `handleChange` |
| Booleans | `is`/`has`/`should` prefix | `isOpen`, `hasError`, `shouldRender` |

### Components
| Type | Convention | Example |
|------|------------|---------|
| Props interface | `ComponentNameProps` | `LogoPanelProps`, `ButtonProps` |
| State interface | `ComponentNameState` | `FormState`, `ModalState` |
| Context | `ComponentNameContext` | `ThemeContext`, `AuthContext` |

---

## Mockup Photo Generator



&nbsp; ### Location

&nbsp; - API: `app/api/generate-mockup-photos/route.ts`

&nbsp; - UI: `app/image-studio/components/Logo/MockupPreview/MockupPhotoGenerator.tsx`



&nbsp; ### Structure

&nbsp; - \*\*Clothing\*\* (5 items × 18 colors × 3 views = 270 photos)

&nbsp;   - tshirt, longsleeve, tanktop, hoodie, ziphoodie

&nbsp;   - Views: front, back, side



&nbsp; - \*\*Hats\*\* (2 items × 18 colors = 36 photos)

&nbsp;   - hat (baseball cap), beanie



&nbsp; - \*\*Other Products\*\* (various colors)

&nbsp;   - Mugs, tumblers, tote bags, pillows, phone cases, etc.



&nbsp; ### 18 Color Palette

&nbsp; black, white, charcoal, gray, heather, navy, royal, sky, red, burgundy, coral, forest, olive, teal, purple, pink, orange, yellow



&nbsp; ### UI Features

&nbsp; - All categories use collapsible dropdowns

&nbsp; - Color swatches show actual colors on buttons

&nbsp; - "Generate All" processes everything with 1-second delays



&nbsp; ### To Add New Products

&nbsp; 1. Add prompts to `PRODUCT\_PROMPTS` in the API route

&nbsp; 2. Add to `CLOTHING\_WITH\_VIEWS`, `HATS\_CATEGORY`, or `OTHER\_PRODUCTS` in the UI

&nbsp; 3. Add hex color to `COLOR\_HEX\_MAP` if using new colors


## Conventions check (mandatory)

After ANY code change, run `npm run check:conventions` and fix failures before
reporting done. CI enforces the same check on every push; catching it locally is
cheaper than a red X. Existing violations are grandfathered in
`scripts/conventions-baseline.json` — never update the baseline to silence a
NEW violation; fix the code instead.
