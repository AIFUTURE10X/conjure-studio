/**
 * API Route: Recolor Logo
 *
 * Uses the app's OpenAI image editing path to recolor a logo with up to 4 colors.
 * The AI understands the logo structure and applies colors appropriately.
 *
 * Accepts either multipart/form-data with an `image` file (preferred — logos are
 * base64 data URLs client-side and inlining one in JSON overruns the platform
 * request body cap, which comes back as a plain-text 413) or a JSON `imageUrl`.
 */

import { type NextRequest, NextResponse } from "next/server"
import { withCreditGuard, flatCost } from '@/lib/api/guard'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { put } from "@vercel/blob"
import sharp from "sharp"
import { generateOpenAIImage } from "@/lib/openai-image-client"

export const runtime = "nodejs"
export const maxDuration = 300

type RecolorAspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:2" | "2:3" | "21:9" | "5:4" | "4:5"

const ASPECT_RATIOS: Array<{ value: RecolorAspectRatio; ratio: number }> = [
  { value: "1:1", ratio: 1 },
  { value: "16:9", ratio: 16 / 9 },
  { value: "9:16", ratio: 9 / 16 },
  { value: "4:3", ratio: 4 / 3 },
  { value: "3:4", ratio: 3 / 4 },
  { value: "3:2", ratio: 3 / 2 },
  { value: "2:3", ratio: 2 / 3 },
  { value: "21:9", ratio: 21 / 9 },
  { value: "5:4", ratio: 5 / 4 },
  { value: "4:5", ratio: 4 / 5 },
]

function getClosestAspectRatio(width?: number, height?: number): RecolorAspectRatio {
  if (!width || !height) return "1:1"

  const inputRatio = width / height
  return ASPECT_RATIOS.reduce((best, option) => {
    const bestDistance = Math.abs(Math.log(inputRatio / best.ratio))
    const optionDistance = Math.abs(Math.log(inputRatio / option.ratio))
    return optionDistance < bestDistance ? option : best
  }).value
}

interface RecolorSource {
  buffer: Buffer
  contentType: string
  colors: string[]
  preserveMetallic: boolean
}

const asNonEmptyStrings = (values: unknown[]): string[] =>
  values.filter((value): value is string => typeof value === "string" && value.trim().length > 0)

/** Reads the payload from a multipart body (binary image) or the legacy JSON body (`imageUrl`). */
async function readRecolorRequest(request: NextRequest): Promise<RecolorSource | { error: string }> {
  if ((request.headers.get("content-type") || "").includes("multipart/form-data")) {
    const formData = await request.formData()
    const image = formData.get("image")
    const colors = asNonEmptyStrings(formData.getAll("colors"))

    if (!(image instanceof File) || image.size === 0) {
      return { error: "Image file is required" }
    }
    if (colors.length === 0) {
      return { error: "At least one color is required" }
    }

    return {
      buffer: Buffer.from(await image.arrayBuffer()),
      contentType: image.type || "image/png",
      colors,
      preserveMetallic: formData.get("preserveMetallic") !== "false",
    }
  }

  const body = await request.json()
  const { imageUrl, preserveMetallic = true } = body
  const colors = asNonEmptyStrings(Array.isArray(body.colors) ? body.colors : [])

  if (!imageUrl) {
    return { error: "Image URL is required" }
  }
  if (colors.length === 0) {
    return { error: "At least one color is required" }
  }

  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch source logo: ${response.status}`)
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") || "image/png",
    colors,
    preserveMetallic: preserveMetallic !== false,
  }
}

async function handlePost(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.generation)
  if (rateLimited) return rateLimited

  try {
    const source = await readRecolorRequest(request)
    if ("error" in source) {
      return NextResponse.json({ error: source.error }, { status: 400 })
    }

    const { buffer: sourceBuffer, contentType, colors, preserveMetallic } = source

    console.log("[Recolor API] Starting recolor with colors:", colors)

    // Build the recolor instruction
    const colorNames = colors.slice(0, 4)
    let instruction = `Recolor this logo to use ${colorNames.join(", ")}.`

    if (preserveMetallic) {
      instruction += " Maintain the metallic, 3D, and reflective qualities of the original. Keep the same level of detail and shading."
    }

    instruction += " Keep the exact same logo design, shape, and composition."

    console.log("[Recolor API] Instruction:", instruction)

    const metadata = await sharp(sourceBuffer).metadata()
    const referenceFile = new File([new Uint8Array(sourceBuffer)], 'logo.png', { type: contentType })

    const result = await generateOpenAIImage({
      prompt: instruction,
      aspectRatio: getClosestAspectRatio(metadata.width, metadata.height),
      imageSize: '1K',
      imageQuality: 'auto',
      referenceImageFile: referenceFile,
    })

    console.log("[Recolor API] OpenAI image edit completed")

    const buffer = Buffer.from(result.imageBase64, 'base64')
    const filename = `logos/recolor-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.png`

    const blobResult = await put(filename, buffer, {
      access: 'public',
      contentType: 'image/png'
    })

    console.log("[Recolor API] Uploaded to Blob:", blobResult.url)

    return NextResponse.json({
      success: true,
      image: blobResult.url,
      colors: colorNames,
    })

  } catch (error) {
    console.error("[Recolor API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to recolor logo" },
      { status: 500 }
    )
  }
}

export const POST = withCreditGuard('recolor', flatCost('recolor'), handlePost)
