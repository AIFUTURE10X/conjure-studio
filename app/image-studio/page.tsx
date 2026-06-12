"use client"

/**
 * Image Studio — unified workspace shell.
 *
 * The shell is client-only (ssr disabled) because the resizable layout
 * restores panel sizes from localStorage on mount. All page state lives in
 * StudioProvider; the shell hosts the AI helper, canvas, and settings rail.
 */

import dynamic from 'next/dynamic'
import { StudioProvider } from './context/StudioProvider'

const StudioShell = dynamic(
  () => import('./components/Studio/StudioShell').then((m) => m.StudioShell),
  { ssr: false },
)

export default function ImageStudioPage() {
  return (
    <StudioProvider>
      <StudioShell />
    </StudioProvider>
  )
}
