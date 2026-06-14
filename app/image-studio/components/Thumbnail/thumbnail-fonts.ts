/**
 * Curated bold display fonts for thumbnail headlines, self-hosted via
 * next/font (Google + local .ttf), so they stay same-origin and embed cleanly
 * in the html-to-image export. `thumbnailFontVars` must be applied to the
 * captured stage node so the @font-faces are present in the exported subtree.
 *
 * The local fonts live in ./fonts and were copied from the user's installed
 * Fontshare families (single bold weight each, kept lean for the bundle).
 */

import {
  Anton,
  Archivo_Black,
  Azeret_Mono,
  Bangers,
  Bebas_Neue,
  Luckiest_Guy,
  Manrope,
  Montserrat,
  Oswald,
  Permanent_Marker,
} from 'next/font/google'
import localFont from 'next/font/local'

const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--thumb-anton', display: 'swap' })
const archivo = Archivo_Black({ subsets: ['latin'], weight: '400', variable: '--thumb-archivo', display: 'swap' })
const bebas = Bebas_Neue({ subsets: ['latin'], weight: '400', variable: '--thumb-bebas', display: 'swap' })
const oswald = Oswald({ subsets: ['latin'], weight: '700', variable: '--thumb-oswald', display: 'swap' })
const montserrat = Montserrat({ subsets: ['latin'], weight: '800', variable: '--thumb-montserrat', display: 'swap' })
const manrope = Manrope({ subsets: ['latin'], weight: '800', variable: '--thumb-manrope', display: 'swap' })
const azeretMono = Azeret_Mono({ subsets: ['latin'], weight: '700', variable: '--thumb-azeret', display: 'swap' })
const luckiest = Luckiest_Guy({ subsets: ['latin'], weight: '400', variable: '--thumb-luckiest', display: 'swap' })
const bangers = Bangers({ subsets: ['latin'], weight: '400', variable: '--thumb-bangers', display: 'swap' })
const marker = Permanent_Marker({ subsets: ['latin'], weight: '400', variable: '--thumb-marker', display: 'swap' })

// Self-hosted Fontshare families (single bold weight each)
const satoshi = localFont({ src: './fonts/Satoshi-Bold.ttf', weight: '700', variable: '--thumb-satoshi', display: 'swap' })
const clash = localFont({ src: './fonts/ClashDisplay-Bold.ttf', weight: '700', variable: '--thumb-clash', display: 'swap' })
const cabinet = localFont({ src: './fonts/CabinetGrotesk-Bold.ttf', weight: '700', variable: '--thumb-cabinet', display: 'swap' })
const chubbo = localFont({ src: './fonts/Chubbo-Bold.ttf', weight: '700', variable: '--thumb-chubbo', display: 'swap' })
const excon = localFont({ src: './fonts/Excon-Bold.ttf', weight: '700', variable: '--thumb-excon', display: 'swap' })
const synonym = localFont({ src: './fonts/Synonym-Bold.ttf', weight: '700', variable: '--thumb-synonym', display: 'swap' })
const bespoke = localFont({ src: './fonts/BespokeStencil-Bold.ttf', weight: '700', variable: '--thumb-bespoke', display: 'swap' })
const pilcrow = localFont({ src: './fonts/PilcrowRounded-Bold.ttf', weight: '700', variable: '--thumb-pilcrow', display: 'swap' })
const bonny = localFont({ src: './fonts/Bonny-Bold.ttf', weight: '700', variable: '--thumb-bonny', display: 'swap' })
const boxing = localFont({ src: './fonts/Boxing-Regular.ttf', weight: '400', variable: '--thumb-boxing', display: 'swap' })

export interface ThumbnailFont {
  id: string
  label: string
  family: string
}

export const THUMBNAIL_FONTS: ThumbnailFont[] = [
  { id: 'geist', label: 'Geist', family: "'Geist', system-ui, sans-serif" },
  { id: 'anton', label: 'Anton', family: `${anton.style.fontFamily}, sans-serif` },
  { id: 'archivo', label: 'Archivo', family: `${archivo.style.fontFamily}, sans-serif` },
  { id: 'bebas', label: 'Bebas', family: `${bebas.style.fontFamily}, sans-serif` },
  { id: 'oswald', label: 'Oswald', family: `${oswald.style.fontFamily}, sans-serif` },
  { id: 'montserrat', label: 'Montserrat', family: `${montserrat.style.fontFamily}, sans-serif` },
  { id: 'manrope', label: 'Manrope', family: `${manrope.style.fontFamily}, sans-serif` },
  { id: 'azeret', label: 'Azeret Mono', family: `${azeretMono.style.fontFamily}, monospace` },
  { id: 'luckiest', label: 'Luckiest', family: `${luckiest.style.fontFamily}, cursive` },
  { id: 'bangers', label: 'Bangers', family: `${bangers.style.fontFamily}, cursive` },
  { id: 'marker', label: 'Marker', family: `${marker.style.fontFamily}, cursive` },
  { id: 'satoshi', label: 'Satoshi', family: `${satoshi.style.fontFamily}, sans-serif` },
  { id: 'clash', label: 'Clash', family: `${clash.style.fontFamily}, sans-serif` },
  { id: 'cabinet', label: 'Cabinet', family: `${cabinet.style.fontFamily}, sans-serif` },
  { id: 'chubbo', label: 'Chubbo', family: `${chubbo.style.fontFamily}, serif` },
  { id: 'excon', label: 'Excon', family: `${excon.style.fontFamily}, sans-serif` },
  { id: 'synonym', label: 'Synonym', family: `${synonym.style.fontFamily}, sans-serif` },
  { id: 'bespoke', label: 'Bespoke', family: `${bespoke.style.fontFamily}, sans-serif` },
  { id: 'pilcrow', label: 'Pilcrow', family: `${pilcrow.style.fontFamily}, sans-serif` },
  { id: 'bonny', label: 'Bonny', family: `${bonny.style.fontFamily}, serif` },
  { id: 'boxing', label: 'Boxing', family: `${boxing.style.fontFamily}, sans-serif` },
]

/** Combined CSS-variable classNames — apply to the captured stage node so the
 *  @font-faces are loaded and present in the export. */
export const thumbnailFontVars = [
  anton, archivo, bebas, oswald, montserrat, manrope, azeretMono, luckiest, bangers, marker,
  satoshi, clash, cabinet, chubbo, excon, synonym, bespoke, pilcrow, bonny, boxing,
]
  .map((f) => f.variable)
  .join(' ')

export function fontFamilyFor(id: string | undefined): string {
  return THUMBNAIL_FONTS.find((f) => f.id === id)?.family ?? THUMBNAIL_FONTS[0].family
}
