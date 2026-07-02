/**
 * API Route: AI Edit (masked inpaint or whole-image edit) for generated images
 *
 * Same masked-inpaint flow as /api/thumbnail-edit for the v2 studio's
 * "AI Edit" action: erase the masked area (fill from the surrounding image)
 * or replace it from a prompt. The mask is optional — the "Edit in chat"
 * flow omits it, in which case `prompt` drives a whole-image edit instead
 * (everything outside the described change should stay unchanged). Uses
 * OpenAI's gpt-image-2 image-edit endpoint; a mask (transparent = edit here)
 * scopes the change when one is provided.
 */

import { type NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { withCreditGuard, flatCost } from "@/lib/api/guard"
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { generateOpenAIImage } from "@/lib/openai-image-client"
import { closestRatio } from "@/lib/image-aspect"

export const runtime = "nodejs"
export const maxDuration = 120

async function handlePost(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.generation)
  if (rateLimited) return rateLimited

  try {
    const form = await request.formData()
    const imageFile = form.get("image")
    const maskFileEntry = form.get("mask")
    const mode = (form.get("mode") as string) || "erase"
    const userPrompt = ((form.get("prompt") as string) || "").trim()

    if (!(imageFile instanceof File)) {
      return NextResponse.json({ error: "An image file is required" }, { status: 400 })
    }

    const maskImageFile: File | null = maskFileEntry instanceof File ? maskFileEntry : null

    if (!maskImageFile && !userPrompt) {
      return NextResponse.json({ error: "A description of the change is required" }, { status: 400 })
    }
    if (maskImageFile && mode === "replace" && !userPrompt) {
      return NextResponse.json({ error: "A description is required to replace the area" }, { status: 400 })
    }

    const instruction = maskImageFile
      ? mode === "replace"
        ? `In the masked area of this image: ${userPrompt}. Blend it naturally with the surrounding image; keep everything outside the mask identical.`
        : "Remove the content in the masked area and seamlessly fill it with a natural extension of the surrounding background. Keep everything outside the mask identical."
      : `Apply this change to the image: ${userPrompt}. Keep everything else unchanged — same composition, style, and level of detail.`

    const sourceBuffer = Buffer.from(await imageFile.arrayBuffer())
    const metadata = await sharp(sourceBuffer).metadata()

    const result = await generateOpenAIImage({
      prompt: instruction,
      aspectRatio: closestRatio(metadata.width, metadata.height),
      imageSize: "2K",
      imageQuality: "auto",
      referenceImageFile: imageFile,
      maskImageFile,
    })

    return NextResponse.json({ success: true, image: `data:image/png;base64,${result.imageBase64}` })
  } catch (error) {
    console.error("[Edit Image] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to edit image" },
      { status: 500 },
    )
  }
}

export const POST = withCreditGuard("imageEdit", flatCost("imageEdit"), handlePost)
