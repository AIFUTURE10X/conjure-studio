import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, parseJson, parseParams } from '@/lib/api/http'
import { resolveUserId } from '@/lib/api/identity'
import { userIdSchema } from '@/lib/validation/common'

/**
 * Cross-device preset sync (user_presets). The client keeps localStorage as
 * a fast cache; this route is the source of truth. Preset ids are
 * client-generated so upserts are idempotent.
 */

function getSQL() {
  const url = process.env.NEON_DATABASE_URL
  if (!url) throw new Error('No database connection string configured')
  return neon(url)
}

const MAX_PARAMS_JSON_BYTES = 100 * 1024

const presetSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  source: z.string().min(1).max(40),
  createdAt: z.number(),
  params: z.unknown(),
}).refine((p) => JSON.stringify(p.params ?? {}).length <= MAX_PARAMS_JSON_BYTES, {
  message: 'Preset params too large',
})

const getQuerySchema = z.object({ userId: userIdSchema })
const postBodySchema = z.object({
  userId: userIdSchema,
  presets: z.array(presetSchema).min(1).max(100),
})
const patchBodySchema = z.object({
  userId: userIdSchema,
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200).optional(),
  params: z.unknown().optional(),
})
const deleteQuerySchema = z.object({
  userId: userIdSchema,
  id: z.string().min(1).max(100).optional(),
  all: z.enum(['true']).optional(),
})

interface PresetRow {
  id: string
  name: string
  source: string
  params: unknown
  created_at: string
}

function toClientPreset(row: PresetRow) {
  return {
    id: row.id,
    name: row.name,
    source: row.source,
    params: row.params,
    createdAt: new Date(row.created_at).getTime(),
  }
}

export async function GET(request: NextRequest) {
  const parsed = parseParams(Object.fromEntries(request.nextUrl.searchParams), getQuerySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    const rows = await sql`
      SELECT id, name, source, params, created_at FROM public.user_presets
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    ` as PresetRow[]
    return NextResponse.json({ presets: rows.map(toClientPreset) })
  } catch (error) {
    console.error('[presets] GET failed:', error)
    return apiError(500, 'db_error', 'Could not load presets')
  }
}

export async function POST(request: NextRequest) {
  const parsed = await parseJson(request, postBodySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    for (const preset of parsed.data.presets) {
      await sql`
        INSERT INTO public.user_presets (user_id, id, name, source, params, created_at)
        VALUES (${userId}, ${preset.id}, ${preset.name}, ${preset.source},
                ${JSON.stringify(preset.params ?? {})}::jsonb, ${new Date(preset.createdAt).toISOString()})
        ON CONFLICT (user_id, id) DO UPDATE
          SET name = EXCLUDED.name, source = EXCLUDED.source, params = EXCLUDED.params
      `
    }
    return NextResponse.json({ success: true, count: parsed.data.presets.length })
  } catch (error) {
    console.error('[presets] POST failed:', error)
    return apiError(500, 'db_error', 'Could not save preset')
  }
}

export async function PATCH(request: NextRequest) {
  const parsed = await parseJson(request, patchBodySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)
  const { id, name, params } = parsed.data
  if (name === undefined && params === undefined) {
    return apiError(400, 'invalid_request', 'Nothing to update')
  }

  try {
    const sql = getSQL()
    if (name !== undefined) {
      await sql`UPDATE public.user_presets SET name = ${name} WHERE user_id = ${userId} AND id = ${id}`
    }
    if (params !== undefined) {
      await sql`UPDATE public.user_presets SET params = ${JSON.stringify(params)}::jsonb WHERE user_id = ${userId} AND id = ${id}`
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[presets] PATCH failed:', error)
    return apiError(500, 'db_error', 'Could not update preset')
  }
}

export async function DELETE(request: NextRequest) {
  const parsed = parseParams(Object.fromEntries(request.nextUrl.searchParams), deleteQuerySchema)
  if (parsed.response) return parsed.response
  const userId = await resolveUserId(request, parsed.data.userId)

  try {
    const sql = getSQL()
    if (parsed.data.all === 'true') {
      await sql`DELETE FROM public.user_presets WHERE user_id = ${userId}`
    } else if (parsed.data.id) {
      await sql`DELETE FROM public.user_presets WHERE user_id = ${userId} AND id = ${parsed.data.id}`
    } else {
      return apiError(400, 'invalid_request', 'Provide id or all=true')
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[presets] DELETE failed:', error)
    return apiError(500, 'db_error', 'Could not delete preset')
  }
}
