"use client"

import { useState } from 'react'
import type { CSSProperties } from 'react'
import {
  getCreativeDirectionOption,
  type CreativeDirectionState,
} from '../../constants/creative-direction-options'

interface CreativeDirectionPreviewProps {
  creativeDirection: CreativeDirectionState
}

interface PreviewPalette {
  paper: string
  paperAlt: string
  ink: string
  muted: string
  accent: string
  accentAlt: string
  dark: string
  line: string
}

interface PreviewCopy {
  kicker: string
  headline: string
  subtitle: string
  detail: string
  cta: string
}

type PreviewDesignKey = 'poster' | 'collage' | 'editorial' | 'offer'

interface PreviewDesignOption {
  value: PreviewDesignKey
  label: string
}

const PREVIEW_DESIGNS: PreviewDesignOption[] = [
  { value: 'poster', label: 'Poster' },
  { value: 'collage', label: 'Cutout' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'offer', label: 'Offer' },
]

const DEFAULT_PALETTE: PreviewPalette = {
  paper: '#e9ddc8',
  paperAlt: '#d7c5a8',
  ink: '#241911',
  muted: '#7f6b53',
  accent: '#b67532',
  accentAlt: '#e1b464',
  dark: '#1f1915',
  line: 'rgba(84, 63, 42, 0.28)',
}

const PALETTE_MAP: Record<string, PreviewPalette> = {
  'parchment-sepia': DEFAULT_PALETTE,
  'sunset-orange-bronze': {
    paper: '#efc58c',
    paperAlt: '#c86b37',
    ink: '#2d170f',
    muted: '#87502d',
    accent: '#bd5728',
    accentAlt: '#f2b35c',
    dark: '#22120c',
    line: 'rgba(117, 54, 24, 0.28)',
  },
  'black-leather-gold': {
    paper: '#2a211c',
    paperAlt: '#15120f',
    ink: '#f3e7c9',
    muted: '#b9a581',
    accent: '#c99850',
    accentAlt: '#f0d28d',
    dark: '#090807',
    line: 'rgba(222, 180, 99, 0.26)',
  },
  'sand-terracotta': {
    paper: '#e6cfaa',
    paperAlt: '#b7643f',
    ink: '#321c12',
    muted: '#87634b',
    accent: '#a94e2f',
    accentAlt: '#db9c64',
    dark: '#24130e',
    line: 'rgba(143, 79, 51, 0.26)',
  },
  'coffee-brown-cream': {
    paper: '#ead8bd',
    paperAlt: '#916b47',
    ink: '#2c1b12',
    muted: '#7a5b42',
    accent: '#6f4327',
    accentAlt: '#cf9d64',
    dark: '#1d120c',
    line: 'rgba(82, 49, 29, 0.26)',
  },
  'antique-map-tones': {
    paper: '#e4d3ac',
    paperAlt: '#b7a177',
    ink: '#332615',
    muted: '#7c6a48',
    accent: '#93652f',
    accentAlt: '#d3a95f',
    dark: '#21180d',
    line: 'rgba(78, 62, 32, 0.32)',
  },
  'palm-green-warm-beige': {
    paper: '#e2d8b8',
    paperAlt: '#73805a',
    ink: '#1d291a',
    muted: '#667151',
    accent: '#596f3d',
    accentAlt: '#cba767',
    dark: '#121b10',
    line: 'rgba(75, 91, 55, 0.28)',
  },
  'ocean-blue-copper': {
    paper: '#d9d6c0',
    paperAlt: '#436f7c',
    ink: '#13242a',
    muted: '#48626a',
    accent: '#316c80',
    accentAlt: '#bd7645',
    dark: '#0d1a1f',
    line: 'rgba(45, 96, 112, 0.28)',
  },
  'champagne-gold-ivory': {
    paper: '#f1ead9',
    paperAlt: '#d7c18a',
    ink: '#2c2517',
    muted: '#81745a',
    accent: '#b99346',
    accentAlt: '#ebd391',
    dark: '#1f1a11',
    line: 'rgba(163, 132, 70, 0.28)',
  },
}

