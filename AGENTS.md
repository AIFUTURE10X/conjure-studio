# v0 Prompts Genie - Project Notes

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
These MUST be set in Vercel → Settings → Environment Variables (for ALL environments: Production, Preview, Development):

| Variable | Description |
|----------|-------------|
| `NEON_DATABASE_URL` | Neon PostgreSQL connection string |
| `PHOTOROOM_API_KEY` | PhotoRoom API key for default professional logo PNG background removal |
| `REPLICATE_API_TOKEN` | Replicate API key |
| `GOOGLE_AI_API_KEY` | Google Gemini API key |

### Deployment Checklist
1. ✅ Test locally with `npm run build`
2. ✅ Commit changes to `master`
3. ✅ Push to `origin master:master`
4. ✅ Check Vercel dashboard for successful build
5. ✅ Hard refresh (Ctrl+Shift+R) to see changes

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

---

## Cursor Cloud specific instructions

This is a single Next.js 16 (App Router, Turbopack) app at the repo root — no monorepo, no Docker, no test runner (Jest/Vitest). Node 22 + npm are preinstalled; the package manager is **npm** (`package-lock.json`). Dependencies are installed automatically by the startup update script (`npm install`).

### Services
- Only one service: the Next.js dev server (`npm run dev`, http://localhost:3000). Standard commands live in `package.json` (`dev`, `build`, `start`, `lint`, and the `check:*` contract scripts).

### Running without secrets (important)
- No API keys/DB are configured in the cloud VM by default. The app still runs because `SAAS_ENFORCEMENT` defaults to `off` (anonymous, uncharged). All pages (`/`, `/image-studio`, `/sign-in`, `/credits`) render and return 200.
- Create a `.env.local` (gitignored) for a clean dev run. A generated `BETTER_AUTH_SECRET` silences a noisy Better Auth error; without it, build/dev still succeed but log `You are using the default secret`. Generate one with: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.
- What works WITHOUT external keys (client-side): style/parameter selection, the Logo Wizard, and the **Mockup configurator** (color/text/size edits + PNG/SVG/PDF export). A good no-key smoke test is exporting a customized mockup from the Mockups tab.
- What REQUIRES secrets: actual AI image/prompt generation and the AI Helper need `GOOGLE_AI_API_KEY` (or `GEMINI_API_KEY`) and/or `OPENAI_API_KEY`. DB-backed history/favorites/auth/credits need `NEON_DATABASE_URL` (+ `DATABASE_URL` alias); apply migrations with `node scripts/run-sql.cjs scripts/<file>.sql` or `node run-migrations.js`. Stripe billing only matters when `SAAS_ENFORCEMENT=on`. See `.env.example` for the full annotated list.

### Notes
- `npm run lint` reports many `no-explicit-any` warnings but **0 errors** — that is the expected baseline.
- `next.config.mjs` lists native `serverExternalPackages` (`sharp`, `onnxruntime-node`, `@neplex/vectorizer`); `npm install` builds these. If background-removal/vectorize routes throw native errors, rerun `npm install`.
