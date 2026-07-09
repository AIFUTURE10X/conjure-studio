import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api/http'
import { getStripe, getWebhookSecret } from '@/lib/billing/stripe'
import { grantCredits } from '@/lib/credits'
import { pgPool } from '@/lib/db/pool'

/**
 * POST /api/stripe/webhook — signature-verified Stripe events.
 *
 * checkout.session.completed grants the purchased credits. The ledger
 * idempotency key is the Stripe event id, so webhook retries (or manual
 * replays) can never grant twice.
 */

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const webhookSecret = getWebhookSecret()
  if (!stripe || !webhookSecret) {
    return apiError(503, 'billing_unconfigured', 'Stripe webhook is not configured')
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) return apiError(400, 'invalid_request', 'Missing stripe-signature header')

  const payload = await request.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (error) {
    console.error('[stripe/webhook] signature verification failed:', error)
    return apiError(400, 'invalid_signature', 'Webhook signature verification failed')
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.metadata?.userId
    const packId = session.metadata?.packId
    const credits = Number.parseInt(session.metadata?.credits || '', 10)

    if (!userId || !Number.isFinite(credits) || credits <= 0) {
      console.error('[stripe/webhook] completed session missing metadata:', session.id)
      // 200 so Stripe stops retrying — this event can never succeed.
      return NextResponse.json({ received: true, skipped: 'missing_metadata' })
    }

    try {
      const result = await grantCredits(userId, credits, `purchase:${packId}`, `stripe:${event.id}`, {
        checkoutSessionId: session.id,
        amountTotal: session.amount_total,
        currency: session.currency,
      })

      if (typeof session.customer === 'string') {
        await pgPool
          .query('UPDATE profiles SET stripe_customer_id = $2, updated_at = NOW() WHERE user_id = $1', [
            userId,
            session.customer,
          ])
          .catch((error) => console.error('[stripe/webhook] customer id save failed:', error))
      }

      console.log(
        `[stripe/webhook] ${result.applied ? 'granted' : 'already granted'} ${credits} credits to ${userId} (event ${event.id})`,
      )
    } catch (error) {
      console.error('[stripe/webhook] grant failed:', error)
      // Non-200 so Stripe retries — the idempotency key makes retries safe.
      return apiError(500, 'internal_error', 'Credit grant failed')
    }
  }

  return NextResponse.json({ received: true })
}