const COPY_BY_AD_TYPE: Record<string, PreviewCopy> = {
  'product-launch': {
    kicker: 'New Arrival',
    headline: 'Launch Day',
    subtitle: 'Premium release campaign',
    detail: 'Available this week',
    cta: 'Shop Now',
  },
  'limited-time-offer': {
    kicker: 'Limited Offer',
    headline: 'Save Today',
    subtitle: 'Short-run promotional feature',
    detail: 'Ends Sunday',
    cta: 'Claim Offer',
  },
  'event-announcement': {
    kicker: 'Special Event',
    headline: 'Opening Night',
    subtitle: 'Tickets and details inside',
    detail: 'Fri 7PM',
    cta: 'Reserve',
  },
  'restaurant-menu-special': {
    kicker: 'Chef Special',
    headline: 'Dinner Set',
    subtitle: 'Seasonal menu promotion',
    detail: '3 courses',
    cta: 'Book Table',
  },
  'hotel-resort-package': {
    kicker: 'Resort Offer',
    headline: 'Day Pass',
    subtitle: 'All-day escape package',
    detail: '11AM-6PM',
    cta: 'Book Now',
  },
  'real-estate-listing': {
    kicker: 'Featured Home',
    headline: 'Ocean Villa',
    subtitle: 'Private viewings available',
    detail: '4 bed / pool',
    cta: 'Contact Agent',
  },
  'service-promotion': {
    kicker: 'Pro Service',
    headline: 'Book A Slot',
    subtitle: 'Expert service promotion',
    detail: 'Free consult',
    cta: 'Get Quote',
  },
  'brand-awareness-poster': {
    kicker: 'Brand Story',
    headline: 'Made To Last',
    subtitle: 'Awareness campaign visual',
    detail: 'Since 2026',
    cta: 'Learn More',
  },
  'social-media-square-ad': {
    kicker: 'Social Drop',
    headline: 'Fresh Look',
    subtitle: 'Square campaign mockup',
    detail: 'Swipe for more',
    cta: 'Visit Page',
  },
  'story-reel-vertical-ad': {
    kicker: 'Story Promo',
    headline: 'Tap In',
    subtitle: 'Vertical ad treatment',
    detail: 'Today only',
    cta: 'Message Us',
  },
  'print-flyer': {
    kicker: 'Printed Notice',
    headline: 'Local Feature',
    subtitle: 'Flyer-ready information layout',
    detail: 'Details below',
    cta: 'Call Today',
  },
  'luxury-invitation': {
    kicker: 'Private Invite',
    headline: 'An Evening',
    subtitle: 'Premium invitation styling',
    detail: 'RSVP required',
    cta: 'Reserve',
  },
  'recruitment-hiring-ad': {
    kicker: 'Now Hiring',
    headline: 'Join Us',
    subtitle: 'Recruitment campaign layout',
    detail: 'Apply today',
    cta: 'Send CV',
  },
  'course-workshop-promo': {
    kicker: 'Workshop',
    headline: 'Masterclass',
    subtitle: 'Seats open this month',
    detail: '12 seats',
    cta: 'Join Now',
  },
  'membership-offer': {
    kicker: 'Members Only',
    headline: 'Club Access',
    subtitle: 'Exclusive membership offer',
    detail: 'Perks included',
    cta: 'Join Now',
  },
}

const COPY_BY_PRESET: Record<string, PreviewCopy> = {
  'luxury-hotel-escape': {
    kicker: 'Hotel Escape',
    headline: 'Stay Longer',
    subtitle: 'Luxury weekend package',
    detail: 'Suite upgrade',
    cta: 'Book Stay',
  },
  'fine-dining-invitation': {
    kicker: 'Fine Dining',
    headline: 'Table For Two',
    subtitle: 'Chef-led seasonal evening',
    detail: 'Tonight 8PM',
    cta: 'Reserve',
  },
  'boutique-spa-retreat': {
    kicker: 'Spa Retreat',
    headline: 'Reset Day',
    subtitle: 'Calm treatments and private rooms',
    detail: '90 minutes',
    cta: 'Book Spa',
  },
  'premium-real-estate-showcase': {
    kicker: 'Private Listing',
    headline: 'The Residence',
    subtitle: 'Premium property showcase',
    detail: 'View by appointment',
    cta: 'Contact Agent',
  },
  'coffee-house-editorial': {
    kicker: 'Coffee House',
    headline: 'Morning Roast',
    subtitle: 'Editorial cafe campaign',
    detail: 'Fresh daily',
    cta: 'Visit Us',
  },
  'wine-bar-heritage-poster': {
    kicker: 'Wine Bar',
    headline: 'Reserve Cellar',
    subtitle: 'Heritage tasting poster',
    detail: '6 pours',
    cta: 'Book Table',
  },
  'fitness-club-launch': {
    kicker: 'Club Launch',
    headline: 'Train Strong',
    subtitle: 'Opening week membership offer',
    detail: 'Founders rate',
    cta: 'Join Now',
  },
  'fashion-boutique-campaign': {
    kicker: 'Boutique Edit',
    headline: 'New Season',
    subtitle: 'Fashion campaign preview',
    detail: 'Limited pieces',
    cta: 'Shop Edit',
  },
  'adventure-tour-brochure': {
    kicker: 'Adventure Tour',
    headline: 'Explore More',
    subtitle: 'Guided travel brochure',
    detail: '3 day trip',
    cta: 'Reserve Spot',
  },
  'private-members-club-ad': {
    kicker: 'Private Club',
    headline: 'Member Access',
    subtitle: 'Invitation-only offer',
    detail: 'Apply now',
    cta: 'Join List',
  },
  'luxury-beach-club': {
    kicker: 'Beach Club',
    headline: 'Day Pass',
    subtitle: 'All-day beach club and dining',
    detail: '11AM-6PM',
    cta: 'Book Now',
  },
  'torn-paper-travel-ad': {
    kicker: 'Travel Note',
    headline: 'Island Pass',
    subtitle: 'Layered paper travel ad',
    detail: 'Weekend deal',
    cta: 'Message Us',
  },
  'golden-serif-resort': {
    kicker: 'Resort Feature',
    headline: 'Golden Stay',
    subtitle: 'Serif-led premium package',
    detail: 'Pool access',
    cta: 'Book Now',
  },
  'vintage-coastal-flyer': {
    kicker: 'Coastal Flyer',
    headline: 'Harbor Days',
    subtitle: 'Vintage seaside promotion',
    detail: 'Sat-Sun',
    cta: 'Visit',
  },
  'passport-collage-promo': {
    kicker: 'Passport Promo',
    headline: 'Travel Club',
    subtitle: 'Collage-style campaign',
    detail: 'Stamp included',
    cta: 'Claim Pass',
  },
}

