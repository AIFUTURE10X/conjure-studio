import type { MetadataRoute } from 'next'

/**
 * Web app manifest. Makes the site installable as a real standalone desktop
 * app (its own window via the taskbar) instead of a bare browser shortcut,
 * and launches straight into the studio.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PromptsGenie — AI Creative Studio',
    short_name: 'PromptsGenie',
    description:
      'AI-powered image generation, logo design, mockups, and background removal.',
    start_url: '/image-studio',
    scope: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#09090b',
    icons: [
      { src: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
      { src: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { src: '/icon-512.png', type: 'image/png', sizes: '512x512' },
      { src: '/apple-icon.png', type: 'image/png', sizes: '180x180' },
    ],
  }
}
