/**
 * Finance Schema - Finance/Banking category specific settings
 *
 * Used by presets: finance-growth, finance-shield
 */

import { BaseLogoConfig, DEFAULT_BASE_CONFIG, TabDefinition, BASE_TABS } from './base-schema'
import { ColorOption } from '../dot-matrix-config'

// ============================================
// FINANCE-SPECIFIC TYPES
// ============================================

export type FinanceType = 'banking' | 'investment' | 'insurance' | 'wealth-management' | 'fintech' | 'consulting'
export type TrustElement = 'none' | 'shield' | 'pillar' | 'vault' | 'lock' | 'handshake'
export type GrowthSymbol = 'none' | 'arrow-up' | 'chart' | 'graph' | 'stairs' | 'mountain'
export type InstitutionalStyle = 'traditional' | 'modern' | 'digital' | 'premium' | 'accessible'
export type SecurityLevel = 'standard' | 'secure' | 'fortress' | 'vault-grade'

// ============================================
// FINANCE CONFIG INTERFACE
// ============================================

export interface FinanceLogoConfig extends BaseLogoConfig {
  // Finance-specific settings
  financeType: FinanceType
  trustElement: TrustElement
  growthSymbol: GrowthSymbol
  institutionalStyle: InstitutionalStyle
  securityLevel: SecurityLevel
  primaryFinanceColor: ColorOption
  hasGrowthIndicator: boolean
  hasShieldElement: boolean
  showEstablishedYear: boolean
  establishedYear: string
  hasCoinElement: boolean
}

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_FINANCE_CONFIG: FinanceLogoConfig = {
  ...DEFAULT_BASE_CONFIG,

  // Override base defaults for finance style
  textColor: { name: 'Navy', value: 'navy', hex: '#1E3A5F' },
  accentColor: { name: 'Gold', value: 'gold', hex: '#D4AF37' },
  fontStyle: 'serif-elegant',
  backgroundColor: 'white',
  depthLevel: 'subtle',

  // Finance-specific defaults
  financeType: 'banking',
  trustElement: 'none',
  growthSymbol: 'none',
  institutionalStyle: 'traditional',
  securityLevel: 'secure',
  primaryFinanceColor: { name: 'Navy Blue', value: 'navy', hex: '#1E3A5F' },
  hasGrowthIndicator: false,
  hasShieldElement: false,
  showEstablishedYear: false,
  establishedYear: '',
  hasCoinElement: false,
}

// ============================================
// FINANCE-SPECIFIC OPTIONS
// ============================================

export const FINANCE_TYPE_OPTIONS: Array<{ value: FinanceType; label: string; description: string }> = [
  { value: 'banking', label: 'Banking', description: 'Traditional banking' },
  { value: 'investment', label: 'Investment', description: 'Investment firm' },
  { value: 'insurance', label: 'Insurance', description: 'Insurance company' },
  { value: 'wealth-management', label: 'Wealth Management', description: 'Private wealth' },
  { value: 'fintech', label: 'FinTech', description: 'Financial technology' },
  { value: 'consulting', label: 'Consulting', description: 'Financial advisory' },
]

export const TRUST_ELEMENT_OPTIONS: Array<{ value: TrustElement; label: string; emoji: string; description: string }> = [
  { value: 'none', label: 'None', emoji: '—', description: 'No trust symbol' },
  { value: 'shield', label: 'Shield', emoji: '🛡️', description: 'Protection symbol' },
  { value: 'pillar', label: 'Pillar', emoji: '🏛️', description: 'Stability column' },
  { value: 'vault', label: 'Vault', emoji: '🔐', description: 'Secure vault' },
  { value: 'lock', label: 'Lock', emoji: '🔒', description: 'Security lock' },
  { value: 'handshake', label: 'Handshake', emoji: '🤝', description: 'Partnership trust' },
]

export const GROWTH_SYMBOL_OPTIONS: Array<{ value: GrowthSymbol; label: string; emoji: string; description: string }> = [
  { value: 'none', label: 'None', emoji: '—', description: 'No growth symbol' },
  { value: 'arrow-up', label: 'Arrow Up', emoji: '⬆️', description: 'Upward arrow' },
  { value: 'chart', label: 'Chart', emoji: '📈', description: 'Growth chart' },
  { value: 'graph', label: 'Graph', emoji: '📊', description: 'Bar graph' },
  { value: 'stairs', label: 'Stairs', emoji: '🪜', description: 'Rising stairs' },
  { value: 'mountain', label: 'Mountain', emoji: '⛰️', description: 'Peak achievement' },
]

