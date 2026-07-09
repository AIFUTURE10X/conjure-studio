# Gemini API Setup Guide

Reference documentation for Claude Code when working with Gemini integration in this project.

---

## Environment Variables

```env
GEMINI_API_KEY=your_api_key_here      # Required - Get from https://aistudio.google.com/apikey
GEMINI_MAX_ATTEMPTS=3                  # Optional - Retry attempts (default: 3)
GEMINI_RETRY_BASE_DELAY=1500           # Optional - Base delay in ms (default: 1500)
```

---

## Models Reference

### Image Generation Models

| Model ID | Use Case | Resolution | Speed |
|----------|----------|------------|-------|
| `gemini-2.5-flash-preview-image` | Fast generation | 1K only | Fast |
| `gemini-3-pro-image-preview` | Quality generation | 1K, 2K, 4K | Slower |

**Important:** Model IDs include `-preview` suffix. The official docs at https://ai.google.dev/gemini-api/docs/models should be checked if models stop working.

### Text/Analysis Models

| Model ID | Use Case |
|----------|----------|
| `gemini-2.0-flash` | Image analysis, prompt suggestions, text generation |

---

## SDK Packages

This project uses TWO different Gemini SDK packages:

```typescript
// For IMAGE GENERATION (gemini-client.ts)
import { GoogleGenAI } from "@google/genai"

// For TEXT/ANALYSIS (analyze-image, prompt-suggestion routes)
import { GoogleGenerativeAI } from "@google/generative-ai"
```

**Why two packages?** The `@google/genai` package supports image generation with `responseModalities: ["IMAGE"]`, while `@google/generative-ai` is used for text-only operations.

---

## Core Files

### `lib/gemini-client.ts` - Image Generation Client
- Singleton client pattern with `getClient()`
- `generateImageWithRetry()` - Main function for image generation
- Automatic retry with exponential backoff for rate limits
- Supports: aspect ratios, seeds, reference images, resolution

### `lib/gemini-helper.ts` - Legacy Helper
- Alternative implementation (backup)
- Same retry pattern, simpler interface

### API Routes Using Gemini

| Route | Model | Purpose |
|-------|-------|---------|
| `/api/generate-image` | `gemini-2.5-flash-preview-image` or `gemini-3-pro-image-preview` | General image generation |
| `/api/generate-logo` | `gemini-3-pro-image-preview` (default) | Logo generation with BG removal |
| `/api/analyze-image` | `gemini-2.0-flash` | Vision analysis (subject, scene, style, logo) |
| `/api/generate-prompt-suggestion` | `gemini-2.0-flash` | AI prompt assistant |
| `/api/enhance-logo-prompt` | `gemini-2.0-flash` | Logo prompt enhancement |

---

## Image Generation Options

```typescript
interface GenerateOptions {
  prompt: string                    // Required - Text prompt
  aspectRatio?: string              // "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | etc.
  model?: GenerationModel           // Model to use
  imageSize?: "1K" | "2K" | "4K"   // Resolution (Pro model only)
  referenceImage?: string           // Base64 image for img2img
  referenceMode?: "replicate" | "inspire"  // How to use reference
  seed?: number                     // For reproducible generation
  disableSearch?: boolean           // Disable Google Search grounding
}
```

### Reference Modes

| Mode | Behavior |
|------|----------|
| `replicate` | Generate exact copy of reference image |
| `inspire` | Use reference as style/subject guide while applying prompt |

### Resolution Support

| Model | 1K | 2K | 4K |
|-------|----|----|-----|
| `gemini-2.5-flash-preview-image` | Yes | No | No |
| `gemini-3-pro-image-preview` | Yes | Yes | Yes |

---

## Google Search Grounding

Gemini 3 Pro Image supports Google Search grounding for reference-based generation.

```typescript
// Enabled by default for general images
const tools = [{ googleSearch: {} }]

// Disabled for creative/original content (logos, art)
disableSearch: true  // Prevents injecting existing brand references
```

**When to disable:**
- Logo generation (avoid copying existing brands)
- Original artwork
- Creative designs that should be unique

---

## Error Handling

