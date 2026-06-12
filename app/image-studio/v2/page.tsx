"use client"

/**
 * Studio workspace v2 — parallel route for the unified shell migration.
 *
 * Gated behind NEXT_PUBLIC_STUDIO_V2 (set to "1" or "true"); 404s otherwise.
 * The shell is client-only (ssr disabled) because the resizable layout
 * restores panel sizes from localStorage on mount.
 *
 * This route is deleted when /image-studio swaps to StudioShell.
 */

import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import { StudioProvider } from '../context/StudioProvider'

const STUDIO_V2_ENABLED =
  process.env.NEXT_PUBLIC_STUDIO_V2 === '1' || process.env.NEXT_PUBLIC_STUDIO_V2 === 'true'

const StudioShell = dynamic(
  () => import('../components/Studio/StudioShell').then((m) => m.StudioShell),
  { ssr: false },
)

export default function StudioV2Page() {
  if (!STUDIO_V2_ENABLED) {
    notFound()
  }

  return (
    <StudioProvider>
      <StudioShell />
    </StudioProvider>
  )
}
