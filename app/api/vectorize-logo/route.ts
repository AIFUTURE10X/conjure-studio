import { type NextRequest, NextResponse } from "next/server"
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { vectorizeLogo, VectorizationMode, removeBackgroundFromSvg } from "@/lib/vectorization"

export async function POST(request: NextRequest) {
  const rateLimited = await enforceRateLimit(request, RATE_LIMITS.transform)
  if (rateLimited) return rateLimited

  try {
    const formData = await request.formData()

    // Get image from form data - either as file or base64 string
    const imageFile = formData.get('image') as File | null
    const imageBase64 = formData.get('imageBase64') as string | null
    const mode = (formData.get('mode') as VectorizationMode) || 'auto'
    const colorCount = parseInt(formData.get('colorCount') as string) || 16
    const removeBackground = formData.get('removeBackground') === 'true'

    console.log("[Vectorize API] Request:", {
      hasFile: !!imageFile,
      hasBase64: !!imageBase64,
      mode,
      colorCount,
      removeBackground
    })

    let imageBuffer: Buffer

    if (imageFile && imageFile.size > 0) {
      // Handle file upload
      const arrayBuffer = await imageFile.arrayBuffer()
      imageBuffer = Buffer.from(arrayBuffer)
    } else if (imageBase64) {
      // Handle base64 input (strip data URL prefix if present)
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
      imageBuffer = Buffer.from(base64Data, 'base64')
    } else {
      return NextResponse.json(
        { error: "Image file or base64 data required" },
        { status: 400 }
      )
    }

    console.log("[Vectorize API] Processing image, size:", imageBuffer.length)

    // Vectorize the logo
    let svgString = await vectorizeLogo(imageBuffer, {
      mode,
      colorCount,
      filterSpeckle: 4,
      pathPrecision: 5,
    })

    console.log("[Vectorize API] SVG generated successfully")

    // Remove background paths if requested (for transparent PNG exports)
    if (removeBackground) {
      console.log("[Vectorize API] Removing background from SVG")
      svgString = removeBackgroundFromSvg(svgString)
    }

    // Return SVG as response
    return new Response(svgString, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': 'attachment; filename="logo.svg"',
      },
    })
  } catch (error) {
    console.error("[Vectorize API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Vectorization failed" },
      { status: 500 }
    )
  }
}