### Automatic Retry Triggers
- `429` - Rate limit exceeded
- `quota` - API quota exhausted
- `rate` - Rate limiting
- `resource exhausted` - Server overloaded

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 404 Model not found | Wrong model ID | Check model ID has `-preview` suffix |
| 401 Unauthorized | Invalid API key | Verify `GEMINI_API_KEY` in env |
| 429 Rate limit | Too many requests | Wait and retry (automatic) |
| Safety blocked | Content filtered | Modify prompt |

---

## Response Structure

```typescript
// Success response from generateImageWithRetry()
{
  success: true,
  imageBase64: string,  // Raw base64 (no data: prefix)
  seed?: number         // Seed used (if provided)
}

// Error response
{
  success: false,
  error: string
}
```

### Extracting Image from API Response

The API returns images in `candidates[0].content.parts[].inlineData.data`. The client handles both camelCase and snake_case variations:

```typescript
// Primary location
response.candidates[0].content.parts[0].inlineData.data

// Alternative (snake_case)
response.candidates[0].content.parts[0].inline_data.data
```

---

## Type Definitions

```typescript
// lib/gemini-client.ts
export type ImageSize = "1K" | "2K" | "4K"
export type GenerationModel = "gemini-2.5-flash-preview-image" | "gemini-3-pro-image-preview"
export type ReferenceMode = "replicate" | "inspire"
```

### Updating Model IDs

When Google updates model names, update these locations:
1. `lib/gemini-client.ts` - Type definition (line ~22)
2. `app/image-studio/components/GeneratePanel/ModelSelector.tsx` - Type & UI
3. `app/api/generate-image/route.ts` - `normalizeModel()` allowed array
4. `app/api/generate-logo/route.ts` - Model selection logic

---

## Usage Examples

### Basic Image Generation

```typescript
import { generateImageWithRetry } from "@/lib/gemini-client"

const result = await generateImageWithRetry({
  prompt: "A sunset over mountains",
  aspectRatio: "16:9",
  model: "gemini-2.5-flash-preview-image"
})

if (result.success) {
  const dataUrl = `data:image/png;base64,${result.imageBase64}`
}
```

### High-Resolution Logo

```typescript
const result = await generateImageWithRetry({
  prompt: "Modern tech company logo",
  aspectRatio: "1:1",
  model: "gemini-3-pro-image-preview",
  imageSize: "4K",
  disableSearch: true  // Original design, no web references
})
```

### Image-to-Image with Reference

```typescript
const result = await generateImageWithRetry({
  prompt: "Same character but in a forest setting",
  referenceImage: base64String,  // No data: prefix
  referenceMode: "inspire",
  model: "gemini-3-pro-image-preview"
})
```

### Reproducible Generation with Seed

```typescript
const result = await generateImageWithRetry({
  prompt: "Fantasy landscape",
  seed: 12345,  // Same seed = same output
  model: "gemini-2.5-flash-preview-image"
})

// result.seed will be 12345
```

---

## Image Analysis (Vision)

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

const result = await model.generateContent([
  "Describe this image",
  {
    inlineData: {
      data: base64Image,
      mimeType: "image/png"
    }
  }
])

const text = result.response.text()
```

---

## Troubleshooting

### Model Returns 404
```
Error: Model not found
```
**Fix:** Check that model ID includes `-preview` suffix. Current valid IDs:
- `gemini-2.5-flash-preview-image`
- `gemini-3-pro-image-preview`

### No Image in Response
```
Error: No image data returned from Gemini API
```
**Causes:**
1. Safety filter blocked the content
2. Invalid `responseModalities` config
3. API returned text instead of image

**Fix:** Check `responseModalities: ["IMAGE"]` is set

### Rate Limiting
```
Error: 429 Resource exhausted
```
**Fix:** The client auto-retries with exponential backoff. If persistent:
1. Wait a few minutes
2. Check quota at https://aistudio.google.com/apikey
3. Increase `GEMINI_RETRY_BASE_DELAY`

### CORS Issues with Reference Images
**Fix:** Ensure reference image is pure base64 without `data:image/...;base64,` prefix

---

## Official Documentation

- Models: https://ai.google.dev/gemini-api/docs/models
- API Reference: https://ai.google.dev/api
- Quota/Limits: https://aistudio.google.com/apikey
