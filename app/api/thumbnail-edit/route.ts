/**
 * API Route: Thumbnail Edit (AI inpaint)
 *
 * Masked inpainting for the thumbnail editor — erase an object (fill from the
 * surroundings) or replace the masked area from a prompt. Uses OpenAI's
 * gpt-image-2 image-edit endpoint with a mask (transparent = edit here).
 */

import { type NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { withCreditGuard, flatCost } from "@/lib/api/guard"
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { generateOpenAIImage } from "@/lib/openai-image-client"

export const runtime = "nodejs"
export const maxDuration = 120

const RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9", "5:4", "4:5"] as const
type Ratio = (typeof RATIOS)[number]
const RATIO_VALUE: Record<Ratio, number> = {
  "1:1": 1, "16:9": 16 / 9, "9:16": 9 / 16, "4:3": 4 / 3, "3:4": 3 / 4,
  "3:2": 3 / 2, "2:3": 2 / 3, "21:9": 21 / 9, "5:4": 5 / 4, "4:5": 4 / 5,
}

function closestRatio(width?: number, height?: number): Ratio {
  if (!width || !height) return "1:1"
  const target = width / height
  return RATIOS.reduce((best, r) =>
    Math.abs(Math.log(target / RATIO_VALUE[r])) < Math.abs(Math.log(target / RATIO_VALUE[best])) ? r : best,
  )
}

async function handlePost(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.generation)
  if (rateLimited) return rateLimited

  try {
    const form = await request.formData()
    const imageFile = form.get("image")
    const maskFile = form.get("mask")
    const mode = (form.get("mode") as string) || "erase"
    const userPrompt = ((form.get("prompt") as string) || "").trim()

    if (!(imageFile instanceof File) || !(maskFile instanceof File)) {
      return NextResponse.json({ error: "image and mask files are required" }, { status: 400 })
    }
    if (mode === "replace" && !userPrompt) {
      return NextResponse.json({ error: "A description is required to replace the area" }, { status: 400 })
    }

    const instruction =
      mode === "replace"
        ? `In the masked area of this image: ${userPrompt}. Blend it naturally with the surrounding image; keep everything outside the mask identical.`
        : "Remove the content in the masked area and seamlessly fill it with a natural extension of the surrounding background. Keep everything outside the mask identical."

    const sourceBuffer = Buffer.from(await imageFile.arrayBuffer())
    const metadata = await sharp(sourceBuffer).metadata()

    const result = await generateOpenAIImage({
      prompt: instruction,
      aspectRatio: closestRatio(metadata.width, metadata.height),
      imageSize: "2K",
      imageQuality: "auto",
      referenceImageFile: imageFile,
      maskImageFile: maskFile,
    })

    return NextResponse.json({ success: true, image: `data:image/png;base64,${result.imageBase64}` })
  } catch (error) {
    console.error("[Thumbnail Edit] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to edit image" },
      { status: 500 },
    )
  }
}

export const POST = withCreditGuard("thumbnailEdit", flatCost("thumbnailEdit"), handlePost)
