import { authorizePopcorn, onlineService, privateError } from '@/lib/agent-media/online-runtime'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!authorizePopcorn(request)) return Response.json({ error: 'Not found' }, { status: 404 })
  try {
    const { id } = await params
    const operation = await onlineService().readOperation(id)
    return Response.json({
      operationId: operation.id, ownerId: operation.owner_id, campaignId: operation.campaign_id,
      brand: operation.brand, requestDigest: operation.request_digest, state: operation.state,
      assetId: operation.asset_id, reservedMicros: operation.reserved_micros,
      actualMicros: operation.actual_micros, failureCode: operation.failure_code,
      createdAt: operation.created_at, updatedAt: operation.updated_at,
    })
  } catch (error) { return privateError(error) }
}
