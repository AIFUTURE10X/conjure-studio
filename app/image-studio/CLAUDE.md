# Image Studio Development Guidelines

## 🚨 300 LINE LIMIT RULE 🚨

**RULE: No component, hook, or utility file should exceed 300 lines of code.**

### When Creating New Features:
1. **Plan the structure first** - Identify sub-components before writing
2. **One component = one responsibility** - If it does multiple things, split it
3. **Extract early** - Don't wait until files grow too large
4. **Constants/data → `constants/` folder** - Arrays, configs, options
5. **Complex logic → custom hooks in `hooks/` folder**

### Folder Structure Pattern:
```
components/
  FeatureName/
    FeatureName.tsx      # Main component (<300 lines)
    SubComponentA.tsx    # Child component (<300 lines)
    SubComponentB.tsx    # Child component (<300 lines)
    index.ts             # Barrel exports

constants/
  feature-options.ts     # Static data/configs

hooks/
  useFeatureName.ts      # Feature-specific logic
```

### Warning Signs (Time to Split):
- File approaches 250+ lines
- Multiple useState/useEffect blocks doing different things
- Large JSX sections that could be named components
- Inline constant arrays with 10+ items
- Copy-pasting similar UI patterns

### This Rule Applies To:
- ✅ React components (.tsx)
- ✅ Custom hooks (.ts)
- ✅ Utility files (.ts)
- ⚠️ Constants/config files (can exceed if pure data only)
- ⚠️ Type definition files (can exceed if needed)

---

## AI Helper Integration

When adding new settings to DotMatrixConfigurator:
1. Add the setting to `constants/dot-matrix-config.ts` (types + options)
2. Add UI in DotMatrixConfigurator
3. **Update `constants/ai-logo-knowledge.ts`** with new option + description
4. The API automatically includes it in the AI system prompt
5. AI can now suggest the new setting!

---

## Component Locations

