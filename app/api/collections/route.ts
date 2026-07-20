import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, parseJson, parseParams } from '@/lib/api/http'
import { resolveUserId } from '@/lib/api/identity'
import { numericIdSchema, userIdSchema } from '@/lib/validation/common'

/** Collections CRUD: GET lists with item counts, POST creates, DELETE removes (cascades items). */

function getSQL() {
  const url = process.env.NEON_DATABASE_URL
  if (!url) throw new Error('No database connection string configured')
  return neon(url)
}

const getQuerySchema = z.object({ userId: userIdSchema })
const postBodySchema = z.object({ userId: userIdSchema, name: z.string().min(1).max(120) })
const deleteQuerySchema = z.object({ userId: userIdSchema, id: numericIdSchema })

export async function GET(request: NextRequest) {
  const parsed = parseParams(Object.fromEntries(request.nextUrl.searchParams), getQuerySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    const rows = await sql`
      SELECT c.id, c.name, c.created_at, COUNT(i.id)::int AS item_count,
             (ARRAY_AGG(i.item_url ORDER BY i.created_at DESC) FILTER (WHERE i.item_type = 'image'))[1] AS cover_url
      FROM public.collections c
      LEFT JOIN public.collection_items i ON i.collection_id = c.id
      WHERE c.user_id = ${userId}
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `
    return NextResponse.json({
      collections: rows.map((row) => ({
        id: row.id as number,
        name: row.name as string,
        itemCount: row.item_count as number,
        coverUrl: (row.cover_url as string | null) ?? null,
        createdAt: new Date(row.created_at as string).getTime(),
      })),
    })
  } catch (error) {
    console.error('[collections] GET failed:', error)
    return apiError(500, 'db_error', 'Could not load collections')
  }
}

export async function POST(request: NextRequest) {
  const parsed = await parseJson(request, postBodySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    const rows = await sql`
      INSERT INTO public.collections (user_id, name)
      VALUES (${userId}, ${parsed.data.name.trim()})
      ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name, created_at
    `
    const row = rows[0]
    return NextResponse.json({
      collection: {
        id: row.id as number,
        name: row.name as string,
        itemCount: 0,
        coverUrl: null,
        createdAt: new Date(row.created_at as string).getTime(),
      },
    })
  } catch (error) {
    console.error('[collections] POST failed:', error)
    return apiError(500, 'db_error', 'Could not create collection')
  }
}

export async function DELETE(request: NextRequest) {
  const parsed = parseParams(Object.fromEntries(request.nextUrl.searchParams), deleteQuerySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    await sql`DELETE FROM public.collections WHERE user_id = ${userId} AND id = ${parsed.data.id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[collections] DELETE failed:', error)
    return apiError(500, 'db_error', 'Could not delete collection')
  }
}
