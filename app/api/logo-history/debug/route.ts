import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'

function getSQL() {
  const url = process.env.NEON_DATABASE_URL
  if (!url) throw new Error("No database connection string configured")
  return neon(url)
}

// Admin-only endpoint: cross-user reads/writes below must never be publicly
// reachable. Requires the x-admin-key header to match ADMIN_API_KEY; if the
// env var is unset the endpoint is closed entirely. 404 (not 401) so the
// endpoint's existence isn't advertised.
function requireAdmin(request: NextRequest): NextResponse | null {
  const adminKey = process.env.ADMIN_API_KEY
  if (!adminKey || request.headers.get('x-admin-key') !== adminKey) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return null
}

// GET /api/logo-history/debug - List all logos with user counts (admin only)
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request)
  if (denied) return denied

  try {
    const sql = getSQL()
    // Get count by user
    const userCounts = await sql`
      SELECT user_id, COUNT(*) as count, MAX(created_at) as last_created
      FROM public.logo_history
      GROUP BY user_id
      ORDER BY last_created DESC
    `

    // Get total count
    const totalResult = await sql`SELECT COUNT(*) as total FROM public.logo_history`
    const total = totalResult[0]?.total || 0

    // Get last 10 logos (any user)
    const recentLogos = await sql`
      SELECT id, user_id, prompt, created_at, blob_url
      FROM public.logo_history
      ORDER BY created_at DESC
      LIMIT 10
    `

    return NextResponse.json({
      total,
      userCounts: userCounts.map(u => ({
        userId: u.user_id,
        count: parseInt(u.count),
        lastCreated: u.last_created
      })),
      recentLogos: recentLogos.map(l => ({
        id: l.id,
        userId: l.user_id,
        prompt: l.prompt?.substring(0, 50) + '...',
        createdAt: l.created_at,
        hasBlob: !!l.blob_url
      }))
    })
  } catch (error) {
    console.error('[Debug] Failed:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// POST /api/logo-history/debug - Merge all user IDs into one target user (admin only)
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request)
  if (denied) return denied

  try {
    const { targetUserId } = await request.json()

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId required' }, { status: 400 })
    }

    const sql = getSQL()
    // Get all distinct user IDs
    const users = await sql`
      SELECT DISTINCT user_id FROM public.logo_history WHERE user_id != ${targetUserId}
    `

    const userIdsToMerge = users.map(u => u.user_id)

    if (userIdsToMerge.length === 0) {
      return NextResponse.json({ message: 'No other users to merge', merged: 0 })
    }

    // Update all logos to target user
    const result = await sql`
      UPDATE public.logo_history
      SET user_id = ${targetUserId}
      WHERE user_id != ${targetUserId}
      RETURNING id
    `

    console.log(`[Merge] Merged ${result.length} logos from ${userIdsToMerge.length} users into ${targetUserId}`)

    return NextResponse.json({
      success: true,
      merged: result.length,
      mergedFrom: userIdsToMerge,
      targetUserId
    })
  } catch (error) {
    console.error('[Merge] Failed:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