export const INSTITUTIONAL_STYLE_OPTIONS: Array<{ value: InstitutionalStyle; label: string; description: string }> = [
  { value: 'traditional', label: 'Traditional', description: 'Classic, established' },
  { value: 'modern', label: 'Modern', description: 'Contemporary approach' },
  { value: 'digital', label: 'Digital', description: 'Tech-forward' },
  { value: 'premium', label: 'Premium', description: 'High-end service' },
  { value: 'accessible', label: 'Accessible', description: 'Approachable, friendly' },
]

export const SECURITY_LEVEL_OPTIONS: Array<{ value: SecurityLevel; label: string; description: string }> = [
  { value: 'standard', label: 'Standard', description: 'Professional security' },
  { value: 'secure', label: 'Secure', description: 'Enhanced protection' },
  { value: 'fortress', label: 'Fortress', description: 'Maximum security' },
  { value: 'vault-grade', label: 'Vault Grade', description: 'Bank-level security' },
]

export const FINANCE_COLORS: ColorOption[] = [
  { name: 'Navy Blue', value: 'navy', hex: '#1E3A5F' },
  { name: 'Gold', value: 'gold', hex: '#D4AF37' },
  { name: 'Forest Green', value: 'forest', hex: '#228B22' },
  { name: 'Silver', value: 'silver', hex: '#C0C0C0' },
  { name: 'Deep Teal', value: 'teal', hex: '#008080' },
  { name: 'Burgundy', value: 'burgundy', hex: '#722F37' },
]

// ============================================
// FINANCE TAB DEFINITION
// ============================================

export const FINANCE_CATEGORY_TAB: TabDefinition = {
  id: 'finance-security',
  label: 'Finance',
  icon: 'Shield',
  component: 'FinanceSecurityTab',
}

export const FINANCE_TABS: TabDefinition[] = [
  BASE_TABS[0], // Brand
  FINANCE_CATEGORY_TAB, // Finance Security (category-specific)
  BASE_TABS[1], // Colors
  BASE_TABS[2], // Fonts
  BASE_TABS[3], // Icons
  BASE_TABS[4], // 3D/FX
  BASE_TABS[5], // Advanced
]

// ============================================
// PROMPT BUILDER HELPERS
// ============================================

export function buildFinancePromptSegment(config: FinanceLogoConfig): string {
  const segments: string[] = []

  // Finance type
  const typeMap: Record<FinanceType, string> = {
    'banking': 'banking institution',
    'investment': 'investment firm',
    'insurance': 'insurance company',
    'wealth-management': 'wealth management',
    'fintech': 'financial technology company',
    'consulting': 'financial consulting firm',
  }
  segments.push(typeMap[config.financeType])

  // Institutional style
  const styleMap: Record<InstitutionalStyle, string> = {
    'traditional': 'traditional established',
    'modern': 'modern contemporary',
    'digital': 'digital-first',
    'premium': 'premium exclusive',
    'accessible': 'approachable friendly',
  }
  segments.push(`${styleMap[config.institutionalStyle]} aesthetic`)

  // Trust element
  if (config.trustElement !== 'none') {
    const trustMap: Record<TrustElement, string> = {
      'none': '',
      'shield': 'protective shield symbol',
      'pillar': 'classical pillar of stability',
      'vault': 'secure vault icon',
      'lock': 'security lock element',
      'handshake': 'partnership handshake symbol',
    }
    segments.push(`with ${trustMap[config.trustElement]}`)
  }

  // Growth symbol
  if (config.growthSymbol !== 'none') {
    const growthMap: Record<GrowthSymbol, string> = {
      'none': '',
      'arrow-up': 'upward arrow growth indicator',
      'chart': 'rising chart symbol',
      'graph': 'bar graph element',
      'stairs': 'ascending stairs motif',
      'mountain': 'peak achievement symbol',
    }
    segments.push(`with ${growthMap[config.growthSymbol]}`)
  }

  // Security visual
  if (config.securityLevel !== 'standard') {
    segments.push(`${config.securityLevel} security feel`)
  }

  // Coin element
  if (config.hasCoinElement) {
    segments.push('with coin/currency element')
  }

  // Established year
  if (config.showEstablishedYear && config.establishedYear) {
    segments.push(`established ${config.establishedYear}`)
  }

  return segments.filter(Boolean).join(', ')
}
