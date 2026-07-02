import type { NextRequest } from 'next/server'
import { apiError } from './http'
import { getSessionUser } from '@/lib/auth'
import { debitCredits, refundReservation, InsufficientCreditsError } from '@/lib/credits'
import { imageGenerationCost, transformCost, TRANSFORM_COSTS, type TransformOperation } from '@/lib/credits/cost-map'

/**
 * Credit guard for the provider-billed generation/transform routes.
 *
 * SAAS_ENFORCEMENT=on activates it; any other value leaves every route
 * behaving exactly as before (anonymous, uncharged), so the flag can ship
 * ahead of Stripe/auth being configured in production.
 *
 * Reserve→commit: credits are debited before the provider call and refunded
 * when the handler throws or returns a non-2xx response. The refund reuses
 * the reservation key, so a double-failure can't double-refund.
 */

export function isSaasEnforcementOn(): boolean {
  const value = (process.env.SAAS_ENFORCEMENT || '').toLowerCase()
  return value === 'on' || value === 'true' || value === '1'
}

type CostResolver = number | ((request: NextRequest) => Promise<number> | number)

export function withCreditGuard(
  operation: string,
  cost: CostResolver,
  handler: (request: NextRequest) => Promise<Response>,
): (request: NextRequest) => Promise<Response> {
  return async (request: NextRequest) => {
    if (!isSaasEnforcementOn()) return handler(request)

    const user = await getSessionUser(request.headers)
    if (!user) {
      return apiError(401, 'auth_required', 'Sign in to generate — your work and credits live on your account.')
    }

    let amount: number
    try {
      amount = typeof cost === 'function' ? await cost(request) : cost
    } catch (error) {
      console.error(`[guard] cost resolution failed for ${operation}:`, error)
      return apiError(400, 'invalid_request', 'Could not read the request')
    }

    const reservationKey = `op:${operation}:${crypto.randomUUID()}`
    try {
      await debitCredits(user.id, amount, operation, reservationKey)
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        return apiError(
          402,
          'insufficient_credits',
          `This needs ${error.required} credit${error.required === 1 ? '' : 's'} and you have ${error.balance}. Top up from the account menu.`,
        )
      }
      console.error(`[guard] debit failed for ${operation}:`, error)
      return apiError(500, 'internal_error', 'Credit check failed — please try again')
    }

    const refund = () =>
      refundReservation(user.id, amount, reservationKey, `${operation}:refund`).catch((error) =>
        console.error(`[guard] refund failed for ${operation}:`, error),
      )

    let response: Response
    try {
      response = await handler(request)
    } catch (error) {
      await refund()
      throw error
    }

    if (!response.ok && response.status !== 429) await refund()
    return response
  }
}

/** Cost from a generate-image/generate-logo style multipart body (model + size + count). */
export async function imageFormCost(request: NextRequest): Promise<number> {
  const formData = await request.clone().formData()
  const model = (formData.get('model') as string) || ''
  const size = (formData.get('imageSize') as string) || (formData.get('resolution') as string) || '1K'
  const count = Number.parseInt((formData.get('count') as string) || '1', 10) || 1
  return imageGenerationCost(model, size.toUpperCase(), Math.min(Math.max(count, 1), 4))
}

export function flatCost(operation: TransformOperation): number {
  return transformCost(operation)
}

/** Cost for /api/edit-image: base imageEdit cost plus 1 credit per extra variant (n=1-3). */
export async function editImageCost(request: NextRequest): Promise<number> {
  const formData = await request.clone().formData()
  const variants = Number.parseInt((formData.get('variants') as string) || '1', 10) || 1
  const clamped = Math.min(Math.max(variants, 1), 3)
  return TRANSFORM_COSTS.imageEdit + (clamped - 1)
}