const DEFAULT_COPY: PreviewCopy = {
  kicker: 'Creative Ad',
  headline: 'Campaign',
  subtitle: 'Live direction preview',
  detail: 'Instant mockup',
  cta: 'Call To Action',
}

const FONT_STYLE_MAP: Record<string, CSSProperties> = {
  'luxury-serif-headline': { fontFamily: 'Georgia, Times New Roman, serif', letterSpacing: '0.04em' },
  'didot-bodoni': { fontFamily: 'Didot, Bodoni 72, Georgia, serif', fontWeight: 500, letterSpacing: '0.05em' },
  'vintage-engraved-serif': { fontFamily: 'Georgia, Times New Roman, serif', letterSpacing: '0.03em' },
  'tall-editorial-serif': { fontFamily: 'Georgia, Times New Roman, serif', fontStretch: 'condensed', letterSpacing: '0.08em' },
  'condensed-resort-sans': { fontFamily: 'Arial Narrow, Arial, sans-serif', letterSpacing: '0.08em' },
  'handwritten-script-accent': { fontFamily: 'Brush Script MT, Segoe Script, cursive', fontWeight: 500 },
  'typewriter-small-text': { fontFamily: 'Courier New, monospace', letterSpacing: '0.02em' },
  'passport-stamp-lettering': { fontFamily: 'Courier New, monospace', textTransform: 'uppercase', letterSpacing: '0.12em' },
  'art-deco-display': { fontFamily: 'Trebuchet MS, Arial, sans-serif', letterSpacing: '0.14em' },
  'restaurant-menu-type': { fontFamily: 'Georgia, Times New Roman, serif', letterSpacing: '0.02em' },
}

const DETAIL_LABELS: Record<string, string> = {
  'hero-headline-only': 'Headline',
  'headline-subtitle': 'Subtitle',
  'feature-badges': 'Badges',
  'price-offer-focused': 'Offer',
  'contact-card-footer': 'Contact',
  'event-details-block': 'Event',
  'menu-list-layout': 'Menu',
  'before-after-layout': 'Before / After',
  'testimonial-quote-layout': 'Quote',
  'map-location-focused': 'Map',
}

const DECORATIVE_BADGES: Record<string, string> = {
  'passport-stamp': 'STAMP',
  'compass-rose': 'N/E',
  'palm-icon': 'PALM',
  'sun-waves-icon': 'SUN',
  'map-pin': 'PIN',
  'flight-ticket-strip': 'TKT',
  'postmark-lines': 'POST',
  'hand-drawn-coastline': 'COAST',
  'navigation-lines': 'NAV',
  'wax-seal': 'SEAL',
  'menu-icon-badges': 'MENU',
  'contact-card-panel': 'INFO',
}

const getPreviewCopy = (creativeDirection: CreativeDirectionState): PreviewCopy => {
  return COPY_BY_PRESET[creativeDirection.adPreset] ||
    COPY_BY_AD_TYPE[creativeDirection.adType] ||
    DEFAULT_COPY
}

