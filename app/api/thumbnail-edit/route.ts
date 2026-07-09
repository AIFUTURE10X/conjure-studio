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
import { closestRatio, exactOpenAISize } from "@/lib/image-aspect"
import { uploadEditImage } from "@/lib/edit-upload"

export const runtime = "nodejs"
export const maxDuration = 120

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
        : "The masked region shows only empty background: the surrounding scenery continues naturally and uninterrupted across it, matching the existing lighting, texture, and perspective. Everything outside the mask is unchanged."

    const sourceBuffer = Buffer.from(await imageFile.arrayBuffer())
    const metadata = await sharp(sourceBuffer).metadata()

    const result = await generateOpenAIImage({
      prompt: instruction,
      aspectRatio: closestRatio(metadata.width, metadata.height),
      // exactSize (below) covers virtually every real photo's aspect ratio;
      // this bucket is only the fallback for the rare case it can't be
      // computed. 2K-at-high made edits several times slower than the
      // generations that produced the thumbnails, so keep the fallback modest.
      imageSize: "1K",
      exactSize: exactOpenAISize(metadata.width, metadata.height),
      imageQuality: "medium",
      referenceImageFile: imageFile,
      maskImageFile: maskFile,
    })

    const imageUrl = await uploadEditImage(Buffer.from(result.imageBase64, "base64"))
    return NextResponse.json({ success: true, image: imageUrl })
  } catch (error) {
    console.error("[Thumbnail Edit] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to edit image" },
      { status: 500 },
    )
  }
}

export const POST = withCreditGuard("thumbnailEdit", flatCost("thumbnailEdit"), handlePost)
