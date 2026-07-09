# Export Fix Reference - DO NOT MODIFY

This document describes critical fixes for logo export functionality. These patterns MUST be preserved.

---

## Problem Summary

When `generatedLogo.url` is a **Vercel Blob URL** (e.g., `https://xxx.blob.vercel-storage.com/...`) instead of a **data URL** (e.g., `data:image/png;base64,...`), exports fail because:

1. **PNG Download**: Browser navigates to URL instead of downloading
2. **SVG/Upscale**: API receives URL string instead of base64, fails to decode
3. **PDF**: Was drawing checkerboard pattern (removed per user request)

---

## Root Cause

After background removal, images are uploaded to Vercel Blob and `generatedLogo.url` contains a remote URL. Code that assumed data URLs broke when receiving remote URLs.

---

## Solution Patterns

### Pattern 1: PNG Download (Fetch + Blob)

**Files:**
- `app/image-studio/hooks/useLogoGeneration.ts`
- `app/image-studio/components/Logo/LogoLightbox.tsx`

```typescript
const downloadLogo = async (logo: GeneratedLogo) => {
  try {
    // Fetch the image and create a blob for proper download
    // This fixes issues with Vercel Blob URLs opening in tab instead of downloading
    const response = await fetch(logo.url)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = blobUrl
    const sanitizedPrompt = logo.prompt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 30)
    link.download = `logo-${sanitizedPrompt}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
  } catch (err) {
    console.error('[Logo] Download failed:', err)
  }
}
```

### Pattern 2: Convert URL to Base64 Before API Call

**File:** `app/image-studio/hooks/useLogoPanelHandlers.ts`

Used by: `handleExportSvg`, `handleUpscale`

```typescript
// Fetch the image and convert to base64 for the API
// This fixes issues when generatedLogo.url is a Vercel Blob URL instead of data URL
const imageResponse = await fetch(generatedLogo.url)
const imageBlob = await imageResponse.blob()
const imageBase64 = await new Promise<string>((resolve) => {
  const reader = new FileReader()
  reader.onloadend = () => resolve(reader.result as string)
  reader.readAsDataURL(imageBlob)
})

const formData = new FormData()
formData.append('imageBase64', imageBase64)
// ... rest of API call
```

### Pattern 3: PDF Export (No Checkerboard)

**File:** `app/image-studio/hooks/useLogoPanelHandlers.ts`

```typescript
const handleExportPdf = useCallback(async () => {
  // ... setup code ...

  const x = (pdfWidth - imgWidth) / 2
  const y = (pdfHeight - imgHeight) / 2

  // Draw the logo on the PDF (transparent areas will show PDF's default white background)
  pdf.addImage(img, 'PNG', x, y, imgWidth, imgHeight)

  // ... save code ...

  toast.success('PDF exported successfully!')
}, [generatedLogo])
```

---

## Files Modified

| File | Function | Change |
|------|----------|--------|
| `useLogoGeneration.ts` | `downloadLogo` | Fetch + blob download |
| `LogoLightbox.tsx` | `handleDownload` | Fetch + blob download |
| `useLogoPanelHandlers.ts` | `handleUpscale` | Convert URL to base64 |
| `useLogoPanelHandlers.ts` | `handleExportSvg` | Convert URL to base64 |
| `useLogoPanelHandlers.ts` | `handleExportPdf` | Removed checkerboard |

---

## Key Insight

`generatedLogo.url` can be either:
- **Data URL**: `data:image/png;base64,...` (works directly with APIs)
- **Vercel Blob URL**: `https://xxx.blob.vercel-storage.com/...` (must fetch first)

The fix patterns above handle BOTH cases correctly.

---

## Testing Checklist

- [ ] Generate a logo
- [ ] Click "BG" button to remove background (creates Vercel Blob URL)
- [ ] Export PNG - downloads as file, not opens in tab
- [ ] Export SVG - downloads without error
- [ ] Export PDF - shows logo on white background
- [ ] Upscale - works without error

---

## Date Fixed: December 2024

