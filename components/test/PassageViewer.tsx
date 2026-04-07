'use client'

import { useState } from 'react'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PassageViewerProps {
  title?: string
  passageHtml: string
  instructions?: string
}

export function PassageViewer({ title, passageHtml, instructions }: PassageViewerProps) {
  const [fontSize, setFontSize] = useState(16)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        {title && <h3 className="font-semibold text-neutral-900">{title}</h3>}
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFontSize((f) => Math.max(f - 1, 12))}
            title="Decrease font size"
            className="h-8 w-8"
          >
            <ZoomOut size={16} />
          </Button>
          <span className="text-xs text-neutral-500 w-10 text-center">{fontSize}px</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFontSize((f) => Math.min(f + 1, 24))}
            title="Increase font size"
            className="h-8 w-8"
          >
            <ZoomIn size={16} />
          </Button>
        </div>
      </div>

      {/* Instructions */}
      {instructions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 text-sm text-blue-800 flex-shrink-0">
          {instructions}
        </div>
      )}

      {/* Passage Content */}
      <div className="flex-1 overflow-y-auto">
        <div
          className="passage-text text-neutral-800 leading-relaxed"
          style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
          dangerouslySetInnerHTML={{ __html: passageHtml }}
        />
      </div>
    </div>
  )
}
