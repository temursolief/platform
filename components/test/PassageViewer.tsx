'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ZoomIn, ZoomOut, Highlighter, X } from 'lucide-react'
import { applyHighlightInContainer } from '@/lib/utils/highlight'

interface PassageViewerProps {
  title?: string
  passageHtml: string
  instructions?: string
  /** Restored HTML (with marks) from a previous visit to this section */
  savedHtml?: string
  /** Called whenever highlights change so the parent can persist them */
  onHtmlChange?: (html: string) => void
  /** Controlled highlight mode — lifted from parent */
  highlightMode: boolean
  onHighlightModeChange: (v: boolean) => void
  /** Controlled active colour — lifted from parent */
  activeColor: string
  onActiveColorChange: (c: string) => void
}

const HIGHLIGHT_COLORS = [
  { key: 'hl-yellow', label: 'Yellow', bg: '#fef08a', border: '#fde047' },
  { key: 'hl-green',  label: 'Green',  bg: '#bbf7d0', border: '#86efac' },
  { key: 'hl-blue',   label: 'Blue',   bg: '#bfdbfe', border: '#93c5fd' },
  { key: 'hl-pink',   label: 'Pink',   bg: '#fecdd3', border: '#fda4af' },
]

export function PassageViewer({
  title,
  passageHtml,
  instructions,
  savedHtml,
  onHtmlChange,
  highlightMode,
  onHighlightModeChange,
  activeColor,
  onActiveColorChange,
}: PassageViewerProps) {
  const [fontSize, setFontSize] = useState(16)
  const passageRef = useRef<HTMLDivElement>(null)
  const activeColorRef = useRef(activeColor)

  // Keep ref in sync so callbacks don't go stale
  useEffect(() => { activeColorRef.current = activeColor }, [activeColor])

  // Set innerHTML directly (bypasses React's vdom for this node).
  // Re-runs when passageHtml changes (= section switch), restoring saved marks or fresh HTML.
  useEffect(() => {
    if (passageRef.current) {
      passageRef.current.innerHTML = savedHtml || passageHtml
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passageHtml]) // intentionally omit savedHtml — only reset on section change

  const applyHighlight = useCallback(() => {
    if (!passageRef.current) return
    applyHighlightInContainer(
      passageRef.current,
      activeColorRef.current,
      () => onHtmlChange?.(passageRef.current?.innerHTML ?? '')
    )
  }, [onHtmlChange])

  // Document-level mouseup — fires even when pointer drifts outside passage div.
  // Only handles selections anchored in the passage; the questions panel
  // has its own listener in TestInterface.
  useEffect(() => {
    if (!highlightMode) return

    const handler = () => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) return
      if (passageRef.current?.contains(selection.anchorNode)) {
        applyHighlight()
      }
    }

    document.addEventListener('mouseup', handler)
    return () => document.removeEventListener('mouseup', handler)
  }, [highlightMode, applyHighlight])

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
    onHtmlChange?.(el.innerHTML)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0 flex-wrap">
        {title && (
          <h3 className="font-semibold text-neutral-900 text-sm flex-1 min-w-0 truncate">{title}</h3>
        )}

        <div className="flex items-center gap-1 ml-auto">
          {/* Toggle highlight mode */}
          <button
            type="button"
            onClick={() => onHighlightModeChange(!highlightMode)}
            title={highlightMode ? 'Exit highlight mode' : 'Highlight text'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border ${
              highlightMode
                ? 'bg-amber-100 border-amber-300 text-amber-800'
                : 'bg-white border-neutral-200 text-neutral-500 hover:text-neutral-800 hover:border-neutral-300'
            }`}
          >
            <Highlighter size={13} />
            {highlightMode ? 'Highlighting ON' : 'Highlight'}
          </button>

          {highlightMode && (
            <>
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => onActiveColorChange(c.key)}
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

      {highlightMode && (
        <div className="mb-2 flex-shrink-0 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
          Select text to highlight. Click a highlight to remove it.
        </div>
      )}

      {/* Passage Content — innerHTML managed via ref, not dangerouslySetInnerHTML */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div
          ref={passageRef}
          className={`passage-text ${highlightMode ? 'cursor-text select-text' : ''}`}
          style={{ fontSize: `${fontSize}px` }}
        />
      </div>
    </div>
  )
}
