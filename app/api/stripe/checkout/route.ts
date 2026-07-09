import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, parseJson } from '@/lib/api/http'
import { getSessionUser } from '@/lib/auth'
import { getStripe } from '@/lib/billing/stripe'
import { getPack, CREDIT_PACKS } from '@/lib/billing/packs'

/**
 * POST /api/stripe/checkout { packId } → { url }
 * One-time Stripe Checkout for a credit pack. The webhook does the granting;
 * this route only creates the session.
 */

const bodySchema = z.object({
  packId: z.enum(CREDIT_PACKS.map((p) => p.id) as [string, ...string[]]),
})

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request.headers)
  if (!user) return apiError(401, 'unauthorized', 'Sign in to buy credits')

  const stripe = getStripe()
  if (!stripe) return apiError(503, 'billing_unconfigured', 'Payments are not configured yet')

  const parsed = await parseJson(request, bodySchema)
  if (parsed.response) return parsed.response
  const pack = getPack(parsed.data.packId)
  if (!pack) return apiError(400, 'invalid_request', 'Unknown credit pack')

  const origin = request.nextUrl.origin

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      customer_creation: 'always',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: pack.amountUsdCents,
            product_data: {
              name: `${pack.name} pack — ${pack.credits} credits`,
              description: pack.blurb,
            },
          },
        },
      ],
      metadata: {
        userId: user.id,
        packId: pack.id,
        credits: String(pack.credits),
      },
      success_url: `${origin}/credits?status=success`,
      cancel_url: `${origin}/credits?status=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[stripe/checkout] failed:', error)
    return apiError(500, 'internal_error', 'Could not start checkout — please try again')
  }
}
