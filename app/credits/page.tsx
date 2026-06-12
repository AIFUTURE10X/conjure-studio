import { Suspense } from 'react'
import { CreditsPageClient } from './CreditsPageClient'

export const metadata = { title: 'Credits — v0 Prompts Genie' }

// Suspense boundary required because the client page reads useSearchParams.
export default function CreditsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <CreditsPageClient />
    </Suspense>
  )
}
