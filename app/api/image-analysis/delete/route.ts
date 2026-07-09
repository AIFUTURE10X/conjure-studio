import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { z } from "zod"
import { apiError, parseParams } from "@/lib/api/http"
import { numericIdSchema } from "@/lib/validation/common"

function getSQL() {
  const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
  if (!url) throw new Error("No database connection string configured")
  return neon(url)
}

const deleteQuerySchema = z.object({ id: numericIdSchema })

export async function DELETE(request: NextRequest) {
  const parsed = parseParams(Object.fromEntries(request.nextUrl.searchParams), deleteQuerySchema)
  if (parsed.response) return parsed.response
  const { id } = parsed.data

  try {
    const sql = getSQL()
    await sql`DELETE FROM image_analysis_history WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting image analysis history:", error)
    return apiError(500, 'internal_error', 'Failed to delete image analysis history')
  }
}
