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
 *
 * When a mask is present, two extra passes wrap the OpenAI call:
 *   - hygieneMask grows + feathers the region sent to OpenAI so the model
 *     gets a soft edge to blend into instead of a razor-sharp cutout.
 *   - pixelLockComposite pastes each result back over the ORIGINAL image,
 *     clipped to the user's raw painted region, so pixels outside it come
 *     back unchanged regardless of drift in the model's output.
 *
 * Supports 1-3 variants per request (`variants` form field); every variant
 * is pixel-locked and uploaded independently.
 */

import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import sharp from "sharp"
import { withCreditGuard, editImageCost } from "@/lib/api/guard"
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { generateOpenAIImage } from "@/lib/openai-image-client"
import { closestRatio } from "@/lib/image-aspect"
import { hygieneMask, pixelLockComposite } from "@/lib/edit-mask"

export const runtime = "nodejs"
export const maxDuration = 120

const MAX_VARIANTS = 3

function friendlyErrorMessage(error: unknown): { message: string; status: number } {
  const raw = error instanceof Error ? error.message : "Failed to edit image"
  if (/safety|moderation|content policy/i.test(raw)) {
    return { message: "This edit was blocked by content rules. No credits were used.", status: 400 }
  }
  if (/timeout|timed out/i.test(raw)) {
    return { message: "The edit took too long — try again, or use fewer variants.", status: 400 }
  }
  return { message: raw, status: 500 }
}

async function uploadImage(buffer: Buffer): Promise<string> {
  let imageUrl = `data:image/png;base64,${buffer.toString("base64")}`
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const uploaded = await put(
        `edits/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`,
        buffer,
        { access: "public", contentType: "image/png" },
      )
      imageUrl = uploaded.url
    } catch (error) {
      console.error("[Edit Image] Blob upload failed; falling back to data URI:", error)
    }
  }
  return imageUrl
}

async function handlePost(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.generation)
  if (rateLimited) return rateLimited

  try {
    const form = await request.formData()
    const imageFile = form.get("image")
    const maskFileEntry = form.get("mask")
    const mode = (form.get("mode") as string) || "erase"
    const userPrompt = ((form.get("prompt") as string) || "").trim()
    const variants = Math.min(
      Math.max(Number.parseInt((form.get("variants") as string) || "1", 10) || 1, 1),
      MAX_VARIANTS,
    )

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

    let rawMaskBuffer: Buffer | null = null
    let openAiMaskFile: File | null = null
    if (maskImageFile) {
      rawMaskBuffer = Buffer.from(await maskImageFile.arrayBuffer())
      const hygienedBuffer = await hygieneMask(rawMaskBuffer)
      openAiMaskFile = new File([new Uint8Array(hygienedBuffer)], "mask.png", { type: "image/png" })
    }

    const result = await generateOpenAIImage({
      prompt: instruction,
      aspectRatio: closestRatio(metadata.width, metadata.height),
      imageSize: "2K",
      imageQuality: "auto",
      referenceImageFile: imageFile,
      maskImageFile: openAiMaskFile,
      n: variants,
    })

    // Store results in Blob and return URLs instead of multi-MB data URIs:
    // downstream saves (history, favorites) post the image URL in JSON, and
    // a 2K base64 payload blows Vercel's request-body cap (413). Data-URI
    // fallback keeps local dev (no Blob token) working.
    const finalBuffers = rawMaskBuffer
      ? await Promise.all(
          result.imagesBase64.map((base64) => pixelLockComposite(sourceBuffer, base64, rawMaskBuffer!)),
        )
      : result.imagesBase64.map((base64) => Buffer.from(base64, "base64"))

    const imageUrls = await Promise.all(finalBuffers.map(uploadImage))

    return NextResponse.json({ success: true, image: imageUrls[0], images: imageUrls })
  } catch (error) {
    console.error("[Edit Image] Error:", error)
    const { message, status } = friendlyErrorMessage(error)
    return NextResponse.json({ error: message }, { status })
  }
}

export const POST = withCreditGuard("imageEdit", editImageCost, handlePost)
