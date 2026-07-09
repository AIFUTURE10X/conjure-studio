import { type NextRequest, NextResponse } from "next/server"
import { withCreditGuard, imageFormCost } from '@/lib/api/guard'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { parseLogoGenerationRequest } from "./logo-request"
import {
  generateLogoBaseImage,
  removeLogoBackgroundIfNeeded,
  shouldUseFreeFormPrompt,
  toPngDataUrl,
  upscaleLogoIfNeeded,
} from "./logo-image-pipeline"
import { buildFreeFormLogoPrompt, buildLogoPrompt, buildReferenceLogoPrompt, type LogoBackgroundMode } from "./logo-prompts"

export const runtime = "nodejs"
export const maxDuration = 300

async function handlePost(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.generation)
  if (rateLimited) return rateLimited

  try {
    const formData = await request.formData()
    const logoRequest = await parseLogoGenerationRequest(formData)

    console.log("[Logo API] Generate request:", {
      prompt: logoRequest.prompt?.substring(0, 100),
      negativePrompt: logoRequest.negativePrompt?.substring(0, 50),
      style: logoRequest.style,
      model: logoRequest.model,
      bgRemovalMethod: logoRequest.bgRemovalMethod,
      skipBgRemoval: logoRequest.skipBgRemoval,
      aspectRatio: logoRequest.aspectRatio,
      resolution: logoRequest.resolution,
      textMode: logoRequest.textMode,
      seed: logoRequest.seed !== undefined ? logoRequest.seed : 'random',
      hasReference: !!logoRequest.referenceImage,
      referenceMode: logoRequest.referenceMode,
    })

    if (!logoRequest.prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    if (logoRequest.bgRemovalMethod === 'native-transparent' && logoRequest.model !== 'gpt-image-2') {
      return NextResponse.json(
        { error: "Native transparent PNG requires ChatGPT Images 2.0" },
        { status: 400 }
      )
    }

    const useFreeFormPrompt = shouldUseFreeFormPrompt(logoRequest)
    const backgroundMode: LogoBackgroundMode = logoRequest.bgRemovalMethod === 'native-transparent'
      ? 'native-transparent'
      : logoRequest.bgRemovalMethod === 'none' || logoRequest.skipBgRemoval
        ? 'presentation'
        : 'removable'
    let enhancedPrompt = logoRequest.referenceImage
      ? buildReferenceLogoPrompt(logoRequest.prompt, logoRequest.referenceMode, logoRequest.textMode, backgroundMode)
      : useFreeFormPrompt
        ? buildFreeFormLogoPrompt(logoRequest.prompt, logoRequest.style, logoRequest.textMode, backgroundMode)
        : buildLogoPrompt(logoRequest.prompt, logoRequest.style, logoRequest.textMode, backgroundMode)

    // Append negative prompt if provided
    if (logoRequest.negativePrompt?.trim()) {
      enhancedPrompt += `\n\nAVOID these elements in the design:\n${logoRequest.negativePrompt.trim()}`
    }

    console.log("[Logo API] Using free-form generation:", useFreeFormPrompt)
    console.log("[Logo API] Has negative prompt:", !!logoRequest.negativePrompt?.trim())
    console.log("[Logo API] Enhanced prompt:", enhancedPrompt.substring(0, 200) + "...")

    const result = await generateLogoBaseImage(logoRequest, enhancedPrompt)

    if (!result.success || !result.imageBase64) {
      console.error("[Logo API] Generation failed:", result.error)
      return NextResponse.json(
        { error: result.error || "Failed to generate logo" },
        { status: 500 }
      )
    }

    const processedLogo = await removeLogoBackgroundIfNeeded(logoRequest, result.imageBase64)
    const finalBase64 = await upscaleLogoIfNeeded(logoRequest, processedLogo.imageBase64)

    return NextResponse.json({
      success: true,
      image: toPngDataUrl(finalBase64),
      style: logoRequest.style,
      bgRemovalMethod: processedLogo.bgRemovalMethod,
      aspectRatio: logoRequest.aspectRatio,
      resolution: logoRequest.resolution,
      textMode: logoRequest.textMode,
      seed: result.seed, // Return seed for reproducibility
    })
  } catch (error) {
    console.error("[Logo API] Route error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate logo" },
      { status: 500 }
    )
  }
}

export const POST = withCreditGuard('logo_generation', imageFormCost, handlePost)
