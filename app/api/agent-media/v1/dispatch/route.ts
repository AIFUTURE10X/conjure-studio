import { authorizeCron, privateError } from '@/lib/agent-media/online-runtime'
import { dispatchNextOnlineWorkflow } from '@/lib/agent-media/online-generation-dispatch'

export const maxDuration = 30

export async function GET(request: Request) {
  if (!authorizeCron(request)) return Response.json({ error: 'Not found' }, { status: 404 })
  try { return Response.json({ dispatched: await dispatchNextOnlineWorkflow() }) }
  catch (error) { return privateError(error) }
}