const getHeadlineStyle = (creativeDirection: CreativeDirectionState, palette: PreviewPalette): CSSProperties => {
  const baseStyle: CSSProperties = {
    ...FONT_STYLE_MAP[creativeDirection.typographyStyle],
    color: palette.ink,
    textShadow: '0 1px 0 rgba(255,255,255,0.2)',
  }

  const fillStyles: Record<string, CSSProperties> = {
    'antique-gold-foil': {
      color: palette.accentAlt,
      background: `linear-gradient(135deg, ${palette.accentAlt}, ${palette.accent}, #6b3f1c)`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    'burnished-bronze': { color: '#a7652c', textShadow: '0 1px 0 #f1c987, 0 3px 6px rgba(44, 24, 10, 0.35)' },
    'copper-metallic': { color: '#b86638', textShadow: '0 1px 0 #f2bb88, 0 3px 6px rgba(64, 30, 15, 0.3)' },
    'brown-leather-texture': { color: '#6c3f25', textShadow: '0 1px 0 rgba(255,255,255,0.18), 0 2px 5px rgba(35,18,10,0.42)' },
    'carved-wood-inlay': { color: '#835126', textShadow: '1px 1px 0 #d2a066, -1px -1px 0 rgba(55,27,9,0.35)' },
    'embossed-ink': { color: palette.ink, textShadow: '0 -1px 0 rgba(255,255,255,0.34), 0 2px 0 rgba(0,0,0,0.28)' },
    'debossed-paper': { color: palette.muted, textShadow: '0 1px 0 rgba(255,255,255,0.55), 0 -1px 0 rgba(0,0,0,0.22)' },
    'aged-gold-leaf': { color: '#c39b4c', textShadow: '0 1px 0 #f5d98d, 0 4px 8px rgba(52,33,8,0.28)' },
    'dark-espresso-fill': { color: '#2a170e', textShadow: '0 1px 0 rgba(255,255,255,0.16), 0 4px 8px rgba(0,0,0,0.24)' },
    'sunlit-orange-gradient': {
      color: '#d56f22',
      background: 'linear-gradient(135deg, #ffe1a0, #dc772d, #93401d)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
  }

  const dimensionalStyles: Record<string, CSSProperties> = {
    debossed: { textShadow: '0 1px 0 rgba(255,255,255,0.45), 0 -2px 1px rgba(0,0,0,0.26)' },
    embossed: { textShadow: '-1px -1px 0 rgba(255,255,255,0.58), 0 2px 0 rgba(0,0,0,0.3), 0 7px 12px rgba(0,0,0,0.18)' },
    engraved: { textShadow: '0 1px 0 rgba(255,255,255,0.42), 1px 0 0 rgba(0,0,0,0.28)' },
    letterpress: { textShadow: '0 2px 0 rgba(255,255,255,0.5), 0 -1px 1px rgba(0,0,0,0.35)' },
    chiseled: { textShadow: '2px 2px 0 rgba(0,0,0,0.24), -1px -1px 0 rgba(255,255,255,0.38)' },
  }

  const visualStyles: Record<string, CSSProperties> = {
    beveled: { textShadow: '-1px -1px 0 rgba(255,255,255,0.46), 2px 2px 0 rgba(0,0,0,0.24)' },
    '3d-extruded': { textShadow: '1px 1px 0 #8f5b2a, 2px 2px 0 #76451f, 4px 5px 8px rgba(0,0,0,0.28)' },
    'drop-shadow': { textShadow: '0 6px 0 rgba(0,0,0,0.22), 0 10px 12px rgba(0,0,0,0.2)' },
    skeuomorphic: { textShadow: '0 1px 0 rgba(255,255,255,0.5), 0 4px 8px rgba(0,0,0,0.28)' },
  }

  const textOutlineStyles: Record<string, CSSProperties> = {
    'thin-gold-outline': {
      WebkitTextStrokeWidth: '0.7px',
      WebkitTextStrokeColor: '#d8ad55',
      filter: 'drop-shadow(0 3px 5px rgba(49, 28, 9, 0.22))',
    },
    'double-gold-outline': {
      WebkitTextStrokeWidth: '0.85px',
      WebkitTextStrokeColor: '#f0c66a',
      filter: 'drop-shadow(1px 0 0 #7b4a1c) drop-shadow(-1px 0 0 #7b4a1c) drop-shadow(0 1px 0 #7b4a1c) drop-shadow(0 -1px 0 #7b4a1c) drop-shadow(0 5px 8px rgba(49, 28, 9, 0.28))',
    },
    'gold-rim-dark-keyline': {
      WebkitTextStrokeWidth: '1.1px',
      WebkitTextStrokeColor: '#c99850',
      filter: 'drop-shadow(1px 0 0 #2a170e) drop-shadow(-1px 0 0 #2a170e) drop-shadow(0 1px 0 #2a170e) drop-shadow(0 6px 8px rgba(37, 18, 6, 0.32))',
    },
    'antique-brass-outline': {
      WebkitTextStrokeWidth: '0.9px',
      WebkitTextStrokeColor: '#a87835',
      filter: 'drop-shadow(0 4px 7px rgba(52, 31, 12, 0.28))',
    },
    'copper-outline': {
      WebkitTextStrokeWidth: '0.9px',
      WebkitTextStrokeColor: '#c26a36',
      filter: 'drop-shadow(0 4px 7px rgba(76, 31, 11, 0.26))',
    },
    'ivory-highlight-rim': {
      WebkitTextStrokeWidth: '0.75px',
      WebkitTextStrokeColor: '#f3e4bf',
      filter: 'drop-shadow(0 4px 7px rgba(40, 23, 9, 0.22))',
    },
    'dark-engraved-outline': {
      WebkitTextStrokeWidth: '0.85px',
      WebkitTextStrokeColor: '#231408',
      filter: 'drop-shadow(0 2px 0 rgba(255, 236, 196, 0.24))',
    },
    'raised-foil-edge': {
      WebkitTextStrokeWidth: '1px',
      WebkitTextStrokeColor: '#e3bd66',
      filter: 'drop-shadow(0 -1px 0 rgba(255, 237, 182, 0.72)) drop-shadow(0 5px 8px rgba(54, 31, 8, 0.3))',
    },
    'shadowed-bevel-outline': {
      WebkitTextStrokeWidth: '0.95px',
      WebkitTextStrokeColor: '#b98a42',
      filter: 'drop-shadow(-1px -1px 0 rgba(255, 236, 185, 0.52)) drop-shadow(2px 3px 0 rgba(45, 24, 7, 0.3)) drop-shadow(0 7px 10px rgba(45, 24, 7, 0.2))',
    },
    'inset-inner-stroke': {
      WebkitTextStrokeWidth: '0.7px',
      WebkitTextStrokeColor: '#4b2a12',
      filter: 'drop-shadow(0 -1px 0 rgba(255, 232, 178, 0.5)) drop-shadow(0 4px 7px rgba(45, 24, 7, 0.22))',
    },
  }

  return {
    ...baseStyle,
    ...fillStyles[creativeDirection.fontFill],
    ...dimensionalStyles[creativeDirection.dimensionalStyle],
    ...visualStyles[creativeDirection.visualEffectStyle],
    ...textOutlineStyles[creativeDirection.textOutlineStyle],
  }
}

const getTextureOpacity = (textureStrength: string): number => {
  if (textureStrength === 'clean' || textureStrength === 'premium-polished-ad') return 0.04
  if (textureStrength === 'light-texture') return 0.1
  if (textureStrength === 'medium-vintage-texture') return 0.18
  if (textureStrength === 'heavy-distressed-texture' || textureStrength === 'rough-handmade-paper') return 0.28
  return 0.12
}

const getPaperFrameStyle = (paperEffect: string, palette: PreviewPalette): CSSProperties => {
  const base: CSSProperties = {
    borderColor: palette.line,
    boxShadow: '0 22px 45px rgba(0, 0, 0, 0.28)',
  }

  if (paperEffect === 'torn-paper-edge') {
    return {
      ...base,
      clipPath: 'polygon(0 2%, 8% 0, 16% 3%, 26% 1%, 39% 4%, 52% 1%, 63% 3%, 76% 0, 88% 3%, 100% 1%, 100% 98%, 88% 100%, 74% 97%, 61% 100%, 48% 98%, 35% 100%, 20% 97%, 8% 100%, 0 98%)',
    }
  }

  if (paperEffect === 'deckled-handmade-edge') {
    return { ...base, borderStyle: 'dashed', borderWidth: 2 }
  }

  if (paperEffect === 'burnt-paper-edge') {
    return { ...base, boxShadow: `inset 0 0 34px ${palette.dark}, 0 22px 45px rgba(0, 0, 0, 0.3)` }
  }

  if (paperEffect === 'layered-paper-shadow') {
    return { ...base, transform: 'rotate(-0.6deg)' }
  }

  return base
}

const BackgroundScene = ({
  backgroundScenery,
  palette,
}: {
  backgroundScenery: string
  palette: PreviewPalette
}) => {
  const showOcean = backgroundScenery === 'sunset-ocean-scene' || backgroundScenery === 'tropical-palm-shadows'
  const showMap = [
    'vintage-travel-map',
    'topographic-contour-lines',
    'compass-navigation-elements',
    'passport-stamp-background',
  ].includes(backgroundScenery)
  const showLeather = backgroundScenery === 'leather-passport-cover'
  const showSand = backgroundScenery === 'beach-sand-texture'

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: showLeather
            ? `linear-gradient(135deg, ${palette.dark}, ${palette.paperAlt})`
            : `linear-gradient(135deg, ${palette.paper}, ${palette.paperAlt})`,
        }}
      />

      {showOcean && (
        <>
          <div className="absolute right-5 top-5 h-20 w-20 rounded-full opacity-80" style={{ background: palette.accent }} />
          <div className="absolute bottom-24 right-0 h-14 w-40 rounded-l-full opacity-45" style={{ background: palette.accentAlt }} />
          <div className="absolute bottom-20 right-5 h-px w-32" style={{ background: palette.line }} />
          <div className="absolute bottom-16 right-9 h-px w-24" style={{ background: palette.line }} />
        </>
      )}

      {showMap && (
        <>
          <div className="absolute -right-12 top-12 h-44 w-44 rounded-full border opacity-45" style={{ borderColor: palette.line }} />
          <div className="absolute -right-5 top-20 h-32 w-32 rounded-full border opacity-35" style={{ borderColor: palette.line }} />
          <div className="absolute left-5 top-7 h-20 w-20 rotate-12 rounded-full border border-dashed opacity-35" style={{ borderColor: palette.muted }} />
          <div className="absolute bottom-12 right-8 h-14 w-20 rounded-[45%] border opacity-35" style={{ borderColor: palette.line }} />
        </>
      )}

      {showSand && (
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage: `radial-gradient(${palette.line} 1px, transparent 1px)`,
            backgroundSize: '10px 10px',
          }}
        />
      )}

      {backgroundScenery === 'layered-paper-cutout' && (
        <>
          <div className="absolute -left-8 top-16 h-24 w-[120%] -rotate-3" style={{ background: palette.paper, boxShadow: '0 8px 16px rgba(0,0,0,0.16)' }} />
          <div className="absolute -left-10 bottom-20 h-20 w-[120%] rotate-2" style={{ background: palette.paperAlt, opacity: 0.7 }} />
        </>
      )}

      {backgroundScenery === 'aged-postcard-paper' && (
        <div className="absolute inset-5 rounded border border-dashed opacity-35" style={{ borderColor: palette.muted }} />
      )}

      {backgroundScenery === 'torn-parchment-paper' && (
        <div className="absolute left-0 top-16 h-20 w-full -rotate-2 opacity-75" style={{ background: palette.paper, boxShadow: '0 8px 16px rgba(0,0,0,0.12)' }} />
      )}
    </div>
  )
}

