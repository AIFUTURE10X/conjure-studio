"use client"

/**
 * MockupPreview Component
 *
 * Container showing logo on various real-world mockups
 */

import { useState, useEffect, useCallback } from 'react'
import { X, CreditCard, FileText, Smartphone, Sun, Moon, Expand, Package, Globe, Share2, Mail } from 'lucide-react'
import { BusinessCardMockup } from './BusinessCardMockup'
import { LetterheadMockup } from './LetterheadMockup'
import { AppIconMockup } from './AppIconMockup'
import { WebsiteHeaderMockup } from './WebsiteHeaderMockup'
import { SocialBannerMockup } from './SocialBannerMockup'
import { EmailSignatureMockup } from './EmailSignatureMockup'
import { ProductMockupsPanel } from './ProductMockupsPanel'
import { MockupLightbox } from './MockupLightbox'

type MockupTab = 'business-card' | 'letterhead' | 'app-icon' | 'products' | 'website-header' | 'social-banner' | 'email-signature'

interface MockupPreviewProps {
  isOpen: boolean
  onClose: () => void
  logoUrl: string
  brandName?: string
  logoFilter?: React.CSSProperties
}

export function MockupPreview({
  isOpen,
  onClose,
  logoUrl,
  brandName = "Your Brand",
  logoFilter,
}: MockupPreviewProps) {
  const [activeTab, setActiveTab] = useState<MockupTab>('business-card')
  const [darkMode, setDarkMode] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Track logo URL internally to sync changes from child components (e.g., BG removal)
  const [internalLogoUrl, setInternalLogoUrl] = useState(logoUrl)

  // Sync with prop changes (e.g., when parent generates new logo)
  useEffect(() => {
    console.log('[MockupPreview] logoUrl prop changed:', logoUrl)
    setInternalLogoUrl(logoUrl)
  }, [logoUrl])

  // Handler for logo URL changes from children (wraps setter for logging)
  const handleLogoUrlChange = useCallback((newUrl: string) => {
    console.log('[MockupPreview] handleLogoUrlChange called with:', newUrl)
    setInternalLogoUrl(newUrl)
  }, [])

  if (!isOpen) return null

  const tabs: { id: MockupTab; label: string; icon: typeof CreditCard }[] = [
    { id: 'business-card', label: 'Business Card', icon: CreditCard },
    { id: 'letterhead', label: 'Letterhead', icon: FileText },
    { id: 'app-icon', label: 'App Icon', icon: Smartphone },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'website-header', label: 'Website', icon: Globe },
    { id: 'social-banner', label: 'Social', icon: Share2 },
    { id: 'email-signature', label: 'Email', icon: Mail },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-linear-to-r from-blue-500 to-cyan-500">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Mockup Preview</h2>
              <p className="text-xs text-zinc-400">
                See how your logo looks in real-world applications
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Dark/Light Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'bg-zinc-800 text-yellow-400'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 px-4 pt-2 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mockup Content */}
        {activeTab === 'products' ? (
          /* Products: Category-based mockup panel */
          <div className="w-full min-h-[500px]">
            <ProductMockupsPanel
              logoUrl={internalLogoUrl}
              brandName={brandName}
              logoFilter={logoFilter}
              onClose={() => setActiveTab('business-card')}
              onLogoUrlChange={handleLogoUrlChange}
            />
          </div>
        ) : (
          /* Other mockups: With padding and background */
          <div className="px-2 py-2">
            <div
              className={`p-2 rounded-xl ${
                darkMode ? 'bg-zinc-800/50' : 'bg-zinc-700/30'
              }`}
            >
              {activeTab === 'business-card' && (
                <div className="max-w-sm mx-auto">
                  <BusinessCardMockup
                    logoUrl={internalLogoUrl}
                    brandName={brandName}
                    darkMode={darkMode}
                    logoFilter={logoFilter}
                  />
                </div>
              )}

              {activeTab === 'letterhead' && (
                <div className="max-w-[200px] mx-auto">
                  <LetterheadMockup
                    logoUrl={internalLogoUrl}
                    brandName={brandName}
                    darkMode={darkMode}
                    logoFilter={logoFilter}
                  />
                </div>
              )}

              {activeTab === 'app-icon' && (
                <div className="max-w-sm mx-auto">
                  <AppIconMockup logoUrl={internalLogoUrl} brandName={brandName} logoFilter={logoFilter} />
                </div>
              )}

              {activeTab === 'website-header' && (
                <div className="max-w-md mx-auto">
                  <WebsiteHeaderMockup
                    logoUrl={internalLogoUrl}
                    brandName={brandName}
                    darkMode={darkMode}
                    logoFilter={logoFilter}
                  />
                </div>
              )}

              {activeTab === 'social-banner' && (
                <div className="max-w-md mx-auto">
                  <SocialBannerMockup
                    logoUrl={internalLogoUrl}
                    brandName={brandName}
                    darkMode={darkMode}
                    logoFilter={logoFilter}
                  />
                </div>
              )}

              {activeTab === 'email-signature' && (
                <div className="max-w-sm mx-auto">
                  <EmailSignatureMockup
                    logoUrl={internalLogoUrl}
                    brandName={brandName}
                    darkMode={darkMode}
                    logoFilter={logoFilter}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-0.5 border-t border-zinc-800">
          <p className="text-xs text-zinc-500">
            {activeTab === 'products'
              ? 'Drag logo or brand to reposition | Use sidebar controls to customize'
              : 'Select Products tab for interactive mockups with export options'
            }
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLightboxOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-sm transition-all font-medium border border-zinc-700"
            >
              <Expand className="w-4 h-4" />
              View Larger
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <MockupLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        logoUrl={internalLogoUrl}
        brandName={brandName}
        initialMockup={activeTab === 'products' ? 'business-card' : activeTab}
        logoFilter={logoFilter}
      />
    </div>
  )
}
