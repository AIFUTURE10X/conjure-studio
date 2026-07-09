import Stripe from 'stripe'

/**
 * Lazy Stripe client — billing routes respond 503 until STRIPE_SECRET_KEY is
 * configured, so the rest of the app never depends on Stripe being set up.
 */

let stripe: Stripe | null | undefined

export function getStripe(): Stripe | null {
  if (stripe !== undefined) return stripe
  const key = process.env.STRIPE_SECRET_KEY
  stripe = key ? new Stripe(key) : null
  return stripe
}

export function getWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET || null
}