const PaperDetails = ({
  paperEffect,
  palette,
}: {
  paperEffect: string
  palette: PreviewPalette
}) => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      {paperEffect === 'folded-paper-crease' && (
        <div className="absolute inset-y-0 left-1/2 w-px rotate-12 opacity-30" style={{ background: palette.muted }} />
      )}
      {paperEffect === 'ripped-collage-strip' && (
        <div className="absolute -left-4 top-20 h-12 w-[120%] -rotate-3 opacity-85" style={{ background: palette.paperAlt, boxShadow: '0 8px 16px rgba(0,0,0,0.14)' }} />
      )}
      {paperEffect === 'cutout-window-reveal' && (
        <div className="absolute right-7 top-8 h-20 w-20 rounded-full border-[10px] opacity-75" style={{ borderColor: palette.paper, background: palette.accent }} />
      )}
      {paperEffect === 'taped-photo-corners' && (
        <>
          <div className="absolute left-4 top-4 h-5 w-12 -rotate-12 opacity-55" style={{ background: palette.accentAlt }} />
          <div className="absolute right-4 top-4 h-5 w-12 rotate-12 opacity-55" style={{ background: palette.accentAlt }} />
        </>
      )}
      {paperEffect === 'stamped-ink-marks' && (
        <div className="absolute left-5 bottom-24 h-20 w-20 rotate-12 rounded-full border-2 border-dashed opacity-35" style={{ borderColor: palette.muted }} />
      )}
      {paperEffect === 'weathered-travel-journal' && (
        <div className="absolute bottom-0 left-0 h-16 w-full opacity-85" style={{ background: palette.dark }} />
      )}
    </div>
  )
}

