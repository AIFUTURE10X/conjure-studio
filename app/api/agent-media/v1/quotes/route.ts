import { authorizePopcorn, onlineService, privateError } from '@/lib/agent-media/online-runtime'

export async function POST(request: Request) {
  if (!authorizePopcorn(request)) return Response.json({ error: 'Not found' }, { status: 404 })
  try { return Response.json(await onlineService().createQuote(await request.json()), { status: 201 }) }
  catch (error) { return privateError(error) }
}
