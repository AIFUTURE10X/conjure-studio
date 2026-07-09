import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"
import { z } from "zod"
import { apiError, parseJson, parseParams } from "@/lib/api/http"
import { numericIdSchema } from "@/lib/validation/common"

function getSQL() {
  const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
  if (!url) throw new Error("No database connection string configured")
  return neon(url)
}

const postBodySchema = z.object({
  subjectImageUrl: z.string().max(5000).optional().nullable(),
  sceneImageUrl: z.string().max(5000).optional().nullable(),
  styleImageUrl: z.string().max(5000).optional().nullable(),
  subjectAnalysis: z.string().max(20_000).optional().nullable(),
  sceneAnalysis: z.string().max(20_000).optional().nullable(),
  styleAnalysis: z.string().max(20_000).optional().nullable(),
  main_prompt: z.string().min(1).max(10_000),
  selected_style: z.string().max(200).optional().nullable(),
  aspect_ratio: z.string().max(20).optional().nullable(),
  generated_images: z.array(z.object({
    image_url: z.string().max(5000),
    width: z.number().int().optional().nullable(),
    height: z.number().int().optional().nullable(),
    file_size_mb: z.number().optional().nullable(),
  })).max(10).optional().nullable(),
}).passthrough()

const deleteQuerySchema = z.object({ id: numericIdSchema })

export async function GET() {
  try {
    const sql = getSQL()
    console.log("[v0 API] Fetching image analysis history")

    const history = await sql`
      SELECT 
        id,
        subject_image_url,
        scene_image_url,
        style_image_url,
        subject_analysis,
        scene_analysis,
        style_analysis,
        main_prompt,
        selected_style,
        aspect_ratio,
        created_at
      FROM image_analysis_history
      ORDER BY created_at DESC
      LIMIT 20
    `

    console.log("[v0 API] Found", history.length, "history records")
    
    const historyWithImages = await Promise.all(
      history.map(async (item) => {
        const images = await sql`
          SELECT 
            id,
            image_url,
            aspect_ratio,
            style,
            width,
            height,
            file_size_mb
          FROM generated_images
          WHERE analysis_id = ${item.id}
          ORDER BY created_at
          LIMIT 4
        `
        
        return {
          ...item,
          generated_images: images,
          image_count: images.length
        }
      })
    )

    return NextResponse.json({ success: true, history: historyWithImages })
  } catch (error) {
    console.error("[v0 API] Failed to fetch history:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch history",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const parsed = await parseJson(request, postBodySchema)
  if (parsed.response) return parsed.response
  const {
    subjectImageUrl,
    sceneImageUrl,
    styleImageUrl,
    subjectAnalysis,
    sceneAnalysis,
    styleAnalysis,
    main_prompt,
    selected_style,
    aspect_ratio,
    generated_images,
  } = parsed.data

  try {
    const sql = getSQL()
    const [analysis] = await sql`
      INSERT INTO image_analysis_history (
        subject_image_url,
        scene_image_url,
        style_image_url,
        subject_analysis,
        scene_analysis,
        style_analysis,
        main_prompt,
        selected_style,
        aspect_ratio
      ) VALUES (
        ${subjectImageUrl || null},
        ${sceneImageUrl || null},
        ${styleImageUrl || null},
        ${subjectAnalysis || null},
        ${sceneAnalysis || null},
        ${styleAnalysis || null},
        ${main_prompt},
        ${selected_style || "Realistic"},
        ${aspect_ratio || "1:1"}
      )
      RETURNING id
    `

    console.log("[v0 API] Created analysis history with id:", analysis.id)

    if (generated_images && generated_images.length > 0) {
      console.log("[v0 API] Inserting", generated_images.length, "generated images")
      for (const img of generated_images) {
        await sql`
          INSERT INTO generated_images (
            analysis_id,
            image_url,
            width,
            height,
            file_size_mb
          ) VALUES (
            ${analysis.id},
            ${img.image_url},
            ${img.width || null},
            ${img.height || null},
            ${img.file_size_mb || null}
          )
        `
      }
      console.log("[v0 API] Successfully inserted all images")
    }

    return NextResponse.json({ success: true, analysisId: analysis.id })
  } catch (error) {
    console.error("[v0 API] Failed to save history:", error)
    return apiError(500, 'internal_error', 'Failed to save history')
  }
}

export async function DELETE(request: Request) {
  // A specific id is required — the legacy clear-all path deleted every
  // user's rows from a shared, unscoped table and is intentionally gone.
  const { searchParams } = new URL(request.url)
  const parsed = parseParams(Object.fromEntries(searchParams), deleteQuerySchema)
  if (parsed.response) return parsed.response
  const { id } = parsed.data

  try {
    const sql = getSQL()
    console.log("[v0 API] Deleting history item:", id)
    await sql`DELETE FROM generated_images WHERE analysis_id = ${id}`
    await sql`DELETE FROM image_analysis_history WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0 API] Failed to delete history:", error)
    return apiError(500, 'internal_error', 'Failed to delete history')
  }
}
