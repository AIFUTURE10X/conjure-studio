import { authorizePopcorn, loadOnlinePolicy } from '@/lib/agent-media/online-runtime'
import { OPENAI_IMAGE_MODEL } from '@/lib/openai-image-client'

export async function GET(request: Request) {
  if (!authorizePopcorn(request)) return Response.json({ error: 'Not found' }, { status: 404 })
  let policy
  try { policy = loadOnlinePolicy() } catch { return Response.json({ configured: false, paidEnabled: false }) }
  return Response.json({ configured: true, paidEnabled: policy.allowPaid, model: OPENAI_IMAGE_MODEL,
    aspectRatios: ['1:1', '4:5', '9:16'], qualities: ['low', 'medium', 'high'],
    dailyLimitMicros: policy.dailyLimitMicros, totalLimitMicros: policy.totalLimitMicros,
    policyExpiresAt: policy.expiresAt, pricingExpiresAt: policy.pricing.expiresAt })
}
