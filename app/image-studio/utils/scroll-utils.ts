/**
 * Ancestor-safe scrolling helpers.
 *
 * Element.scrollIntoView (and focus without preventScroll) scrolls EVERY
 * scrollable ancestor — including overflow-hidden layout clippers like the
 * studio shell, which hide their scrollbars but are still programmatically
 * scrollable. In the installed app that shoved the whole studio off the top
 * of the window. These helpers scroll only the nearest intentionally
 * scrollable container (overflow auto/scroll) and never touch ancestors.
 */

const isScrollable = (el: HTMLElement): boolean => {
  const { overflowY } = window.getComputedStyle(el)
  return overflowY === 'auto' || overflowY === 'scroll'
}

export function nearestScrollContainer(el: HTMLElement): HTMLElement | null {
  let node = el.parentElement
  while (node) {
    if (isScrollable(node)) return node
    node = node.parentElement
  }
  return null
}

/** Scroll the anchor's own scroll container to its bottom (chat autoscroll). */
export function scrollContainerToBottom(
  anchor: HTMLElement | null,
  behavior: ScrollBehavior = 'smooth',
): void {
  if (!anchor) return
  const container = nearestScrollContainer(anchor)
  container?.scrollTo({ top: container.scrollHeight, behavior })
}

/** Scroll the anchor's own scroll container so the anchor's top is in view. */
export function scrollContainerToElement(
  anchor: HTMLElement | null,
  behavior: ScrollBehavior = 'smooth',
): void {
  if (!anchor) return
  const container = nearestScrollContainer(anchor)
  if (!container) return
  const top =
    anchor.getBoundingClientRect().top -
    container.getBoundingClientRect().top +
    container.scrollTop
  container.scrollTo({ top, behavior })
}
