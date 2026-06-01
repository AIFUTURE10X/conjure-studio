# Smart Prompt Engine Design

## Goal

Build one shared prompt intelligence layer for the Image Generator and Logo Generator so a user can describe what they want, optionally provide a reference image, and receive a generation-ready prompt plus the right generator settings.

This expands the existing AI Prompt Helper instead of replacing it. The current chat helper, image prompt inputs, logo prompt enhancer, and reference-image flows should all move toward calling the same shared engine.

## Product Behavior

The first version is opt-in. Each generator gets a `Build Smart Prompt` action near the main prompt field. The user can type a rough idea, upload a reference image where the generator already supports one, click the button, review the result, and apply it to the current generator.

The AI Helper sidebar remains available as the conversational path. Its apply cards should eventually use the same smart prompt response shape as the generator buttons. That lets a user either work quickly inside the generator or talk through revisions in the helper.

Auto-improve-before-generate is a later setting, not the first version. The MVP should prove the engine can make useful choices before it silently changes prompts at generation time.

## Architecture

Create a shared module under `lib/smart-prompt-engine/` and one API route at `app/api/smart-prompt/route.ts`.

The API route receives a normalized request from either the image or logo generator. The library builds a mode-specific planning prompt, calls Gemini, validates the JSON response, normalizes settings against the app's allowed values, and returns a stable response to the UI.

Existing routes should not be deleted in the first pass. `/api/generate-prompt-suggestion` and `/api/enhance-logo-prompt` can keep working while the new route is introduced. Once the new route is proven, those older routes can be reduced to wrappers or migrated gradually.

## Core Request Shape

The engine accepts one request shape with mode-specific context:

```ts
type SmartPromptMode = 'image' | 'logo'

interface SmartPromptRequest {
  mode: SmartPromptMode
  userBrief: string
  currentPrompt?: string
  currentNegativePrompt?: string
  referenceAnalysis?: string
  referenceMode?: 'replicate' | 'inspire'
  currentSettings?: Record<string, unknown>
  conversationHistory?: Array<{
    role: 'user' | 'assistant'
    content: string
    suggestions?: unknown
  }>
}
```

The UI can pass image analysis text that already exists in `useAIHelper` and logo analysis text from the logo reference flow. If no reference image is present, `referenceAnalysis` is omitted.

## Core Response Shape

The engine returns one stable response shape:

```ts
interface SmartPromptResponse {
  mode: 'image' | 'logo'
  message: string
  finalPrompt: string
  negativePrompt: string
  settings: {
    aspectRatio?: string
    resolution?: '1K' | '2K' | '4K'
    model?: string
    style?: string
    styleStrength?: 'subtle' | 'moderate' | 'strong'
    cameraAngle?: string
    cameraLens?: string
    backgroundMode?: 'transparent' | 'normal'
    bgRemovalMethod?: string
    textMode?: 'ai-text' | 'exact-text-overlay'
  }
  logoConfig?: Record<string, unknown>
  referenceSummary?: string
  qualityNotes: string[]
  missingQuestions: string[]
  confidence: 'low' | 'medium' | 'high'
}
```

The UI should only apply fields it understands. Unknown settings must be ignored rather than breaking the form.

## Image Generator Behavior

The Image Generator smart prompt action should:

- Use the rough prompt, negative prompt, model, aspect ratio, style, camera angle, camera lens, style strength, creative direction, seed state, resolution, and reference image mode as context.
- Produce a polished image prompt that describes subject, scene, composition, lighting, material, mood, camera direction, and important constraints.
- Produce a practical negative prompt.
- Recommend only allowed image settings already available in the UI.
- Respect reference mode. `replicate` should preserve the subject or design closely. `inspire` should borrow style, palette, composition, or mood without cloning the exact image.
- Keep PhotoRoom as a background-removal option only when the user's output needs a transparent or isolated subject.

## Logo Generator Behavior

The Logo Generator smart prompt action should:

- Preserve exact brand names, capitalization, acronyms, slogans, and requested words.
- Decide whether the logo should be symbol, wordmark, monogram, badge, mascot, app icon, or combination mark.
- Recommend `exact-text-overlay` when readable brand text matters, especially for long names or slogans.
- Recommend `native-transparent` only when the selected model supports it. Otherwise recommend `photoroom` for transparent PNG cleanup or `none` for a normal designed background.
- Produce a logo prompt that is clean, scalable, brand-safe, and not overloaded with unrelated symbols.
- Produce a negative prompt that avoids common logo failures: garbled text, extra letters, watermarks, clutter, mockup scenes, low resolution, distorted geometry, and unusable backgrounds.
- Use reference logo analysis for palette, typography style, layout, symbol shape, dimensional effects, materials, and background treatment.

## UI Integration

In the Image Generator, add a compact `Build Smart Prompt` button near the main prompt controls. When the response returns, show a review card with the final prompt, negative prompt, suggested settings, and an `Apply` action.

In the Logo Generator, replace the narrow `AI Enhance Prompt` behavior with the same smart prompt review pattern. The existing button text can become `Build Smart Prompt`, and the response should update prompt, negative prompt, text mode, background removal method, model, aspect ratio, resolution, and any logo configuration fields the UI already supports.

In the AI Helper, keep the chat interface, but normalize its suggestion card data toward `SmartPromptResponse`. The helper should be able to call `/api/smart-prompt` for both image and logo modes, then render the same prompt/settings data it currently renders.

## Error Handling

If the AI API key is missing, return a clear 500 response with the configured key names. If the model returns invalid JSON, the API should attempt one JSON extraction pass and then return a controlled error rather than applying partial settings.

If the engine has low confidence or missing critical information, it should still produce a useful draft prompt and include `missingQuestions`. The UI should show those questions as advisory text, not block generation.

If a suggested setting is invalid, normalize it to the nearest allowed value when safe. If there is no safe match, omit that setting and keep the current UI value.

## Testing Strategy

Add focused contract tests for the smart prompt schema and normalization behavior. The first tests should run without live AI calls by testing pure functions in `lib/smart-prompt-engine/`.

Add route-level tests or contract checks that verify `/api/smart-prompt` accepts both `image` and `logo` mode payloads, rejects empty briefs, and returns stable JSON keys.

Extend `scripts/check-logo-generator-contract.cjs` or create a new smart prompt contract script to guard that:

- The Image Generator exposes `Build Smart Prompt`.
- The Logo Generator exposes `Build Smart Prompt`.
- The AI Helper calls or can consume the shared smart prompt response shape.
- Logo transparent output recommendations still use `native-transparent`, `photoroom`, or `none`, not Replicate as the default.

Run `npm run lint`, `npm run build`, and the new contract check before publishing.

## Rollout

Phase 1 introduces the shared engine, API route, pure normalization tests, and the Image Generator `Build Smart Prompt` review/apply flow.

Phase 2 migrates the Logo Generator `AI Enhance Prompt` button to the same engine and applies logo-specific settings.

Phase 3 updates the AI Helper sidebar to use the shared engine in both image and logo modes.

Phase 4 can add an optional `Auto-improve before Generate` setting once the opt-in engine output has proven reliable.

## Success Criteria

A user can type a rough image or logo idea, click `Build Smart Prompt`, and receive a prompt that is visibly more complete and useful than the original. Applying the result should update the prompt, negative prompt, and safe generator settings immediately.

For logos, exact brand text and transparent PNG behavior must improve instead of regress. For images, reference images should be interpreted as either replication or inspiration depending on the selected mode.

The feature is successful when the same smart prompt response can power the generator buttons and the AI Helper without duplicate prompt-building logic.
