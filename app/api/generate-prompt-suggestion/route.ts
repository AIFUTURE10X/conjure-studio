import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"
import { buildLogoSystemPrompt } from "@/app/image-studio/constants/ai-logo-knowledge"
import {
  CREATIVE_DIRECTION_SINGLE_GROUPS,
  DECORATIVE_ELEMENT_OPTIONS,
  buildCreativeDirectionPrompt,
  getCreativeDirectionOption,
  hasCreativeDirection,
  normalizeCreativeDirection,
  type CreativeDirectionState,
} from "@/app/image-studio/constants/creative-direction-options"
import { getGeminiApiKey, getGeminiApiKeyNames } from "@/lib/gemini-api-key"

// Initialize Gemini with API key check
const apiKey = getGeminiApiKey()
if (!apiKey) {
  console.error(`[v0 API] ${getGeminiApiKeyNames()} is not set in environment variables`)
}
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

const CREATIVE_DIRECTION_OPTION_CONTEXT = [
  ...CREATIVE_DIRECTION_SINGLE_GROUPS.map((group) => (
    `${group.label}: ${group.options.map((option) => option.label).join(", ")}`
  )),
  `Decorative Elements: ${DECORATIVE_ELEMENT_OPTIONS.map((option) => option.label).join(", ")}`,
].join("\n")

type HelperActionType =
  | 'apply_suggestions'
  | 'apply_and_generate'
  | 'apply_logo_config'
  | 'critique_last_output'
  | 'make_variation'
  | 'copy_prompt'
  | 'switch_to_image'
  | 'switch_to_logo'
  | 'ask_follow_up'

interface HelperAction {
  type: HelperActionType
  label: string
  description?: string
  prompt?: string
  target?: 'image' | 'logo'
}

const HELPER_ACTION_TYPES = new Set<HelperActionType>([
  'apply_suggestions',
  'apply_and_generate',
  'apply_logo_config',
  'critique_last_output',
  'make_variation',
  'copy_prompt',
  'switch_to_image',
  'switch_to_logo',
  'ask_follow_up',
])

const AGENTIC_AI_HELPER_CONTRACT = `AGENTIC AI HELPER CONTRACT:
- Act like a smart in-app creative agent, not a generic prompt writer
- Read the current generator settings, uploaded reference analysis, AGENT MEMORY, and recent conversation before answering
- Preserve what the user liked from previous prompts and change only what the user asks to change
- If the user reports a miss such as wrong font, wrong background, wrong colors, or poor reference match, diagnose the likely cause and return a corrected prompt/settings
- Prefer useful action buttons over long instructions; include 1-3 actions that match the response
- Use "apply_suggestions" when you generated a prompt/settings payload the app should apply
- Use "apply_and_generate" when the user asks you to do it, run it, try it, make it, or generate the next version
- Use "critique_last_output" when a generated output is available and the user may want diagnosis
- Use "make_variation" when a generated output is available and the user may want the next iteration
- Use "copy_prompt" when the prompt is useful but should not immediately change settings
- Use "switch_to_logo" or "switch_to_image" only when the user is in the wrong mode
- Use "ask_follow_up" only when one short answer is required before making a good prompt`

function normalizeHelperActions(rawActions: unknown, fallbackActions: HelperAction[] = []): HelperAction[] {
  if (!Array.isArray(rawActions)) return fallbackActions

  const actions = rawActions
    .map((rawAction): HelperAction | null => {
      if (!rawAction || typeof rawAction !== 'object') return null
      const action = rawAction as Record<string, unknown>
      const type = typeof action.type === 'string' ? action.type : ''
      if (!HELPER_ACTION_TYPES.has(type as HelperActionType)) return null
      const label = typeof action.label === 'string' && action.label.trim()
        ? action.label.trim()
        : type.replace(/_/g, ' ')

      return {
        type: type as HelperActionType,
        label,
        ...(typeof action.description === 'string' && action.description.trim() ? { description: action.description.trim() } : {}),
        ...(typeof action.prompt === 'string' && action.prompt.trim() ? { prompt: action.prompt.trim() } : {}),
        ...(action.target === 'image' || action.target === 'logo' ? { target: action.target } : {}),
      }
    })
    .filter((action): action is HelperAction => Boolean(action))

  return actions.length > 0 ? actions.slice(0, 5) : fallbackActions
}

