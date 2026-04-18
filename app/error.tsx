'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="bg-white border border-neutral-200 rounded-xl p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={22} className="text-red-500" />
        </div>
        <h1 className="text-lg font-bold text-neutral-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-neutral-500 mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <Button onClick={reset} className="w-full">Try again</Button>
      </div>
    </div>
  )
}
