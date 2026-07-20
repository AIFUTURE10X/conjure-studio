import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, parseJson, parseParams } from '@/lib/api/http'
import { resolveUserId } from '@/lib/api/identity'
import { userIdSchema } from '@/lib/validation/common'

/**
 * Prompt library. POST auto-logs a submitted prompt (upsert bumps
 * use_count + last_used_at), PATCH toggles the star, GET lists newest
 * first with starred pinned on top.
 */

function getSQL() {
  const url = process.env.NEON_DATABASE_URL
  if (!url) throw new Error('No database connection string configured')
  return neon(url)
}

const KINDS = ['image', 'video', 'logo'] as const

const getQuerySchema = z.object({ userId: userIdSchema })
const postBodySchema = z.object({
  userId: userIdSchema,
  prompt: z.string().min(1).max(8000),
  kind: z.enum(KINDS).default('image'),
})
const patchBodySchema = z.object({
  userId: userIdSchema,
  id: z.number().int().positive(),
  isStarred: z.boolean(),
})
const deleteQuerySchema = z.object({
  userId: userIdSchema,
  id: z.coerce.number().int().positive(),
})

export async function GET(request: NextRequest) {
  const parsed = parseParams(Object.fromEntries(request.nextUrl.searchParams), getQuerySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    const rows = await sql`
      SELECT id, prompt, kind, is_starred, use_count, last_used_at
      FROM public.saved_prompts
      WHERE user_id = ${userId}
      ORDER BY is_starred DESC, last_used_at DESC
      LIMIT 300
    `
    return NextResponse.json({
      prompts: rows.map((row) => ({
        id: row.id as number,
        prompt: row.prompt as string,
        kind: row.kind as string,
        isStarred: row.is_starred as boolean,
        useCount: row.use_count as number,
        lastUsedAt: new Date(row.last_used_at as string).getTime(),
      })),
    })
  } catch (error) {
    console.error('[prompts] GET failed:', error)
    return apiError(500, 'db_error', 'Could not load prompts')
  }
}

export async function POST(request: NextRequest) {
  const parsed = await parseJson(request, postBodySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    await sql`
      INSERT INTO public.saved_prompts (user_id, prompt, kind)
      VALUES (${userId}, ${parsed.data.prompt}, ${parsed.data.kind})
      ON CONFLICT (user_id, kind, md5(prompt)) DO UPDATE
        SET use_count = saved_prompts.use_count + 1, last_used_at = NOW()
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[prompts] POST failed:', error)
    return apiError(500, 'db_error', 'Could not log prompt')
  }
}

export async function PATCH(request: NextRequest) {
  const parsed = await parseJson(request, patchBodySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    await sql`
      UPDATE public.saved_prompts SET is_starred = ${parsed.data.isStarred}
      WHERE user_id = ${userId} AND id = ${parsed.data.id}
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[prompts] PATCH failed:', error)
    return apiError(500, 'db_error', 'Could not update prompt')
  }
}

export async function DELETE(request: NextRequest) {
  const parsed = parseParams(Object.fromEntries(request.nextUrl.searchParams), deleteQuerySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    await sql`DELETE FROM public.saved_prompts WHERE user_id = ${userId} AND id = ${parsed.data.id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[prompts] DELETE failed:', error)
    return apiError(500, 'db_error', 'Could not delete prompt')
  }
}
