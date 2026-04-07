'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Plus, Trash2, Eye, EyeOff, Upload, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { QuestionEditor } from '@/components/forms/QuestionEditor'
import { Input, Select, Textarea } from '@/components/ui/input'
import type { TestWithSections } from '@/lib/types'
import { formatDate } from '@/lib/utils/format'

interface EditTestPageProps {
  params: Promise<{ testId: string }>
}

export default function EditTestPage({ params }: EditTestPageProps) {
  const { testId } = use(params)
  const router = useRouter()
  const [test, setTest] = useState<TestWithSections | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddQuestion, setShowAddQuestion] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [audioFiles, setAudioFiles] = useState<Record<string, File>>({})

  useEffect(() => {
    fetch(`/api/tests/${testId}`)
      .then((r) => r.json())
      .then((data) => { setTest(data.test); setLoading(false) })
      .catch(() => { setError('Failed to load test'); setLoading(false) })
  }, [testId])

  const togglePublish = async () => {
    if (!test) return
    setSaving(true)
    const res = await fetch(`/api/tests/${testId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !test.is_published }),
    })
    if (res.ok) {
      setTest((t) => t ? { ...t, is_published: !t.is_published } : t)
    }
    setSaving(false)
  }

  const deleteTest = async () => {
    if (!confirm('Delete this test? This cannot be undone.')) return
    await fetch(`/api/tests/${testId}`, { method: 'DELETE' })
    router.push('/teacher/tests')
  }

  const handleAddQuestion = async (sectionId: string, question: Record<string, unknown>) => {
    const res = await fetch(`/api/tests/${testId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...question, section_id: sectionId }),
    })
    if (!res.ok) throw new Error((await res.json()).error)
    const data = await res.json()
    setTest((t) => {
      if (!t) return t
      return {
        ...t,
        sections: t.sections.map((s) =>
          s.id === sectionId
            ? { ...s, questions: [...s.questions, data.question] }
            : s
        ),
      }
    })
    setShowAddQuestion(null)
  }

  const uploadAudio = async (sectionId: string) => {
    const file = audioFiles[sectionId]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    formData.append('testId', testId)
    formData.append('type', 'audio')

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (!res.ok) { setError('Upload failed'); return }
    const { url } = await res.json()

    // Update section with audio url
    await fetch(`/api/tests/${testId}/sections/${sectionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio_url: url }),
    })
    setTest((t) => {
      if (!t) return t
      return {
        ...t,
        sections: t.sections.map((s) =>
          s.id === sectionId ? { ...s, audio_url: url } : s
        ),
      }
    })
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-neutral-400">
        Loading...
      </div>
    )
  }

  if (!test) {
    return (
      <div className="p-8 text-center text-neutral-400">
        Test not found. <Link href="/teacher/tests" className="text-blue-600 hover:underline">Go back</Link>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/teacher/tests" className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 mb-4">
          <ChevronLeft size={16} /> Back to Tests
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{test.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={test.type === 'listening' ? 'listening' : 'reading'}>{test.type}</Badge>
              <Badge variant={test.is_published ? 'success' : 'default'}>
                {test.is_published ? 'Published' : 'Draft'}
              </Badge>
              <span className="text-xs text-neutral-400">Updated {formatDate(test.updated_at)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
              <Settings size={16} className="mr-1" /> Settings
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={togglePublish}
              loading={saving}
            >
              {test.is_published ? <><EyeOff size={16} className="mr-1" /> Unpublish</> : <><Eye size={16} className="mr-1" /> Publish</>}
            </Button>
            <Button variant="danger" size="sm" onClick={deleteTest}>
              <Trash2 size={16} className="mr-1" /> Delete
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Sections */}
      {test.sections.length === 0 ? (
        <div className="text-center py-12 text-neutral-400 border-2 border-dashed border-neutral-200 rounded-xl">
          <p className="mb-2">No sections yet.</p>
          <p className="text-sm">Add sections via the Settings panel or by uploading a JSON test.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {test.sections.map((section) => (
            <div key={section.id} className="border border-neutral-200 rounded-xl overflow-hidden">
              <div className="bg-neutral-50 px-5 py-3 flex items-center justify-between border-b border-neutral-200">
                <h3 className="font-semibold text-neutral-800">
                  {section.title || `Section ${section.order_num}`}
                </h3>
                <div className="flex items-center gap-2">
                  {test.type === 'listening' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="audio/*"
                        id={`audio-${section.id}`}
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) setAudioFiles((p) => ({ ...p, [section.id]: f }))
                        }}
                      />
                      <label
                        htmlFor={`audio-${section.id}`}
                        className="text-xs text-neutral-600 cursor-pointer flex items-center gap-1 px-2 py-1 rounded border border-neutral-200 hover:bg-white"
                      >
                        <Upload size={12} />
                        {section.audio_url ? 'Replace Audio' : 'Upload Audio'}
                      </label>
                      {audioFiles[section.id] && (
                        <Button size="sm" onClick={() => uploadAudio(section.id)} className="h-7 text-xs px-2">
                          Save
                        </Button>
                      )}
                      {section.audio_url && !audioFiles[section.id] && (
                        <span className="text-xs text-emerald-600">Audio uploaded</span>
                      )}
                    </div>
                  )}
                  <span className="text-xs text-neutral-400">{section.questions.length} questions</span>
                </div>
              </div>

              <div className="divide-y divide-neutral-100">
                {section.questions.map((question) => (
                  <div key={question.id} className="px-5 py-3 flex items-start gap-3">
                    <span className="text-xs font-mono text-neutral-400 pt-0.5 flex-shrink-0 w-6">
                      {question.order_num}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-800">{question.question_text}</p>
                      <p className="text-xs text-emerald-600 mt-1">Answer: {question.correct_answer}</p>
                    </div>
                    <Badge className="flex-shrink-0 text-xs">{question.type.replace('_', ' ')}</Badge>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 border-t border-neutral-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddQuestion(section.id)}
                  className="text-xs"
                >
                  <Plus size={14} className="mr-1" /> Add Question
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Question Modal */}
      <Modal
        isOpen={!!showAddQuestion}
        onClose={() => setShowAddQuestion(null)}
        title="Add Question"
        size="lg"
      >
        {showAddQuestion && (
          <QuestionEditor
            sectionId={showAddQuestion}
            initialOrderNum={
              (test.sections.find((s) => s.id === showAddQuestion)?.questions.length ?? 0) + 1
            }
            onSave={(q) => handleAddQuestion(showAddQuestion, q as unknown as Record<string, unknown>)}
            onCancel={() => setShowAddQuestion(null)}
          />
        )}
      </Modal>
    </div>
  )
}
