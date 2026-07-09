"use client"

/**
 * MockupLightbox Component
 *
 * Full-screen lightbox for viewing logo mockups in larger detail
 */

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { BusinessCardMockup } from './BusinessCardMockup'
import { LightboxControls, KeyboardHints } from './LightboxControls'
import { LetterheadMockup } from './LetterheadMockup'
import { AppIconMockup } from './AppIconMockup'
import { TShirtMockup } from './TShirtMockup'
import { WebsiteHeaderMockup } from './WebsiteHeaderMockup'
import { SocialBannerMockup } from './SocialBannerMockup'
import { EmailSignatureMockup } from './EmailSignatureMockup'

type MockupType = 'business-card' | 'letterhead' | 'app-icon' | 't-shirt' | 'website-header' | 'social-banner' | 'email-signature'

interface MockupLightboxProps {
  isOpen: boolean
  onClose: () => void
  logoUrl: string
  brandName?: string
  initialMockup?: MockupType
  logoFilter?: React.CSSProperties
}

const MOCKUP_TYPES: { id: MockupType; label: string; icon: string; downloadPrefix: string }[] = [
  { id: 'business-card', label: 'Business Card', icon: '💳', downloadPrefix: 'Business-Card-Mockup' },
  { id: 'letterhead', label: 'Letterhead', icon: '📄', downloadPrefix: 'Letterhead-Mockup' },
  { id: 'app-icon', label: 'App Icon', icon: '📱', downloadPrefix: 'App-Icon-Mockup' },
  { id: 't-shirt', label: 'T-Shirt', icon: '👕', downloadPrefix: 'TShirt-Mockup' },
  { id: 'website-header', label: 'Website', icon: '🌐', downloadPrefix: 'Website-Header-Mockup' },
  { id: 'social-banner', label: 'Social', icon: '📢', downloadPrefix: 'Social-Banner-Mockup' },
  { id: 'email-signature', label: 'Email', icon: '✉️', downloadPrefix: 'Email-Signature-Mockup' },
]

export function MockupLightbox({
  isOpen,
  onClose,
  logoUrl,
  brandName = "Your Brand",
  initialMockup = 'business-card',
  logoFilter,
}: MockupLightboxProps) {
  const [activeMockup, setActiveMockup] = useState<MockupType>(initialMockup)
  const [darkMode, setDarkMode] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1)

  // Reset zoom when changing mockup
  useEffect(() => {
    setZoomLevel(1)
  }, [activeMockup])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') navigateMockup(-1)
      if (e.key === 'ArrowRight') navigateMockup(1)
      if (e.key === '+' || e.key === '=') handleZoom(0.25)
      if (e.key === '-') handleZoom(-0.25)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, activeMockup])

  if (!isOpen) return null

  const navigateMockup = (direction: -1 | 1) => {
    const currentIndex = MOCKUP_TYPES.findIndex(m => m.id === activeMockup)
    const newIndex = (currentIndex + direction + MOCKUP_TYPES.length) % MOCKUP_TYPES.length
    setActiveMockup(MOCKUP_TYPES[newIndex].id)
  }

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + delta)))
  }

  const handleDownload = async () => {
    // Get the current mockup type info for the download filename
    const currentMockup = MOCKUP_TYPES.find(m => m.id === activeMockup)
    const prefix = currentMockup?.downloadPrefix || 'Logo'
    const safeBrandName = brandName.replace(/\s+/g, '-')

    const link = document.createElement('a')
    link.href = logoUrl
    link.download = `${prefix}_${safeBrandName}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/95 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-3 rounded-full bg-zinc-800/80 text-white hover:bg-zinc-700 transition-colors"
        title="Close (Esc)"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Left Navigation Arrow */}
      <button
        onClick={() => navigateMockup(-1)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-zinc-800/80 text-white hover:bg-zinc-700 transition-colors"
        title="Previous mockup"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Right Navigation Arrow */}
      <button
        onClick={() => navigateMockup(1)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-zinc-800/80 text-white hover:bg-zinc-700 transition-colors"
        title="Next mockup"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Main Content Area - Fixed layout with scrollable mockup */}
      <div className="flex flex-col items-center h-full w-full max-w-[90vw] py-4">
        {/* Mockup Type Tabs - Fixed at top */}
        <div className="shrink-0 flex items-center gap-2 bg-zinc-800/60 rounded-full p-1.5 mb-4">
          {MOCKUP_TYPES.map((mockup) => (
            <button
              key={mockup.id}
              onClick={() => setActiveMockup(mockup.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeMockup === mockup.id
                  ? 'bg-linear-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
              }`}
            >
              <span>{mockup.icon}</span>
              <span>{mockup.label}</span>
            </button>
          ))}
        </div>

        {/* Mockup Display Area - Scrollable container with hidden scrollbar */}
        <div
          className="flex-1 min-h-0 w-full mb-4 overflow-auto [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div
            className="min-h-full w-full flex items-center justify-center p-4"
          >
            <div
              className="relative rounded-2xl bg-zinc-900/50 p-8 border border-zinc-700/50 shrink-0"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-out',
                margin: `${(zoomLevel - 1) * 300}px`,
              }}
            >
              {/* Actual Mockup */}
              <div className="min-w-[600px]">
                {activeMockup === 'business-card' && (
                  <div className="w-[500px]">
                    <BusinessCardMockup
                      logoUrl={logoUrl}
                      brandName={brandName}
                      darkMode={darkMode}
                      logoFilter={logoFilter}
                    />
                  </div>
                )}

                {activeMockup === 'letterhead' && (
                  <div className="w-[400px]">
                    <LetterheadMockup
                      logoUrl={logoUrl}
                      brandName={brandName}
                      darkMode={darkMode}
                      logoFilter={logoFilter}
                    />
                  </div>
                )}

                {activeMockup === 'app-icon' && (
                  <div className="w-[400px]">
                    <AppIconMockup logoUrl={logoUrl} brandName={brandName} logoFilter={logoFilter} />
                  </div>
                )}

                {activeMockup === 't-shirt' && (
                  <div className="w-[350px]">
                    <TShirtMockup
                      logoUrl={logoUrl}
                      brandName={brandName}
                      darkMode={darkMode}
                      logoFilter={logoFilter}
                    />
                  </div>
                )}

                {activeMockup === 'website-header' && (
                  <div className="w-[600px]">
                    <WebsiteHeaderMockup
                      logoUrl={logoUrl}
                      brandName={brandName}
                      darkMode={darkMode}
                      logoFilter={logoFilter}
                    />
                  </div>
                )}

                {activeMockup === 'social-banner' && (
                  <div className="w-[550px]">
                    <SocialBannerMockup
                      logoUrl={logoUrl}
                      brandName={brandName}
                      darkMode={darkMode}
                      logoFilter={logoFilter}
                    />
                  </div>
                )}

                {activeMockup === 'email-signature' && (
                  <div className="w-[450px]">
                    <EmailSignatureMockup
                      logoUrl={logoUrl}
                      brandName={brandName}
                      darkMode={darkMode}
                      logoFilter={logoFilter}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Controls Bar - Fixed at bottom */}
        <LightboxControls
          onClose={onClose}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          zoomLevel={zoomLevel}
          onZoomChange={handleZoom}
          onZoomReset={() => setZoomLevel(1)}
          onDownload={handleDownload}
        />

        {/* Keyboard Hints */}
        <KeyboardHints />
      </div>
    </div>
  )
}
