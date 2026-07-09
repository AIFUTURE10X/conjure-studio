import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, parseJson } from '@/lib/api/http'

function getSQL() {
  const url = process.env.NEON_DATABASE_URL
  if (!url) throw new Error("No database connection string configured")
  return neon(url)
}

const postBodySchema = z.object({
  type: z.enum(['generated', 'analysis']),
  imageUrl: z.string().max(5000),
  prompt: z.string().max(10_000).optional().nullable(),
  settings: z.unknown().optional(),
  analysisResults: z.unknown().optional(),
})

export async function POST(req: NextRequest) {
  const parsed = await parseJson(req, postBodySchema)
  if (parsed.response) return parsed.response
  const { type, imageUrl, prompt, settings, analysisResults } = parsed.data

  try {
    const sql = getSQL()
    if (type === 'generated') {
      // Save generated image to database
      await sql`
        INSERT INTO image_analysis_history (
          image_url,
          prompt,
          settings,
          created_at
        ) VALUES (
          ${imageUrl},
          ${prompt},
          ${JSON.stringify(settings)},
          NOW()
        )
      `
    } else if (type === 'analysis') {
      // Save analysis results to database
      await sql`
        INSERT INTO image_analysis_history (
          image_url,
          analysis,
          created_at
        ) VALUES (
          ${imageUrl},
          ${JSON.stringify(analysisResults)},
          NOW()
        )
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save to database:', error)
    return apiError(500, 'internal_error', 'Failed to save to database')
  }
}
