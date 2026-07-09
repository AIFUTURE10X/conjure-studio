/**
 * Credit packs sold via Stripe Checkout (one-time payments, inline
 * price_data — no products to configure in the Stripe dashboard).
 * Tune pricing here; nothing else needs to change.
 */

export interface CreditPack {
  id: string
  name: string
  credits: number
  amountUsdCents: number
  blurb: string
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 200,
    amountUsdCents: 900,
    blurb: 'Around 150–200 images or logo runs',
  },
  {
    id: 'creator',
    name: 'Creator',
    credits: 550,
    amountUsdCents: 1900,
    blurb: 'Best value for regular creators — 15% bonus credits',
  },
  {
    id: 'studio',
    name: 'Studio',
    credits: 1500,
    amountUsdCents: 3900,
    blurb: 'For heavy use: brand projects, mockup batches, 4K work',
  },
]

export function getPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((pack) => pack.id === id)
}
