'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, FileJson, PenLine } from 'lucide-react'
import Link from 'next/link'
import { TestUploadForm } from '@/components/forms/TestUploadForm'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type CreationMethod = 'upload' | 'manual' | null

export default function NewTestPage() {
  const router = useRouter()
  const [method, setMethod] = useState<CreationMethod>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Manual form state
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate')
  const [timeLimit, setTimeLimit] = useState(60)
  const [instructions, setInstructions] = useState('')

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          type: 'reading',
          difficulty,
          time_limit_minutes: timeLimit,
          sections: [],
          manual: true,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create')
      const data = await res.json()
      router.push(`/teacher/tests/${data.test.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href="/teacher/tests"
          className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 mb-4"
        >
          <ChevronLeft size={16} />
          Back to Tests
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">Create New Test</h1>
        <p className="text-neutral-500 mt-1">Upload a JSON file or create manually</p>
      </div>

      {/* Method Selection */}
      {!method && (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setMethod('upload')}
            className="p-6 border-2 border-neutral-200 rounded-xl text-left hover:border-neutral-900 transition-colors group"
          >
            <FileJson size={28} className="text-neutral-500 group-hover:text-neutral-900 mb-3" />
            <h3 className="font-semibold text-neutral-900">Upload JSON</h3>
            <p className="text-sm text-neutral-500 mt-1">
              Upload a structured JSON file with all sections and questions at once.
            </p>
          </button>
          <button
            onClick={() => setMethod('manual')}
            className="p-6 border-2 border-neutral-200 rounded-xl text-left hover:border-neutral-900 transition-colors group"
          >
            <PenLine size={28} className="text-neutral-500 group-hover:text-neutral-900 mb-3" />
            <h3 className="font-semibold text-neutral-900">Create Manually</h3>
            <p className="text-sm text-neutral-500 mt-1">
              Start with basic info, then add sections and questions one by one.
            </p>
          </button>
        </div>
      )}

      {/* Upload Method */}
      {method === 'upload' && (
        <div>
          <button
            onClick={() => setMethod(null)}
            className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 mb-6"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <TestUploadForm
            onSuccess={({ testIds, mode }) => {
              if (mode === 'test' && testIds[0]) {
                router.push(`/teacher/tests/${testIds[0]}`)
              } else {
                router.push('/teacher/tests')
              }
            }}
          />
        </div>
      )}

      {/* Manual Method */}
      {method === 'manual' && (
        <div>
          <button
            onClick={() => setMethod(null)}
            className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 mb-6"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <form onSubmit={handleManualCreate} className="space-y-4">
            <Input
              label="Test Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Cambridge IELTS 18 — Test 1 — Reading"
            />
            <Select
              label="Difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
            <Input
              label="Time Limit (minutes)"
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value))}
              min={1}
              max={240}
            />
            <Textarea
              label="Instructions (optional)"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="General test instructions shown to students..."
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" loading={loading} className="w-full">
              Create Test & Add Questions
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
