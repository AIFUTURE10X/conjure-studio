import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'
import { resolveUserId } from '@/lib/api/identity'
import { getSessionUser } from '@/lib/auth'

/**
 * Temporary diagnostic endpoint.
 *
 * Reports exactly which user id the server resolves for the calling browser
 * (session vs. anonymous client id) and how many rows each history table holds
 * for both the resolved id and the id passed as ?userId=. Lets us tell, in one
 * request, whether "empty history" is an id mismatch, an auth override, or an
 * actual data gap. Returns counts only — no row contents, no secrets.
 */

function getDb() {
  const url = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
  return url ? neon(url) : null
}

type Sql = NonNullable<ReturnType<typeof getDb>>

async function countFor(sql: Sql, table: 'favorites' | 'generation_history' | 'logo_history', userId: string) {
  try {
    let rows
    if (table === 'favorites') {
      rows = await sql`SELECT COUNT(*)::int AS n FROM public.favorites WHERE user_id = ${userId}`
    } else if (table === 'generation_history') {
      rows = await sql`SELECT COUNT(*)::int AS n FROM public.generation_history WHERE user_id = ${userId}`
    } else {
      rows = await sql`SELECT COUNT(*)::int AS n FROM public.logo_history WHERE user_id = ${userId}`
    }
    return rows[0].n as number
  } catch (error) {
    return `error: ${error instanceof Error ? error.message : String(error)}`
  }
}

export async function GET(request: NextRequest) {
  const clientUserId = request.nextUrl.searchParams.get('userId') || ''

  let sessionUserId: string | null = null
  let sessionError: string | null = null
  try {
    const user = await getSessionUser(request.headers)
    sessionUserId = user?.id ?? null
  } catch (error) {
    sessionError = error instanceof Error ? error.message : String(error)
  }

  const resolvedUserId = await resolveUserId(request, clientUserId)

  const sql = getDb()
  const out: Record<string, unknown> = {
    dbConfigured: !!sql,
    neonEnv: !!process.env.NEON_DATABASE_URL,
    databaseUrlEnv: !!process.env.DATABASE_URL,
    clientUserId,
    sessionUserId,
    sessionError,
    resolvedUserId,
    note: 'counts are per user_id; "resolvedUserId" is what the data routes actually query',
  }

  if (sql) {
    const ids = [resolvedUserId, clientUserId].filter((v, i, a) => v && a.indexOf(v) === i)
    const counts: Record<string, unknown> = {}
    for (const id of ids) {
      counts[id] = {
        favorites: await countFor(sql, 'favorites', id),
        generation_history: await countFor(sql, 'generation_history', id),
        logo_history: await countFor(sql, 'logo_history', id),
      }
    }
    out.counts = counts
  }

  return NextResponse.json(out)
}
