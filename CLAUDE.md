# Conjure Studio - Project Notes

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

