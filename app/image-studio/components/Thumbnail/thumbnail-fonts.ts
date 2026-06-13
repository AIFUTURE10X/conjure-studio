/**
 * Curated bold display fonts for thumbnail headlines, self-hosted via
 * next/font/google (same-origin, so they embed cleanly in the html-to-image
 * export). `thumbnailFontVars` must be applied to the captured stage node so
 * the @font-faces are present in the exported subtree.
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
]

/** Combined CSS-variable classNames — apply to the captured stage node so the
 *  @font-faces are loaded and present in the export. */
export const thumbnailFontVars = [anton, archivo, bebas, oswald, montserrat, manrope, azeretMono, luckiest, bangers, marker]
  .map((f) => f.variable)
  .join(' ')

export function fontFamilyFor(id: string | undefined): string {
  return THUMBNAIL_FONTS.find((f) => f.id === id)?.family ?? THUMBNAIL_FONTS[0].family
}
