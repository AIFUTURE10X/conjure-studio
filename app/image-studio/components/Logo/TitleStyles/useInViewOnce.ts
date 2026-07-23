"use client"

/**
 * useInViewOnce - fires once when the element first scrolls near the viewport.
 *
 * Drives thumbnail loading in the Title Styles grid. We do this explicitly
 * rather than with `loading="lazy"` because the native attribute defers on a
 * heuristic that never resolves in some embedded/headless browsers, which
 * leaves the grid blank. An observer behaves identically everywhere.
 */

import { useEffect, useRef, useState } from 'react'

export function useInViewOnce<T extends HTMLElement>(rootMargin = '200px') {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || inView) return

    // No IntersectionObserver (very old browsers, some test envs) - load eagerly
    // rather than render an empty grid.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [inView, rootMargin])

  return { ref, inView }
}