function hasLatestOutput(currentPromptSettings: unknown): boolean {
  if (!currentPromptSettings || typeof currentPromptSettings !== 'object') return false
  const settings = currentPromptSettings as Record<string, unknown>
  const latestOutput = settings.latestOutput
  if (latestOutput && typeof latestOutput === 'object' && (latestOutput as Record<string, unknown>).hasOutput) return true
  const latestImageOutput = settings.latestImageOutput
  if (latestImageOutput && typeof latestImageOutput === 'object' && (latestImageOutput as Record<string, unknown>).hasOutput) return true
  const latestLogoOutput = settings.latestLogoOutput
  return Boolean(latestLogoOutput && typeof latestLogoOutput === 'object' && (latestLogoOutput as Record<string, unknown>).hasOutput)
}

function defaultHelperActions(mode: 'image' | 'logo', hasSuggestions: boolean, hasLogoConfig = false, hasOutput = false): HelperAction[] {
  const actions: HelperAction[] = []
  if (hasSuggestions) {
    actions.push({
      type: 'apply_suggestions',
      label: mode === 'logo' ? 'Apply to Logo Generator' : 'Apply to Image Generator',
      description: 'Use this prompt and settings in the generator',
      target: mode,
    })
    actions.push({
      type: 'apply_and_generate',
      label: mode === 'logo' ? 'Apply and Generate Logo' : 'Apply and Generate Image',
      description: 'Apply these settings and start generation',
      target: mode,
    })
    actions.push({
      type: 'copy_prompt',
      label: 'Copy Prompt',
      description: 'Copy the generated prompt',
      target: mode,
    })
  }
  if (hasOutput) {
    actions.push({
      type: 'critique_last_output',
      label: 'Critique Latest',
      description: 'Analyze the latest generated output and fix the prompt',
      target: mode,
    })
    actions.push({
      type: 'make_variation',
      label: 'Make Variation',
      description: 'Create a new prompt from the latest output',
      target: mode,
    })
  }
  if (mode === 'logo' && hasLogoConfig) {
    actions.push({
      type: 'apply_logo_config',
      label: 'Apply Logo Effects',
      description: 'Apply the suggested configurator settings',
      target: 'logo',
    })
  }
  return actions
}

function formatAgentMemory(agentMemory: unknown): string {
  if (!agentMemory || typeof agentMemory !== 'object') return 'None yet'
  const memory = agentMemory as Record<string, unknown>
  return JSON.stringify({
    mode: memory.mode || 'unknown',
    lastImagePrompt: memory.lastImagePrompt || '',
    lastLogoPrompt: memory.lastLogoPrompt || '',
    lastNegativePrompt: memory.lastNegativePrompt || '',
    lastAssistantSummary: memory.lastAssistantSummary || '',
    recentUserRequests: Array.isArray(memory.recentUserRequests) ? memory.recentUserRequests.slice(-4) : [],
  }, null, 2)
}

function formatCreativeDirectionContext(input: Partial<CreativeDirectionState> | null | undefined): string {
  const creativeDirection = normalizeCreativeDirection(input)
  if (!hasCreativeDirection(creativeDirection)) return "None selected"

  const selectedLines = CREATIVE_DIRECTION_SINGLE_GROUPS
    .map((group) => {
      const option = getCreativeDirectionOption(creativeDirection[group.key])
      return option ? `- ${group.label}: ${option.label}` : null
    })
    .filter((line): line is string => Boolean(line))

  const decorativeLabels = creativeDirection.decorativeElements
    .map((value) => getCreativeDirectionOption(value)?.label)
    .filter((label): label is string => Boolean(label))

  if (decorativeLabels.length > 0) {
    selectedLines.push(`- Decorative Elements: ${decorativeLabels.join(", ")}`)
  }

  const promptModifier = buildCreativeDirectionPrompt(creativeDirection)
  if (promptModifier) {
    selectedLines.push(`- Generation prompt modifier: ${promptModifier}`)
  }

  return selectedLines.join("\n")
}

