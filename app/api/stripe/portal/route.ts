import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api/http'
import { getSessionUser } from '@/lib/auth'
import { getStripe } from '@/lib/billing/stripe'
import { pgPool } from '@/lib/db/pool'

/**
 * POST /api/stripe/portal → { url }
 * Stripe billing portal (receipts, payment methods) for users who have
 * purchased at least once — the webhook stores their customer id.
 */

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request.headers)
  if (!user) return apiError(401, 'unauthorized', 'Sign in first')

  const stripe = getStripe()
  if (!stripe) return apiError(503, 'billing_unconfigured', 'Payments are not configured yet')

  try {
    const result = await pgPool.query('SELECT stripe_customer_id FROM profiles WHERE user_id = $1', [user.id])
    const customerId: string | null = result.rows[0]?.stripe_customer_id ?? null
    if (!customerId) return apiError(404, 'no_billing_history', 'No purchases yet — buy a credit pack first')

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${request.nextUrl.origin}/credits`,
    })
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[stripe/portal] failed:', error)
    return apiError(500, 'internal_error', 'Could not open the billing portal')
  }
}
