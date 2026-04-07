'use client'

import { useState, useRef } from 'react'
import { Upload, FileJson, X, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import type { Difficulty, TestType } from '@/lib/types'

interface ParsedTest {
  title: string
  type: TestType
  difficulty: Difficulty
  time_limit_minutes: number
  sections: {
    title: string
    instructions?: string
    audio_filename?: string
    questions: {
      number: number
      type: string
      question_text: string
      options?: string[]
      correct_answer: string
      acceptable_answers?: string[]
    }[]
  }[]
}

interface TestUploadFormProps {
  onSuccess?: (testId: string) => void
}

export function TestUploadForm({ onSuccess }: TestUploadFormProps) {
  const [parsed, setParsed] = useState<ParsedTest | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setError(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string) as ParsedTest
        setParsed(json)
      } catch {
        setError('Invalid JSON file. Please use the correct format.')
        setParsed(null)
      }
    }
    reader.readAsText(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!parsed) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create test')
      }

      const data = await res.json()
      onSuccess?.(data.test.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const totalQuestions = parsed?.sections.reduce(
    (acc, s) => acc + s.questions.length, 0
  ) ?? 0

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          file ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'
        }`}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileJson size={24} className="text-neutral-700" />
            <div className="text-left">
              <p className="text-sm font-medium text-neutral-900">{file.name}</p>
              <p className="text-xs text-neutral-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); setParsed(null) }}
              className="ml-auto p-1 hover:bg-neutral-200 rounded"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <Upload size={32} className="mx-auto text-neutral-400 mb-3" />
            <p className="text-sm font-medium text-neutral-700">
              Click to upload JSON test file
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              Supports .json format as per the IELTS Platform spec
            </p>
          </>
        )}
      </div>

      {/* Parsed Preview */}
      {parsed && (
        <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span className="text-sm font-medium text-neutral-900">File parsed successfully</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-neutral-500">Title:</span>{' '}
              <span className="text-neutral-900 font-medium">{parsed.title}</span>
            </div>
            <div>
              <span className="text-neutral-500">Type:</span>{' '}
              <span className="text-neutral-900 font-medium capitalize">{parsed.type}</span>
            </div>
            <div>
              <span className="text-neutral-500">Sections:</span>{' '}
              <span className="text-neutral-900 font-medium">{parsed.sections.length}</span>
            </div>
            <div>
              <span className="text-neutral-500">Questions:</span>{' '}
              <span className="text-neutral-900 font-medium">{totalQuestions}</span>
            </div>
            <div>
              <span className="text-neutral-500">Duration:</span>{' '}
              <span className="text-neutral-900 font-medium">{parsed.time_limit_minutes} min</span>
            </div>
            <div>
              <span className="text-neutral-500">Difficulty:</span>{' '}
              <span className="text-neutral-900 font-medium capitalize">{parsed.difficulty}</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={!parsed || loading}
        loading={loading}
        className="w-full"
      >
        Create Test
      </Button>
    </form>
  )
}
