export type AnalyticsCategoryId = 'image' | 'video' | 'lipsync' | 'enhance' | 'logo'

export interface AnalyticsJob {
  kind: AnalyticsCategoryId
  label: string
  credits: number
  units: number
  timestamp: number
  status: 'completed' | 'pending' | 'failed' | 'refunded'
}

export interface AnalyticsData {
  days: number
  totals: { credits: number; jobs: number; images: number; videos: number }
  categories: Array<{
    id: AnalyticsCategoryId
    label: string
    credits: number
    jobs: number
    units: number
    avgCredits: number
  }>
  daily: Array<{ date: string; image: number; video: number; tools: number }>
  recent: AnalyticsJob[]
  billed: Array<{ reason: string; credits: number }>
}

export const CATEGORY_COLORS: Record<AnalyticsCategoryId, string> = {
  image: 'bg-sky-500',
  video: 'bg-[#dbb56e]',
  lipsync: 'bg-emerald-500',
  enhance: 'bg-emerald-400',
  logo: 'bg-purple-400',
}

export const CATEGORY_BADGES: Record<AnalyticsCategoryId, string> = {
  image: '🖼️ Image',
  video: '🎬 Video',
  lipsync: '🎤 Lip sync',
  enhance: '✨ Enhance',
  logo: '🎨 Logo',
}