const LayoutDetails = ({
  creativeDirection,
  copy,
  palette,
}: {
  creativeDirection: CreativeDirectionState
  copy: PreviewCopy
  palette: PreviewPalette
}) => {
  const layout = creativeDirection.informationLayout
  const ctaLabel = getCreativeDirectionOption(creativeDirection.ctaStyle)?.label || copy.cta

  if (layout === 'hero-headline-only') return null

  if (layout === 'before-after-layout') {
    return (
      <div className="grid grid-cols-2 gap-2 text-xs font-semibold uppercase tracking-wide">
        <div className="rounded border px-2 py-2" style={{ borderColor: palette.line, color: palette.ink }}>Before</div>
        <div className="rounded border px-2 py-2" style={{ borderColor: palette.line, color: palette.ink }}>After</div>
      </div>
    )
  }

  if (layout === 'menu-list-layout') {
    return (
      <div className="space-y-1.5 text-xs" style={{ color: palette.ink }}>
        {['Signature Set', 'Seasonal Feature', 'House Special'].map((item) => (
          <div key={item} className="flex items-center justify-between gap-2 border-b pb-1" style={{ borderColor: palette.line }}>
            <span>{item}</span>
            <span style={{ color: palette.accent }}>$--</span>
          </div>
        ))}
      </div>
    )
  }

  if (layout === 'testimonial-quote-layout') {
    return (
      <div className="rounded-md border px-3 py-2 text-xs italic" style={{ borderColor: palette.line, color: palette.ink }}>
        "Premium, polished, and ready to book."
      </div>
    )
  }

  if (layout === 'map-location-focused') {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-xs" style={{ borderColor: palette.line, color: palette.ink }}>
        <span>Location map</span>
        <span className="h-6 w-6 rounded-full border" style={{ borderColor: palette.accent, background: palette.accent }} />
      </div>
    )
  }

  if (layout === 'contact-card-footer') {
    return (
      <div className="rounded-lg px-4 py-3 text-xs" style={{ background: palette.dark, color: palette.paper }}>
        <div className="flex items-center justify-between gap-2">
          <span>{ctaLabel}</span>
          <span>+66 00 000 0000</span>
        </div>
      </div>
    )
  }

  const badgeLabels = layout === 'price-offer-focused'
    ? ['Offer', copy.detail, ctaLabel]
    : layout === 'event-details-block'
      ? ['Date', copy.detail, ctaLabel]
      : layout === 'feature-badges'
        ? ['Feature', copy.detail, ctaLabel]
        : [copy.detail, ctaLabel]

  return (
    <div className="flex flex-wrap gap-1.5">
      {badgeLabels.map((label) => (
        <span
          key={label}
          className="rounded border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide"
          style={{ borderColor: palette.line, color: palette.ink, background: 'rgba(255,255,255,0.16)' }}
        >
          {label}
        </span>
      ))}
    </div>
  )
}

