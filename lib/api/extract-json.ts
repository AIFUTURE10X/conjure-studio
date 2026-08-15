/**
 * Fence-tolerant JSON extraction for LLM responses: strips markdown fences and
 * grabs the outermost object. Shared by the structured-output routes
 * (generate-script, plan-broll, analyze-photo-pair, plan-photo-video, …).
 */
export function extractJson(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) throw new Error('No JSON object in response')
  return JSON.parse(trimmed.slice(start, end + 1))
}
