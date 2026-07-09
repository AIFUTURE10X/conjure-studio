import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api/http'
import { getSessionUser } from '@/lib/auth'
import { getBalance } from '@/lib/credits'

// GET /api/account/credits — the signed-in user's credit balance.
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request.headers)
  if (!user) return apiError(401, 'unauthorized', 'Sign in to see your credits')

  try {
    const balance = await getBalance(user.id)
    return NextResponse.json({ balance })
  } catch (error) {
    console.error('[account/credits] failed:', error)
    return apiError(500, 'internal_error', 'Failed to load credit balance')
  }
}