const DecorationLayer = ({
  creativeDirection,
  palette,
}: {
  creativeDirection: CreativeDirectionState
  palette: PreviewPalette
}) => {
  const visibleElements = creativeDirection.decorativeElements.slice(0, 3)
  const extraCount = Math.max(creativeDirection.decorativeElements.length - visibleElements.length, 0)

  if (visibleElements.length === 0) {
    return (
      <div className="absolute right-5 top-[48%] h-12 w-12 rounded-full border opacity-30" style={{ borderColor: palette.muted }}>
        <div className="absolute inset-3 rounded-full border" style={{ borderColor: palette.muted }} />
      </div>
    )
  }

  return (
    <div className="absolute right-5 top-[46%] flex max-w-[62%] flex-wrap justify-end gap-2">
      {visibleElements.map((value) => (
        <span
          key={value}
          className="rounded-full border px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wide"
          style={{ borderColor: palette.line, color: palette.ink, background: `${palette.paper}cc` }}
        >
          {DECORATIVE_BADGES[value] || getCreativeDirectionOption(value)?.label || value}
        </span>
      ))}
      {extraCount > 0 && (
        <span
          className="rounded-full px-2.5 py-1.5 text-[9px] font-bold"
          style={{ color: palette.paper, background: palette.dark }}
        >
          +{extraCount}
        </span>
      )}
    </div>
  )
}