export async function POST(request: Request) {
  try {
    const {
      message,
      currentPrompt,
      currentNegativePrompt,
      currentStyle,
      currentCameraAngle,
      currentCameraLens,
      currentAspectRatio,
      styleStrength,
      promptMode,
      creativeDirection,
      currentPromptSettings,
      latestOutputAnalysis,
      agentMemory,
      conversationHistory,
      mode, // NEW: 'image' | 'logo'
      logoAnalysis, // NEW: analysis from reference logo image
    } = await request.json()

    console.log("[v0 API] Generate Prompt Suggestion called:", {
      messageLength: message?.length,
      hasImageAnalysis: message?.includes("REFERENCE IMAGES ANALYSIS"),
      currentPromptLength: currentPrompt?.length,
      mode: mode || 'image',
    })

    // Check if Gemini is available
    if (!genAI) {
      console.error(`[v0 API] Gemini API not initialized - missing ${getGeminiApiKeyNames()}`)
      return NextResponse.json(
        { error: "AI service not configured", details: `${getGeminiApiKeyNames()} environment variable is not set` },
        { status: 500 }
      )
    }

    // Handle logo mode separately
    if (mode === 'logo') {
      return handleLogoMode(message, conversationHistory, logoAnalysis, currentPromptSettings, agentMemory, latestOutputAnalysis)
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Build conversation context WITH generated prompts (so AI can reference previous suggestions)
    const contextMessages = conversationHistory
      ?.slice(-5) // Last 5 messages for context
      .map((msg: any) => {
        let context = `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
        // Include the actual generated prompt if present (critical for "add to previous" requests)
        if (msg.role === "assistant" && msg.suggestions?.prompt) {
          context += `\n  [Generated Prompt: "${msg.suggestions.prompt}"]`
        }
        return context
      })
      .join("\n\n")

    // Extract the LAST generated prompt for explicit reference
    const lastAssistantMsg = conversationHistory
      ?.slice().reverse().find((m: any) => m.role === "assistant" && m.suggestions?.prompt)
    const lastGeneratedPrompt = lastAssistantMsg?.suggestions?.prompt || null

    const hasImageAnalysis = message?.includes("REFERENCE IMAGES ANALYSIS")
    const creativeDirectionContext = formatCreativeDirectionContext(creativeDirection)
    const agentMemoryContext = formatAgentMemory(agentMemory)
    const hasOutput = hasLatestOutput(currentPromptSettings)

    const systemPrompt = `You are an expert AI image prompt assistant. Help users create detailed, effective prompts for AI image generation.

${AGENTIC_AI_HELPER_CONTRACT}

Current Settings:
- Prompt: ${currentPrompt || "None"}
- Negative Prompt: ${currentNegativePrompt || "None"}
- Style: ${currentStyle || "None"}
- Camera Angle: ${currentCameraAngle || "None"}
- Camera Lens: ${currentCameraLens || "None"}
- Aspect Ratio: ${currentAspectRatio || "None"}
- Style Strength: ${styleStrength || "None"}
- Prompt Mode: ${promptMode || "None"}
- Current Creative Direction:
${creativeDirectionContext}
- Raw currentPromptSettings snapshot:
${JSON.stringify(currentPromptSettings || {}, null, 2)}

Available Creative Direction controls:
${CREATIVE_DIRECTION_OPTION_CONTEXT}

AGENT MEMORY:
${agentMemoryContext}

${latestOutputAnalysis ? `
=== LATEST GENERATED OUTPUT ANALYSIS ===
This is the current output to critique or iterate from, not a new reference target:
${latestOutputAnalysis}

If the user asks for critique, diagnose mismatches between this output, the current prompt, and prior requests. If the user asks for a variation, preserve the strongest parts and change only the requested/weak parts.
` : ''}

Recent Conversation:
${contextMessages || "None"}

${lastGeneratedPrompt ? `
PREVIOUS GENERATED PROMPT (reference for "add to this", "make it more X", etc.):
"${lastGeneratedPrompt}"

IMPORTANT: If the user's request references the previous prompt (e.g., "add sparkles", "make it darker", "include a dog", "now add X"), BUILD UPON the previous prompt by incorporating their additions/changes rather than creating something entirely new. Preserve what worked and add the new elements they request.
` : ''}

User Request: ${message}

${
  hasImageAnalysis
    ? `
IMPORTANT: The user has provided image analysis data above. You MUST:
1. Extract ALL specific visual details from the "REFERENCE IMAGES ANALYSIS" section
2. If the uploaded image is an ad, flyer, poster, social creative, landing graphic, or branded design, focus on design direction: ad type, typography, dimensional lettering, font fill/inlay, layout, CTA, background scenery, paper effects, texture, decorative elements, and color palette.
3. If the uploaded image is a character/subject reference, create a detailed prompt that replicates the exact character/subject described, including features, clothing, accessories, pose, and expression.
4. Recommend concrete Creative Direction settings by label when they match the uploaded ad/design or when they would help the requested iteration, including Text Outline / Rim when the reference uses gold rims, keylines, inset strokes, or foil edges.
5. Be extremely specific and detailed. Do NOT give generic advice - use the specific details from the analysis.

Your response should acknowledge the image analysis and provide a detailed prompt based on it.
`
    : ""
}

Based on the user's request${hasImageAnalysis ? " and the provided image analysis" : ""} and current settings, provide:
1. A conversational response explaining your suggestions${hasImageAnalysis ? " (acknowledge you've analyzed their reference image)" : ""}
2. An improved main prompt (detailed, descriptive${hasImageAnalysis ? ", using specifics from the image analysis" : ""})
3. An improved negative prompt
4. Recommended style preset (MUST be one of the available styles listed below)
5. Recommended camera angle (use "None" if not applicable)
6. Recommended camera lens (use "None" if not applicable)
7. Recommended aspect ratio
8. Style strength (subtle, moderate, or strong - how much to apply the style)

Creative Direction guidance:
- Treat the selected Creative Direction settings as active context. Do not contradict them unless the user asks to change direction.
- If the user asks what style to use, or uploads an ad/design to iterate on, name the closest Creative Direction controls to use in the conversational "message".
- Keep the JSON schema unchanged. Put Creative Direction recommendations in the conversational message and incorporate visual direction into the improved prompt.

Format your response as JSON:
{
  "message": "Your conversational response here",
  "suggestions": {
    "prompt": "improved prompt",
    "negativePrompt": "improved negative prompt",
    "style": "style_preset_value",
    "cameraAngle": "camera_angle_value or None",
    "cameraLens": "camera_lens_value or None",
    "aspectRatio": "aspect_ratio_value",
    "styleStrength": "moderate"
  },
  "actions": [
    { "type": "apply_suggestions", "label": "Apply to Image Generator", "description": "Use this prompt and settings" },
    { "type": "apply_and_generate", "label": "Apply and Generate Image", "description": "Use this prompt and start generation" },
    { "type": "critique_last_output", "label": "Critique Latest", "description": "Analyze the latest output and fix the prompt" },
    { "type": "make_variation", "label": "Make Variation", "description": "Create a new prompt from the latest output" },
    { "type": "copy_prompt", "label": "Copy Prompt", "description": "Copy the improved prompt" }
  ]
}

Available styles (MUST use exact values): Realistic, Cartoon Style, Pixar, PhotoReal, Anime, Oil Painting, Watercolor, 3D Render, Sketch, Comic Book, Studio Ghibli, Makoto Shinkai, Disney Modern 3D, Sony Spider-Verse, Laika Stop-Motion, Cartoon Saloon, Studio Trigger, Ufotable, Kyoto Animation
Available camera angles: eye-level, high-angle, low-angle, birds-eye, overhead, dutch-angle, worms-eye, over-the-shoulder, point-of-view, None
Available camera lenses: standard, wide-angle, telephoto, fisheye, macro, portrait, tilt-shift, None
Available aspect ratios: 1:1, 16:9, 9:16, 4:3, 3:4, 21:9
Available style strengths: subtle, moderate, strong`

    console.log("[v0 API] Calling Gemini API with prompt length:", systemPrompt.length)

    const result = await model.generateContent(systemPrompt)
    const responseText = result.response.text()

    console.log("[v0 API] Gemini response received, length:", responseText.length)

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const jsonResponse = JSON.parse(jsonMatch[0])
      console.log("[v0 API] Successfully parsed JSON response")
      const hasSuggestions = Boolean(jsonResponse.suggestions?.prompt)
      return NextResponse.json({
        ...jsonResponse,
        actions: normalizeHelperActions(jsonResponse.actions, defaultHelperActions('image', hasSuggestions, false, hasOutput)),
      })
    }

    console.warn("[v0 API] Failed to parse JSON, using fallback response")
    return NextResponse.json({
      message: responseText,
      suggestions: {
        prompt: currentPrompt || "",
        negativePrompt: currentNegativePrompt || "",
        style: currentStyle || "Realistic",
        cameraAngle: currentCameraAngle || "None",
        cameraLens: currentCameraLens || "None",
        aspectRatio: currentAspectRatio || "1:1",
        styleStrength: styleStrength || "moderate",
      },
      actions: defaultHelperActions('image', Boolean(currentPrompt), false, hasOutput),
    })
  } catch (error: any) {
    console.error("[v0 API] Error generating prompt suggestion:", error)

    // Check for specific Gemini API errors
    const errorMessage = error?.message || String(error)
    const isRateLimit = errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate")
    const isAuthError = errorMessage.includes("401") || errorMessage.includes("403") || errorMessage.includes("API key")

    if (isRateLimit) {
      return NextResponse.json(
        { error: "Rate limit exceeded", details: "Please wait a moment and try again" },
        { status: 429 }
      )
    }

    if (isAuthError) {
      return NextResponse.json(
        { error: "API authentication failed", details: `Check your ${getGeminiApiKeyNames()} configuration` },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: "Failed to generate suggestion", details: errorMessage },
      { status: 500 },
    )
  }
}

interface LogoPromptSuggestions {
  prompt: string
  negativePrompt?: string
  style: string
  cameraAngle: string
  cameraLens: string
  aspectRatio: string
  styleStrength: 'subtle' | 'moderate' | 'strong'
  resolution: string
}

function stringFromUnknown(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function normalizeLogoPromptSuggestions(rawSuggestions: unknown): LogoPromptSuggestions | undefined {
  if (!rawSuggestions || typeof rawSuggestions !== 'object') return undefined

  const suggestions = rawSuggestions as Record<string, unknown>
  const prompt = stringFromUnknown(suggestions.prompt)
  if (!prompt) return undefined

  const styleStrength = stringFromUnknown(suggestions.styleStrength, 'moderate').toLowerCase()
  const normalizedStyleStrength: LogoPromptSuggestions['styleStrength'] =
    styleStrength === 'subtle' || styleStrength === 'strong' ? styleStrength : 'moderate'
  const negativePrompt = stringFromUnknown(suggestions.negativePrompt)

  return {
    prompt,
    ...(negativePrompt ? { negativePrompt } : {}),
    style: stringFromUnknown(suggestions.style, '3D Render'),
    cameraAngle: stringFromUnknown(suggestions.cameraAngle, 'None'),
    cameraLens: stringFromUnknown(suggestions.cameraLens, 'None'),
    aspectRatio: stringFromUnknown(suggestions.aspectRatio, '1:1'),
    styleStrength: normalizedStyleStrength,
    resolution: stringFromUnknown(suggestions.resolution, '1K'),
  }
}

/**
 * Handle logo mode requests - suggests general logo prompts and optional configurator settings.
 */
async function handleLogoMode(
  message: string,
  conversationHistory: any[],
  logoAnalysis?: string,
  currentPromptSettings?: unknown,
  agentMemory?: unknown,
  latestOutputAnalysis?: string
) {
  try {
    // Check if Gemini is available
    if (!genAI) {
      console.error(`[v0 API] Logo mode - Gemini API not initialized - missing ${getGeminiApiKeyNames()}`)
      return NextResponse.json(
        { error: "AI service not configured", details: `${getGeminiApiKeyNames()} environment variable is not set` },
        { status: 500 }
      )
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Build conversation context WITH logo configs (so AI can reference previous suggestions)
    const contextMessages = conversationHistory
      ?.slice(-5)
      .map((msg: any) => {
        let context = `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
        // Include key logo config settings if present (critical for "add to previous" requests)
        if (msg.role === "assistant" && msg.logoConfig) {
          const cfg = msg.logoConfig
          const keySettings = []
          if (cfg.brandName) keySettings.push(`brandName: "${cfg.brandName}"`)
          if (cfg.textColor) keySettings.push(`textColor: ${cfg.textColor}`)
          if (cfg.metallicFinish && cfg.metallicFinish !== 'none') keySettings.push(`metallic: ${cfg.metallicFinish}`)
          if (cfg.glowEffect && cfg.glowEffect !== 'none') keySettings.push(`glow: ${cfg.glowEffect}`)
          if (cfg.depthLevel) keySettings.push(`depth: ${cfg.depthLevel}`)
          if (keySettings.length > 0) {
            context += `\n  [Generated Config: ${keySettings.join(', ')}]`
          }
        }
        if (msg.role === "assistant" && msg.suggestions?.prompt) {
          context += `\n  [Generated Logo Prompt: "${msg.suggestions.prompt}"]`
          if (msg.suggestions.negativePrompt) {
            context += `\n  [Generated Negative Prompt: "${msg.suggestions.negativePrompt}"]`
          }
        }
        return context
      })
      .join("\n\n")

    // Extract the LAST generated logoConfig for explicit reference
    const lastAssistantMsg = conversationHistory
      ?.slice().reverse().find((m: any) => m.role === "assistant" && (m.logoConfig || m.suggestions?.prompt))
    const lastLogoConfig = lastAssistantMsg?.logoConfig || null
    const lastLogoPrompt = lastAssistantMsg?.suggestions?.prompt || null

    // Get the dynamic system prompt from ai-logo-knowledge.ts
    const logoSystemPrompt = buildLogoSystemPrompt()
    const agentMemoryContext = formatAgentMemory(agentMemory)
    const hasOutput = hasLatestOutput(currentPromptSettings)

    const fullPrompt = `${logoSystemPrompt}

${AGENTIC_AI_HELPER_CONTRACT}

Current Logo/Image Studio Settings:
${JSON.stringify(currentPromptSettings || {}, null, 2)}

AGENT MEMORY:
${agentMemoryContext}

${latestOutputAnalysis ? `
=== LATEST GENERATED OUTPUT ANALYSIS ===
This is the current generated logo to critique or iterate from, not the user's original reference target:
${latestOutputAnalysis}

If the user asks for critique, diagnose typography, layout, background, color, readability, and reference-match misses. If the user asks for a variation, keep the strongest brand direction and correct the weak parts.
` : ''}

${logoAnalysis ? `
=== REFERENCE LOGO ANALYSIS ===
The user has uploaded a reference logo. Here is the analysis:
${logoAnalysis}

IMPORTANT: Use this analysis to suggest settings that will recreate a similar look.
Match the colors, materials, effects, and style as closely as possible.
` : ''}

${contextMessages ? `
Recent Conversation:
${contextMessages}
` : ''}

${lastLogoConfig ? `
PREVIOUS GENERATED CONFIG (reference for "add glow", "make it gold", "change the color", etc.):
${JSON.stringify(lastLogoConfig, null, 2)}

IMPORTANT: If the user wants to ADD or MODIFY settings (e.g., "add more glow", "make it gold", "change the color to blue", "now add sparkles"), START with the previous config and incorporate their changes. Don't create from scratch unless they explicitly ask for something completely different. Preserve the settings that worked and add/modify only what they request.
` : ''}

${lastLogoPrompt ? `
PREVIOUS GENERATED LOGO PROMPT (reference for "make it more premium", "add an icon", "remove text", etc.):
"${lastLogoPrompt}"

IMPORTANT: If the user asks for an iteration, build on the previous generation-ready logo prompt while making the requested changes.
` : ''}

User Request: ${message}

Based on the user's request${logoAnalysis ? ' and the reference logo analysis' : ''}${lastLogoConfig || lastLogoPrompt ? ' (building upon the previous design if applicable)' : ''}, suggest appropriate general logo settings and a generation-ready logo prompt.
Only include logoConfig keys when the user explicitly wants configurator-controlled effects such as dot matrix, 3D depth, metallic materials, glow, sparkles, or icon presets. For clean wordmark or reference-style typography requests, return an empty logoConfig and keep the prompt focused on typography, composition, palette, and background.
Remember to respond with a JSON object containing "message", "designBrief", "suggestions", "logoConfig", and "actions" as specified above.

Action schema:
"actions": [
  { "type": "apply_suggestions", "label": "Apply to Logo Generator", "description": "Use this prompt and settings" },
  { "type": "apply_and_generate", "label": "Apply and Generate Logo", "description": "Use this prompt and start generation" },
  { "type": "critique_last_output", "label": "Critique Latest", "description": "Analyze the latest logo and fix the prompt" },
  { "type": "make_variation", "label": "Make Variation", "description": "Create a new prompt from the latest logo" },
  { "type": "copy_prompt", "label": "Copy Prompt", "description": "Copy the generated logo prompt" }
]`

    console.log("[v0 API] Logo mode - calling Gemini with dynamic system prompt")

    const result = await model.generateContent(fullPrompt)
    const responseText = result.response.text()

    console.log("[v0 API] Logo mode - Gemini response received, length:", responseText.length)

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const jsonResponse = JSON.parse(jsonMatch[0])
        const logoSuggestions = normalizeLogoPromptSuggestions(jsonResponse.suggestions)
        const logoConfig = jsonResponse.logoConfig || {}
        const hasLogoConfig = Boolean(logoConfig && Object.keys(logoConfig).length > 0)
        console.log("[v0 API] Logo mode - Successfully parsed JSON response with config keys:",
          hasLogoConfig ? Object.keys(logoConfig) : 'none')
        return NextResponse.json({
          message: jsonResponse.message || "Here are my logo design suggestions.",
          designBrief: jsonResponse.designBrief || null,
          suggestions: logoSuggestions,
          logoConfig,
          actions: normalizeHelperActions(jsonResponse.actions, defaultHelperActions('logo', Boolean(logoSuggestions?.prompt), hasLogoConfig, hasOutput)),
          mode: 'logo'
        })
      } catch (parseError) {
        console.error("[v0 API] Logo mode - JSON parse error:", parseError)
      }
    }

    // Fallback response
    console.warn("[v0 API] Logo mode - Failed to parse JSON, using fallback")
    return NextResponse.json({
      message: responseText,
      logoConfig: {},
      actions: defaultHelperActions('logo', false, false, hasOutput),
      mode: 'logo'
    })
  } catch (error: any) {
    console.error("[v0 API] Logo mode error:", error)

    // Check for specific Gemini API errors
    const errorMessage = error?.message || String(error)
    const isRateLimit = errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate")
    const isAuthError = errorMessage.includes("401") || errorMessage.includes("403") || errorMessage.includes("API key")

    if (isRateLimit) {
      return NextResponse.json(
        { error: "Rate limit exceeded", details: "Please wait a moment and try again" },
        { status: 429 }
      )
    }

    if (isAuthError) {
      return NextResponse.json(
        { error: "API authentication failed", details: `Check your ${getGeminiApiKeyNames()} configuration` },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: "Failed to generate logo suggestions", details: errorMessage },
      { status: 500 },
    )
  }
}
