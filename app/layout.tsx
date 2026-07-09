import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Conjure Studio - AI Creative Tools",
  description: "AI-Powered image generation, logo design, mockups, and background removal.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#09090b",
}

// Apply the saved interface zoom before first paint so it stays consistent
// across pages and reloads (especially in the installed standalone app, which
// hides the browser's own zoom controls). See lib/ui-zoom.ts.
const ZOOM_INIT_SCRIPT = `(function(){try{var z=localStorage.getItem('ui-zoom');if(z){var n=parseFloat(z);if(n>0&&n!==1){var r=document.documentElement;r.style.zoom=String(n);r.style.setProperty('--ui-zoom',String(n));}}}catch(e){}})();`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <script dangerouslySetInnerHTML={{ __html: ZOOM_INIT_SCRIPT }} />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
