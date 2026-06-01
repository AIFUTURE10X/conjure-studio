/**
 * API Route: Recolor Logo
 *
 * Uses the app's OpenAI image editing path to recolor a logo with up to 4 colors.
 * The AI understands the logo structure and applies colors appropriately.
 */

import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import sharp from "sharp"
import { generateOpenAIImage } from "@/lib/openai-image-client"

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageUrl, colors, preserveMetallic = true } = body

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 })
    }

    if (!colors || !Array.isArray(colors) || colors.length === 0) {
      return NextResponse.json({ error: "At least one color is required" }, { status: 400 })
    }

    console.log("[Recolor API] Starting recolor with colors:", colors)

    // Build the recolor instruction
    const colorNames = colors.filter(c => c).slice(0, 4)
    let instruction = `Recolor this logo to use ${colorNames.join(", ")}.`

    if (preserveMetallic) {
      instruction += " Maintain the metallic, 3D, and reflective qualities of the original. Keep the same level of detail and shading."
    }

    instruction += " Keep the exact same logo design, shape, and composition."

    console.log("[Recolor API] Instruction:", instruction)

    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch source logo: ${response.status}`)
    }

    const sourceBuffer = Buffer.from(await response.arrayBuffer())
    const metadata = await sharp(sourceBuffer).metadata()
    const referenceFile = new File(
      [new Uint8Array(sourceBuffer)],
      'logo.png',
      { type: response.headers.get('content-type') || 'image/png' }
    )

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