- **GeneratePanel/** - Image generation controls and display
- **Logo/** - Logo generation with DotMatrixConfigurator
- **AIHelper/** - AI sidebar for prompts and logo suggestions
- **Toolbar/** - Image studio toolbar controls
- **Favorites/** - Favorite images management

---

## UI/UX Best Practices

### Visual Design
- **Dark Theme First** - All components use dark backgrounds (zinc-900, zinc-800)
- **Gold Accent Color** - Primary brand color `#dbb56e` / `#c99850` for highlights
- **Purple/Pink Gradients** - Active states use `from-purple-500 to-pink-500`
- **Consistent Spacing** - Use Tailwind spacing: `gap-2`, `p-4`, `mb-3`, etc.
- **Border Radius** - Use `rounded-lg` for cards, `rounded-md` for buttons

### Interactive Elements
- **Tooltips Required** - All icon-only buttons MUST have tooltips
- **Hover States** - Always provide visual feedback: `hover:text-white`, `hover:bg-zinc-800`
- **Disabled States** - Use `disabled:opacity-50` and `disabled:cursor-not-allowed`
- **Loading States** - Show spinners with `<Loader2 className="animate-spin" />` and disable buttons

### Component Patterns
- **Use shadcn/ui** - Import from `@/components/ui/*` (Button, Card, Tooltip, etc.)
- **Lucide Icons** - Use `lucide-react` for all icons, size `w-4 h-4` standard
- **Tooltip Template**:
  ```tsx
  import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

  <Tooltip>
    <TooltipTrigger asChild>
      <button>...</button>
    </TooltipTrigger>
    <TooltipContent side="bottom">
      Descriptive tooltip text
    </TooltipContent>
  </Tooltip>
  ```

### Layout Principles
- **Flex with Gap** - Prefer `flex gap-2` over margin/padding between items
- **Responsive Design** - Use `flex-wrap` and responsive classes when needed
- **Content Hierarchy** - Headers get larger text, labels get `text-xs text-zinc-400`

---

## Code Implementation Best Practices

### TypeScript
- **Strict Types** - Define interfaces for all props and state
- **No `any`** - Use proper types or `unknown` when truly unknown
- **Export Types** - Export interfaces from component files for reuse

### State Management
- **Colocate State** - Keep state close to where it's used
- **Lift Sparingly** - Only lift state when siblings need it
- **Custom Hooks** - Extract complex state logic to `hooks/` folder

### Performance
- **Memoization** - Use `useMemo` for expensive computations
- **Callback Stability** - Use `useCallback` for handlers passed to children
- **Lazy Loading** - Use dynamic imports for large modals/components

### Error Handling
- **Graceful Degradation** - Show user-friendly error messages
- **Try/Catch** - Wrap async operations with proper error handling
- **Loading States** - Always indicate when operations are in progress

### Naming Conventions
- **Components** - PascalCase: `LogoPanel.tsx`, `DotMatrixConfigurator.tsx`
- **Hooks** - camelCase with `use` prefix: `useLogoGeneration.ts`
- **Constants** - kebab-case files: `logo-constants.ts`, UPPER_SNAKE for values
- **Event Handlers** - `handle` prefix: `handleGenerate`, `handleClearAll`
- **Boolean Props** - `is`/`has` prefix: `isLoading`, `hasError`, `isOpen`

### File Organization
```
// Import order:
1. React imports
2. Third-party libraries
3. UI components (@/components/ui/*)
4. Local components
5. Hooks
6. Constants/types
7. Utilities
```

### Git Commits
- **Small Commits** - One logical change per commit
- **Descriptive Messages** - Explain what and why, not just how

---

## Anthropic Skills Reference

*Based on [github.com/anthropics/skills](https://github.com/anthropics/skills)*

### What Are Skills?
Skills are dynamically loaded instruction folders that enhance Claude's capabilities for specialized tasks. They enable consistent workflows for domain-specific applications.

### Skill Categories
- **Creative & Design** - Art, music, design applications
- **Development & Technical** - Web app testing, MCP server generation
- **Enterprise & Communication** - Business communications, branding
- **Document Skills** - DOCX, PDF, PPTX, XLSX manipulation

### Frontend Design Principles

**Design Philosophy:**
- Commit to a **bold, intentional aesthetic direction** before writing code
- Create distinctive, production-grade interfaces that avoid generic AI aesthetics
- "Bold maximalism and refined minimalism both work - the key is intentionality"

**Typography:**
- Use distinctive, characterful fonts—never defaults (Arial, Inter, Roboto)
- Pair display fonts with refined body fonts for impact

**Color & Theme:**
- Commit to cohesive palettes using CSS variables
- "Dominant colors with sharp accents outperform timid, evenly-distributed palettes"
- Avoid clichéd palettes (generic purple gradients)

**Motion & Animation:**
- Prioritize CSS-only animations
- Use high-impact moments (staggered page-load reveals) over scattered micro-interactions

**Spatial Composition:**
- Employ asymmetry, overlap, diagonal flow, and grid-breaking elements
- Predictable layouts are to be avoided

**Visual Details:**
- Add atmosphere through gradients, textures, patterns, shadows, custom cursors, grain overlays

### Canvas Design Standards

**Core Philosophy:**
- Create visual philosophies expressed through design, not layout templates
- Work should be 90% visual, 10% essential text
- Treat output as museum/magazine-quality art

**Execution:**
- Use limited, intentional color palettes
- Employ systematic visual language (repeated patterns, layered elements)
- Typography must be design-forward, typically thin fonts
- **Critical rule**: "Nothing falls off the page and nothing overlaps"

**Refinement:**
- Rather than adding elements, refine existing composition for cohesion
- Ask: "How can I make what's already here more of a piece of art?"

### Web App Testing Guidelines

**Server Management:**
- Check if app is static HTML (read directly) or dynamic (requires server)
- Use helper scripts for server management rather than manual startup

**Timing & Load States:**
- Wait for `page.wait_for_load_state('networkidle')` before DOM inspection
- Never inspect DOM before JavaScript finishes loading on dynamic apps

**Reconnaissance Pattern:**
1. Inspect rendered DOM (screenshots/content)
2. Identify selectors from results
3. Execute actions

**Implementation:**
- Launch Chromium in headless mode
- Use descriptive selectors (text=, role=, CSS, or IDs)
- Apply appropriate waits: `wait_for_selector()` or `wait_for_timeout()`
- Always close browsers when finished

### Skill Structure Pattern
```
skill-folder/
  SKILL.md           # Instructions with YAML frontmatter
  resources/         # Supporting files (optional)
```

**SKILL.md Format:**
```yaml
---
name: skill-name
description: Clear explanation of purpose and use cases
---

# Instructions
[Detailed guidelines and examples]
```

---

## Canvas Export Pattern (Reliable Image Export)

**Problem:** Libraries like `html2canvas` fail with modern CSS (Tailwind 4's oklch/oklab colors, CORS issues, DOM cloning complexity). Images often don't appear in exports.

**Solution:** Use manual Canvas API drawing instead of DOM capture libraries.

### Why This Works
- **No DOM parsing** - Draw directly to canvas, bypassing all html2canvas issues
- **Proper image loading** - `preloadImage()` waits for `onload`, guaranteeing image is ready
- **No CORS issues** - Set `crossOrigin` BEFORE `src`
- **No color parsing errors** - Use hex colors directly, no CSS parsing

### Image Preload Utility (CRITICAL)
```typescript
// ALWAYS use this pattern - never draw images without waiting for onload
function preloadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'  // Set BEFORE src for CORS
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image failed to load'))
    img.src = url
  })
}
```

### Canvas Export Template
```typescript
const captureCanvas = async (): Promise<HTMLCanvasElement | null> => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // HiDPI support (2x scale for sharp exports)
  const width = 400
  const height = 480
  const scale = 2
  canvas.width = width * scale
  canvas.height = height * scale
  ctx.scale(scale, scale)

  // 1. Draw background
  ctx.fillStyle = '#18181b'
  ctx.fillRect(0, 0, width, height)

  // 2. Draw shapes (SVG paths as canvas paths)
  ctx.beginPath()
  ctx.moveTo(70, 120)
  // ... path commands
  ctx.closePath()
  ctx.fillStyle = '#3b82f6'
  ctx.fill()

  // 3. Draw images (ALWAYS await preload)
  const img = await preloadImage(imageUrl)
  ctx.drawImage(img, x, y, width, height)

  // 4. Draw text
  ctx.font = '16px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.fillText('Brand Name', 200, 400)

  return canvas
}
```

### Export Handlers
```typescript
// PNG Export
const handleExportPNG = async () => {
  const canvas = await captureCanvas()
  if (!canvas) return

  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'export.png'
    link.click()
    URL.revokeObjectURL(url)
  }, 'image/png', 0.95)
}

// SVG Export (PNG embedded in SVG wrapper)
const handleExportSVG = async () => {
  const canvas = await captureCanvas()
  if (!canvas) return

  const dataUrl = canvas.toDataURL('image/png')
  const svg = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${canvas.width}" height="${canvas.height}">
  <image xlink:href="${dataUrl}" width="${canvas.width}" height="${canvas.height}"/>
</svg>`

  const blob = new Blob([svg], { type: 'image/svg+xml' })
  // ... download logic
}

// PDF Export (using jsPDF)
import jsPDF from 'jspdf'

const handleExportPDF = async () => {
  const canvas = await captureCanvas()
  if (!canvas) return

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const imgWidth = pdfWidth - 20
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
  pdf.save('export.pdf')
}
```

### Common Mistakes to Avoid
```typescript
// WRONG - Image may not be loaded yet
const img = new Image()
img.src = url
ctx.drawImage(img, 0, 0)  // Image not loaded!

// WRONG - crossOrigin set after src
const img = new Image()
img.src = url  // Too late!
img.crossOrigin = 'anonymous'

// CORRECT - Always await preload
const img = await preloadImage(url)
ctx.drawImage(img, 0, 0)  // Safe!
```

### When to Use This Pattern
- Simple exports with known dimensions
- When you need pixel-perfect control over rendering
- Static content without complex CSS transforms

---

## WYSIWYG Mockup Export Pattern (html-to-image)

**Problem:** Manual Canvas API drawing can never perfectly match CSS rendering. Position/size calculations for logos, text, and transforms become a nightmare of mismatches between preview and export.

**Solution:** Use `html-to-image` library to capture the actual rendered DOM - true WYSIWYG (What You See Is What You Get).

### Why This Works
- **True WYSIWYG** - Export exactly matches the preview because we capture the actual DOM
- **No calculation mismatches** - CSS transforms, fonts, and effects all captured as rendered
- **Simpler code** - No manual Canvas drawing, just capture and download
- **Handles all CSS** - Transforms, blend modes, filters, custom fonts all work automatically

### Installation
```bash
npm install html-to-image
```

### Implementation Pattern
```typescript
import { toCanvas } from 'html-to-image'

interface UseGenericExportConfig {
  containerRef: RefObject<HTMLDivElement>  // Reference to the DOM element to capture
  // ... other config
}

const captureCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
  try {
    const element = containerRef.current
    if (!element) {
      toast.error('Export failed: Container not found')
      return null
    }

    // Temporarily remove background for transparent export
    element.classList.remove('bg-zinc-900')

    // Capture the DOM exactly as rendered
    const canvas = await toCanvas(element, {
      pixelRatio: 2,           // HiDPI support
      cacheBust: true,         // Prevent caching issues
      backgroundColor: undefined, // Transparent background
      filter: (node) => {
        // Filter out UI elements (rulers, grids, controls)
        if (node instanceof Element) {
          const className = node.className?.toString() || ''
          if (className.includes('z-30') || className.includes('z-5')) {
            return false // Exclude these elements from export
          }
        }
        return true
      },
    })

    // Restore background after capture
    element.classList.add('bg-zinc-900')

    return canvas
  } catch (err) {
    // Restore background on error too
    containerRef.current?.classList.add('bg-zinc-900')
    console.error('Canvas capture failed:', err)
    return null
  }
}, [containerRef])
```

### Key Techniques

#### 1. Transparent Background Export
The DOM element has a background class (`bg-zinc-900`). To export with transparency:
```typescript
// Before capture - remove background
element.classList.remove('bg-zinc-900')

const canvas = await toCanvas(element, { backgroundColor: undefined })

// After capture - restore background
element.classList.add('bg-zinc-900')
```

#### 2. Filtering UI Elements
Use the `filter` option to exclude rulers, grids, and controls:
```typescript
filter: (node) => {
  if (node instanceof Element) {
    const className = node.className?.toString() || ''
    // Exclude elements with z-30 (rulers) or z-5 (grid)
    if (className.includes('z-30') || className.includes('z-5')) {
      return false
    }
  }
  return true
}
```

#### 3. HiDPI/Retina Support
```typescript
pixelRatio: 2  // 2x resolution for sharp exports on retina displays
```

### Export Handlers
```typescript
const handleExportPNG = useCallback(async () => {
  const canvas = await captureCanvas()
  if (!canvas) return

  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'mockup.png'
    link.click()
    URL.revokeObjectURL(url)
  }, 'image/png', 0.95)
}, [captureCanvas])
```

### When to Use This Pattern (vs Manual Canvas)
| Use Case | html-to-image | Manual Canvas |
|----------|---------------|---------------|
| Complex CSS (transforms, blend modes) | ✅ Best | ❌ Hard to replicate |
| Exact preview matching (WYSIWYG) | ✅ Best | ❌ Calculations drift |
| Transparent backgrounds | ✅ Easy | ✅ Easy |
| Simple shapes/text | ✅ Works | ✅ Works |
| Cross-origin images | ⚠️ Needs CORS | ⚠️ Needs CORS |
| Pixel-perfect control | ❌ Limited | ✅ Full control |

### Files Using This Pattern
- `components/Logo/MockupPreview/generic/useGenericExport.ts` - Mockup export hook
- `components/Logo/MockupPreview/generic/GenericMockup.tsx` - Passes containerRef

### Common Issues & Solutions

**Issue:** Background appears in export
**Solution:** Remove background class before capture, restore after

**Issue:** Rulers/grid appear in export
**Solution:** Use filter option to exclude z-30/z-5 elements

**Issue:** Export doesn't match preview size
**Solution:** Ensure containerRef points to the correct element with proper aspectRatio

**Issue:** Fonts not rendering
**Solution:** Ensure fonts are loaded before export (use document font loading API)

---

## Server-Side History Save Pattern (Reliable Database Saves)

**Problem:** Client-side `addToHistory` calls after API responses can fail silently due to:
- React stale closures (callback captures old function reference)
- Browser caching serving old JavaScript
- Race conditions between state updates and function calls
- `useCallback` dependencies not updating properly

**Solution:** Move database saves to the **server-side API** instead of relying on client callbacks.

### Why This Works
- **Server-side is deterministic** - No React lifecycle issues
- **Atomic operations** - API does processing + save in one request
- **No browser caching** - Server always runs latest code
- **Graceful degradation** - Save failure doesn't break the main operation

### Implementation Pattern

#### 1. API Route (Server-Side Save)
```typescript
// /api/remove-background/route.ts
import { neon } from "@neondatabase/serverless"

export async function POST(request: NextRequest) {
  const formData = await request.formData()

  // Get metadata from client
  const userId = formData.get('userId') as string | null
  const prompt = formData.get('prompt') as string | null
  const seed = formData.get('seed') as string | null
  const style = formData.get('style') as string | null

  // ... do the main operation (e.g., background removal) ...

  // Server-side history save (if metadata provided)
  let historyId: number | null = null
  if (userId && prompt) {
    try {
      const sql = neon(process.env.NEON_DATABASE_URL!)
      const config = JSON.stringify({ wasBackgroundRemoval: true })

      const result = await sql`
        INSERT INTO logo_history (user_id, image_url, prompt, seed, style, config, is_favorited)
        VALUES (${userId}, ${imageUrl}, ${prompt}, ${seed ? parseInt(seed) : null}, ${style}, ${config}::jsonb, false)
        RETURNING id
      `
      historyId = result[0]?.id
    } catch (err) {
      console.error("Failed to save to history:", err)
      // Don't fail the request - main operation succeeded
    }
  }

  return NextResponse.json({
    success: true,
    image: imageUrl,
    historyId,  // Client can check if save succeeded
  })
}
```

#### 2. Client-Side (Pass Metadata)
```typescript
// hooks/useLogoPanelHandlers.ts
import { getUserId } from '../components/Logo/LogoHistory/useLogoHistoryData'

const handleRemoveBackground = useCallback(async () => {
  const formData = new FormData()
  formData.append('image', file)

  // Pass metadata for server-side save
  formData.append('userId', getUserId())
  formData.append('prompt', generatedLogo.prompt)
  if (generatedLogo.seed) formData.append('seed', generatedLogo.seed.toString())
  if (generatedLogo.style) formData.append('style', generatedLogo.style)

  const response = await fetch('/api/remove-background', { method: 'POST', body: formData })
  const data = await response.json()

  // History saved server-side, just show feedback
  if (data.historyId) {
    toast.success('Saved to history!')
  }
}, [generatedLogo])
```

### When to Use This Pattern
- Saving to database after image processing (BG removal, upscaling, etc.)
- Any operation where client callback might have stale closure
- Operations that should save atomically with the main action
- When debugging shows client code isn't executing despite API success

### Files Using This Pattern
- `/api/remove-background/route.ts` - Saves RB results to logo_history
- `hooks/useLogoPanelHandlers.ts` - Passes metadata to API
