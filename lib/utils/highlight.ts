/**
 * Applies a coloured <mark> around the current window selection,
 * constrained to `container`. Calls `onApplied` after each change
 * (add or remove) so the caller can persist innerHTML if needed.
 */
export function applyHighlightInContainer(
  container: HTMLElement,
  color: string,
  onApplied?: () => void
): void {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) return

  const range = selection.getRangeAt(0)
  if (!container.contains(range.commonAncestorContainer)) {
    selection.removeAllRanges()
    return
  }

  const createMark = () => {
    const mark = document.createElement('mark')
    mark.className = color
    mark.addEventListener('click', (e) => {
      const el = e.currentTarget as HTMLElement
      const parent = el.parentNode
      if (!parent) return
      while (el.firstChild) parent.insertBefore(el.firstChild, el)
      parent.removeChild(el)
      parent.normalize()
      onApplied?.()
    })
    return mark
  }

  try {
    const mark = createMark()
    range.surroundContents(mark)
  } catch {
    try {
      const fragment = range.extractContents()
      const mark = createMark()
      mark.appendChild(fragment)
      range.insertNode(mark)
    } catch {
      // selection spans complex element boundaries — skip
    }
  }

  selection.removeAllRanges()
  onApplied?.()
}
