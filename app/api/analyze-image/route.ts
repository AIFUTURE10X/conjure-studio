import { type NextRequest, NextResponse } from "next/server"
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { buildLogoAnalysisPrompt } from "@/app/image-studio/constants/ai-logo-knowledge"
import { getGeminiApiKey, getGeminiApiKeyNames } from "@/lib/gemini-api-key"

export async function POST(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.transform)
  if (rateLimited) return rateLimited

  try {
    console.log("[v0] =====  ANALYZE IMAGE API CALLED =====")

    const formData = await request.formData()
    const image = formData.get("image") as File
    const type = formData.get("type") as string
    const mode = (formData.get("mode") as string) || "quality"
    const selectedStylePreset = formData.get("selectedStylePreset") as string

    console.log("[v0] Request details:", {
      hasImage: !!image,
      type,
      mode,
      imageSize: image?.size,
      imageType: image?.type,
      selectedStylePreset,
    })

    if (!image) {
      console.error("[v0] ERROR: No image provided in form data")
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Check for API key with detailed logging
    const apiKey = getGeminiApiKey()
    console.log("[v0] Environment check:", {
      hasGeminiKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey?.substring(0, 10) || "MISSING",
    })

    if (!apiKey) {
      console.error(`[v0] CRITICAL ERROR: ${getGeminiApiKeyNames()} not found in environment`)
      return NextResponse.json(
        {
          error: "Gemini API key not configured",
          details: `The ${getGeminiApiKeyNames()} environment variable is missing. Please add one in the Vars section of v0.`,
        },
        { status: 500 },
      )
    }

    // Convert image to base64
    console.log("[v0] Converting image to base64...")
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const base64Image = buffer.toString("base64")
    const mimeType = image.type

    console.log("[v0] Image converted successfully:", {
      base64Length: base64Image.length,
      mimeType,
      sizeInMB: (buffer.byteLength / 1024 / 1024).toFixed(2),
    })

    const fastPrompts = {
      subject: "In 1-2 sentences, describe the main subject: appearance, clothing, and pose.",
      scene: "In 1-2 sentences, describe the scene: location, lighting, and atmosphere. Ignore subjects.",
      style: selectedStylePreset
        ? `First, identify the ACTUAL artistic style of this image (e.g., Studio Ghibli anime, Pixar 3D, photorealistic, oil painting, comic book, etc.). Then in 1-2 sentences, state what style this image is and explain if it matches or differs from the requested "${selectedStylePreset}" style.`
        : "In 1-2 sentences, identify the specific artistic style (e.g., Pixar 3D animation, Studio Ghibli anime, Disney animation, oil painting, watercolor, manga, comic book, Art Deco, impressionism, cyberpunk art, minimalist design, etc.) and describe its key visual characteristics.",
      logo: "Briefly describe this logo: colors (primary/accent), metallic finish type, 3D depth level, any dot/halftone patterns, glow effects, and overall style (tech/luxury/creative/finance). Keep it to 2-3 sentences.",
    }

    const qualityPrompts = {
      subject:
        "Describe the main subject in this image as a single flowing paragraph suitable for image generation. Include their physical appearance (facial features, body type, age, skin tone, hair, eyes), clothing and accessories (garments, colors, materials, jewelry, props), pose and body language, facial expression and emotional state, current actions or activities, and any unique characteristics like tattoos or distinctive features. Write in natural prose without bullet points, numbered lists, or markdown formatting.",
      scene:
        "Describe ONLY the scene, environment, and setting in this image as a single flowing paragraph. DO NOT describe any subjects or characters. Focus on the location, background elements, landscape, architecture, lighting conditions, atmosphere, weather, time of day, and spatial composition. Write in natural prose without bullet points, numbered lists, or markdown formatting.",
      style: selectedStylePreset
        ? `Analyze this image's artistic style as a single flowing paragraph. First, identify the ACTUAL style of this image (e.g., Studio Ghibli hand-drawn anime, Makoto Shinkai digital anime, Pixar 3D animation style, Disney character design, photorealistic digital art, oil painting, watercolor, manga, comic book, Art Deco, impressionism, cyberpunk, etc.). Be very specific about the art style category - if it's anime, specify which studio or artist style (Ghibli, Shinkai, KyoAni, etc.). Then describe its defining visual characteristics including rendering technique, color palette, lighting approach, texture quality, line work, shading method, and aesthetic mood. Finally, explain whether this matches the requested "${selectedStylePreset}" style or how it differs. Write in natural prose without bullet points, numbered lists, or markdown formatting.`
        : "Identify and describe the specific artistic style of THIS image as a single flowing paragraph. Start by naming the precise art style or medium (e.g., Studio Ghibli hand-drawn anime, Makoto Shinkai digital anime, Pixar 3D animation style, Disney character design, photorealistic digital art, oil painting, watercolor illustration, manga/comic book art, Art Deco, Renaissance painting, impressionism, cyberpunk digital art, minimalist vector design, clay animation, stop-motion, retro poster art, etc.). Be as specific as possible - if it's anime, identify which studio or artist style. Then describe its defining visual characteristics including the rendering technique, color palette and color temperature, lighting approach, texture quality, line work style, shading method, any signature visual effects, and the overall aesthetic mood. Write in natural prose without bullet points, numbered lists, or markdown formatting.",
      logo: buildLogoAnalysisPrompt(),
    }

    const prompts = mode === "fast" ? fastPrompts : qualityPrompts
    const prompt = prompts[type as keyof typeof prompts] || prompts.subject

    console.log("[v0] Analysis configuration:", { type, mode, promptLength: prompt.length })

    console.log("[v0] Initializing Gemini AI...")
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    }

    console.log("[v0] Calling Gemini API (gemini-2.0-flash)...")
    const result = await model.generateContent([prompt, imagePart])
    const response = result.response
    const text = response.text()

    console.log("[v0] ===== SUCCESS =====")
    console.log("[v0] Analysis received:", {
      textLength: text.length,
      preview: text.substring(0, 100) + "...",
    })

    return NextResponse.json({ analysis: text })
  } catch (error) {
    console.error("[v0] ===== CRITICAL ERROR IN ANALYZE-IMAGE API =====")
    console.error("[v0] Error type:", error?.constructor?.name)
    console.error("[v0] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")

    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorDetails = {
      message: errorMessage,
      type: error?.constructor?.name,
      stack: error instanceof Error ? error.stack : undefined,
    }

    console.error("[v0] Full error details:", JSON.stringify(errorDetails, null, 2))

    // Provide helpful error messages
    let hint = "Check browser console for detailed error logs"
    if (errorMessage.toLowerCase().includes("api key")) {
      hint = `${getGeminiApiKeyNames()} is invalid or missing. Please check your environment variables in the Vars section.`
    } else if (errorMessage.toLowerCase().includes("quota") || errorMessage.toLowerCase().includes("limit")) {
      hint = "Gemini API quota exceeded. Please check your Google AI Studio quota at https://aistudio.google.com/"
    } else if (errorMessage.toLowerCase().includes("fetch")) {
      hint = "Network error connecting to Gemini API. Check your internet connection."
    }

    return NextResponse.json(
      {
        error: "Failed to analyze image",
        details: errorMessage,
        hint,
      },
      { status: 500 },
    )
  }
}
