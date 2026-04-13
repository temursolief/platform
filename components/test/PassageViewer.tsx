'use client'

import { useState, useRef } from 'react'
import { ZoomIn, ZoomOut, Highlighter, X } from 'lucide-react'

interface PassageViewerProps {
  title?: string
  passageHtml: string
  instructions?: string
}

const HIGHLIGHT_COLORS = [
  { key: 'hl-yellow', label: 'Yellow', bg: '#fef08a', border: '#fde047' },
  { key: 'hl-green',  label: 'Green',  bg: '#bbf7d0', border: '#86efac' },
  { key: 'hl-blue',   label: 'Blue',   bg: '#bfdbfe', border: '#93c5fd' },
  { key: 'hl-pink',   label: 'Pink',   bg: '#fecdd3', border: '#fda4af' },
]

export function PassageViewer({ title, passageHtml, instructions }: PassageViewerProps) {
  const [fontSize, setFontSize] = useState(16)
  const [activeColor, setActiveColor] = useState<string>('hl-yellow')
  const [highlightMode, setHighlightMode] = useState(false)
  const passageRef = useRef<HTMLDivElement>(null)

  // Apply a persistent highlight to the current text selection
  const applyHighlight = () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return

    const range = selection.getRangeAt(0)
    // Only allow highlights inside the passage container
    if (!passageRef.current?.contains(range.commonAncestorContainer)) {
      selection.removeAllRanges()
      return
    }

    try {
      // Remove existing mark if the range is already inside one
      const mark = document.createElement('mark')
      mark.className = activeColor
      mark.addEventListener('click', (e) => {
        // Click on a highlight to remove it
        const el = e.currentTarget as HTMLElement
        const parent = el.parentNode
        if (!parent) return
        while (el.firstChild) parent.insertBefore(el.firstChild, el)
        parent.removeChild(el)
        parent.normalize()
      })
      range.surroundContents(mark)
      selection.removeAllRanges()
    } catch {
      // surroundContents throws when the selection crosses element boundaries.
      // Extract the selected HTML, wrap it, and reinsert.
      try {
        const fragment = range.extractContents()
        const mark = document.createElement('mark')
        mark.className = activeColor
        mark.appendChild(fragment)
        mark.addEventListener('click', (e) => {
          const el = e.currentTarget as HTMLElement
          const parent = el.parentNode
          if (!parent) return
          while (el.firstChild) parent.insertBefore(el.firstChild, el)
          parent.removeChild(el)
          parent.normalize()
        })
        range.insertNode(mark)
        selection.removeAllRanges()
      } catch {
        selection.removeAllRanges()
      }
    }
  }

  const clearAllHighlights = () => {
    const el = passageRef.current
    if (!el) return
    el.querySelectorAll('mark').forEach((mark) => {
      const parent = mark.parentNode
      if (!parent) return
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
      parent.removeChild(mark)
    })
    el.normalize()
  }

  const handleMouseUp = () => {
    if (!highlightMode) return
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed) {
      applyHighlight()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0 flex-wrap">
        {title && (
          <h3 className="font-semibold text-neutral-900 text-sm flex-1 min-w-0 truncate">{title}</h3>
        )}

        {/* Highlight toolbar */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Toggle highlight mode */}
          <button
            type="button"
            onClick={() => setHighlightMode((v) => !v)}
            title={highlightMode ? 'Exit highlight mode' : 'Highlight text'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border ${
              highlightMode
                ? 'bg-amber-100 border-amber-300 text-amber-800'
                : 'bg-white border-neutral-200 text-neutral-500 hover:text-neutral-800 hover:border-neutral-300'
            }`}
          >
            <Highlighter size={13} />
            {highlightMode ? 'Highlighting' : 'Highlight'}
          </button>

          {/* Color picker — only when mode is on */}
          {highlightMode && (
            <>
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setActiveColor(c.key)}
                  title={c.label}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    activeColor === c.key ? 'scale-125 border-neutral-600' : 'border-transparent hover:scale-110'
                  }`}
                  style={{ background: c.bg }}
                />
              ))}
              <button
                type="button"
                onClick={clearAllHighlights}
                title="Clear all highlights"
                className="ml-1 flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-neutral-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
              >
                <X size={12} />
              </button>
            </>
          )}

          {/* Font size */}
          <div className="flex items-center gap-0.5 ml-1 border border-neutral-200 rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => setFontSize((f) => Math.max(f - 1, 12))}
              className="px-2 py-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-colors"
              title="Decrease font size"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-xs text-neutral-500 w-9 text-center tabular-nums select-none">{fontSize}px</span>
            <button
              type="button"
              onClick={() => setFontSize((f) => Math.min(f + 1, 26))}
              className="px-2 py-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-colors"
              title="Increase font size"
            >
              <ZoomIn size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {instructions && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg px-4 py-2.5 mb-3 text-sm text-sky-800 flex-shrink-0 leading-snug">
          {instructions}
        </div>
      )}

      {/* Hint banner when highlight mode is on */}
      {highlightMode && (
        <div className="mb-2 flex-shrink-0 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
          Select text in the passage to highlight it. Click a highlight to remove it.
        </div>
      )}

      {/* Passage Content */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div
          ref={passageRef}
          className={`passage-text ${highlightMode ? 'cursor-text' : ''}`}
          style={{ fontSize: `${fontSize}px` }}
          dangerouslySetInnerHTML={{ __html: passageHtml }}
          onMouseUp={handleMouseUp}
        />
      </div>
    </div>
  )
}