const PreviewDesignThumbnail = ({
  design,
  selected,
  palette,
  onSelect,
}: {
  design: PreviewDesignOption
  selected: boolean
  palette: PreviewPalette
  onSelect: () => void
}) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group rounded-lg border p-1.5 text-left transition-colors ${
        selected
          ? 'border-[#c99850] bg-[#c99850]/10'
          : 'border-zinc-800 bg-zinc-950/70 hover:border-[#c99850]/60'
      }`}
    >
      <span
        className="relative block aspect-[4/3] overflow-hidden rounded-md border"
        style={{ borderColor: selected ? palette.accent : 'rgba(113, 113, 122, 0.45)', background: palette.paper }}
      >
        <span
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage: `radial-gradient(${palette.line} 1px, transparent 1px)`,
            backgroundSize: '6px 6px',
          }}
        />
        {design.value === 'poster' && (
          <>
            <span className="absolute left-2 top-2 h-2 w-9 rounded-full" style={{ background: palette.line }} />
            <span className="absolute left-2 top-5 h-2.5 w-12 rounded-sm" style={{ background: palette.ink }} />
            <span className="absolute left-2 bottom-2 h-2 w-11 rounded-full" style={{ background: palette.accent }} />
          </>
        )}
        {design.value === 'collage' && (
          <>
            <span className="absolute -left-2 top-2 h-7 w-[120%] -rotate-6" style={{ background: palette.paperAlt }} />
            <span className="absolute right-2 top-2 h-7 w-7 rounded-full" style={{ background: palette.accent }} />
            <span className="absolute left-3 bottom-3 h-2.5 w-14 rounded-sm" style={{ background: palette.ink }} />
          </>
        )}
        {design.value === 'editorial' && (
          <>
            <span className="absolute inset-y-0 left-0 w-[42%]" style={{ background: palette.paperAlt }} />
            <span className="absolute left-2 top-3 h-8 w-8 rounded-full" style={{ background: palette.accent }} />
            <span className="absolute right-2 top-3 h-2.5 w-10 rounded-sm" style={{ background: palette.ink }} />
            <span className="absolute right-2 bottom-3 h-2 w-12 rounded-full" style={{ background: palette.line }} />
          </>
        )}
        {design.value === 'offer' && (
          <>
            <span className="absolute inset-x-2 top-2 h-5 rounded-md" style={{ background: palette.dark }} />
            <span className="absolute left-3 top-8 h-2.5 w-12 rounded-sm" style={{ background: palette.ink }} />
            <span className="absolute bottom-2 right-2 h-5 w-12 rounded-full" style={{ background: palette.accent }} />
          </>
        )}
      </span>
      <span className={`mt-1 block truncate text-center text-[10px] font-semibold ${selected ? 'text-[#c99850]' : 'text-zinc-500'}`}>
        {design.label}
      </span>
    </button>
  )
}

const PreviewDesignOverlay = ({
  designKey,
  palette,
}: {
  designKey: PreviewDesignKey
  palette: PreviewPalette
}) => {
  if (designKey === 'poster') return null

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      {designKey === 'collage' && (
        <>
          <div className="absolute -left-8 top-14 h-16 w-[120%] -rotate-3 opacity-80" style={{ background: palette.paper, boxShadow: '0 8px 18px rgba(0,0,0,0.16)' }} />
          <div className="absolute -right-8 top-4 h-24 w-24 rounded-full opacity-70" style={{ background: palette.accent }} />
          <div className="absolute left-5 bottom-24 h-14 w-24 rotate-6 rounded-lg border opacity-45" style={{ borderColor: palette.line }} />
        </>
      )}
      {designKey === 'editorial' && (
        <>
          <div className="absolute inset-y-0 left-0 w-[34%] opacity-70" style={{ background: palette.paperAlt }} />
          <div className="absolute left-6 top-8 h-20 w-20 rounded-full opacity-80" style={{ background: palette.accent }} />
          <div className="absolute right-7 top-7 h-24 w-24 rounded-full border opacity-35" style={{ borderColor: palette.line }} />
        </>
      )}
      {designKey === 'offer' && (
        <>
          <div className="absolute inset-x-0 top-0 h-20 opacity-90" style={{ background: palette.dark }} />
          <div className="absolute right-6 top-10 h-20 w-20 rounded-full opacity-70" style={{ background: palette.accent }} />
          <div className="absolute inset-x-7 bottom-16 h-16 rounded-xl opacity-18" style={{ background: palette.accentAlt }} />
        </>
      )}
    </div>
  )
}

export function CreativeDirectionPreview({ creativeDirection }: CreativeDirectionPreviewProps) {
  const [previewDesign, setPreviewDesign] = useState<PreviewDesignKey>('poster')
  const palette = PALETTE_MAP[creativeDirection.colorPalette] || DEFAULT_PALETTE
  const copy = getPreviewCopy(creativeDirection)
  const headlineStyle = getHeadlineStyle(creativeDirection, palette)
  const paperFrameStyle = getPaperFrameStyle(creativeDirection.paperEffect, palette)
  const textureOpacity = getTextureOpacity(creativeDirection.textureStrength)
  const layoutLabel = getCreativeDirectionOption(creativeDirection.informationLayout)?.label ||
    DETAIL_LABELS[creativeDirection.informationLayout] ||
    'Flexible Layout'
  const selectedLabel = getCreativeDirectionOption(creativeDirection.adPreset)?.label ||
    getCreativeDirectionOption(creativeDirection.adType)?.label ||
    'Neutral Creative'

  return (
    <aside className="xl:sticky xl:top-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-bold uppercase tracking-wide text-zinc-500">Live Preview</span>
        <span className="max-w-[220px] truncate text-sm text-zinc-500">{selectedLabel}</span>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2">
        {PREVIEW_DESIGNS.map((design) => (
          <PreviewDesignThumbnail
            key={design.value}
            design={design}
            selected={previewDesign === design.value}
            palette={palette}
            onSelect={() => setPreviewDesign(design.value)}
          />
        ))}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[450px]">
          {creativeDirection.paperEffect === 'layered-paper-shadow' && (
            <div className="absolute inset-3 rotate-2 rounded-xl" style={{ background: palette.paperAlt, opacity: 0.45 }} />
          )}

          <div
            className="absolute inset-0 overflow-hidden rounded-xl border"
            style={{
              ...paperFrameStyle,
              background: palette.paper,
            }}
          >
            <BackgroundScene backgroundScenery={creativeDirection.backgroundScenery} palette={palette} />
            <PaperDetails paperEffect={creativeDirection.paperEffect} palette={palette} />
            <PreviewDesignOverlay designKey={previewDesign} palette={palette} />

            <div
              className="pointer-events-none absolute inset-0 mix-blend-multiply"
              style={{
                opacity: textureOpacity,
                backgroundImage: `radial-gradient(${palette.dark} 1px, transparent 1px), linear-gradient(90deg, transparent 0, ${palette.line} 50%, transparent 100%)`,
                backgroundSize: '7px 7px, 100% 18px',
              }}
            />

            <div className="relative z-10 flex h-full flex-col justify-between p-7">
              <div className={previewDesign === 'offer' ? 'pt-20' : ''}>
                <div
                  className="mb-4 inline-flex rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{
                    borderColor: palette.line,
                    color: palette.muted,
                    background: 'rgba(255,255,255,0.14)',
                  }}
                >
                  {copy.kicker}
                </div>

                <h4
                  className={`max-w-[12ch] font-bold leading-[0.9] ${
                    previewDesign === 'editorial' ? 'ml-[28%] text-4xl' : 'text-5xl'
                  }`}
                  style={{
                    ...headlineStyle,
                  }}
                >
                  {copy.headline}
                </h4>

                {creativeDirection.informationLayout !== 'hero-headline-only' && (
                  <p
                    className={`mt-4 max-w-[19ch] text-sm leading-snug ${previewDesign === 'editorial' ? 'ml-[28%]' : ''}`}
                    style={{ color: palette.ink }}
                  >
                    {copy.subtitle}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <LayoutDetails creativeDirection={creativeDirection} copy={copy} palette={palette} />
                <div className="flex items-center justify-between gap-4 border-t pt-4" style={{ borderColor: palette.line }}>
                  <span className="truncate text-xs font-semibold uppercase tracking-wide" style={{ color: palette.muted }}>
                    {layoutLabel}
                  </span>
                  <span className="rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: palette.accent, color: palette.paper }}>
                    {getCreativeDirectionOption(creativeDirection.ctaStyle)?.label || copy.cta}
                  </span>
                </div>
              </div>
            </div>

            <DecorationLayer creativeDirection={creativeDirection} palette={palette} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-zinc-500">
          <span className="truncate rounded border border-zinc-800 px-3 py-2">{getCreativeDirectionOption(creativeDirection.colorPalette)?.label || 'Neutral palette'}</span>
          <span className="truncate rounded border border-zinc-800 px-3 py-2">{getCreativeDirectionOption(creativeDirection.textureStrength)?.label || 'Balanced texture'}</span>
        </div>
      </div>
    </aside>
  )
}
