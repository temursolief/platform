'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Plus, Trash2, Eye, EyeOff, Settings, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { Input, Select, Textarea } from '@/components/ui/input'
import { QuestionEditor, type QuestionDraft } from '@/components/forms/QuestionEditor'
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

  // Modals
  const [showAddQuestion, setShowAddQuestion] = useState<string | null>(null) // sectionId
  const [showSettings, setShowSettings] = useState(false)

  // Settings form state (initialised when modal opens)
  const [settingsTitle, setSettingsTitle] = useState('')
  const [settingsDifficulty, setSettingsDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate')
  const [settingsTimeLimit, setSettingsTimeLimit] = useState(60)
  const [settingsSaving, setSettingsSaving] = useState(false)

  // New section form (inside Settings modal)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [newSectionInstructions, setNewSectionInstructions] = useState('')
  const [addingSect, setAddingSect] = useState(false)
  const [sectionError, setSectionError] = useState<string | null>(null)

  // -------------------------------------------------------------------------
  // Load test
  // -------------------------------------------------------------------------
  useEffect(() => {
    fetch(`/api/tests/${testId}`)
      .then((r) => r.json())
      .then((data) => { setTest(data.test); setLoading(false) })
      .catch(() => { setError('Failed to load test.'); setLoading(false) })
  }, [testId])

  // -------------------------------------------------------------------------
  // Settings modal helpers
  // -------------------------------------------------------------------------
  const openSettings = () => {
    if (!test) return
    setSettingsTitle(test.title)
    setSettingsDifficulty(test.difficulty)
    setSettingsTimeLimit(test.time_limit_minutes)
    setNewSectionTitle('')
    setNewSectionInstructions('')
    setSectionError(null)
    setShowSettings(true)
  }

  const saveSettings = async () => {
    if (!test) return
    setSettingsSaving(true)
    try {
      const res = await fetch(`/api/tests/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: settingsTitle.trim(),
          difficulty: settingsDifficulty,
          time_limit_minutes: settingsTimeLimit,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to save settings.')
      }
      const d = await res.json()
      setTest((t) => t ? { ...t, ...d.test } : t)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSettingsSaving(false)
    }
  }

  const addSection = async () => {
    setSectionError(null)
    if (!newSectionTitle.trim()) {
      setSectionError('Section title is required.')
      return
    }
    setAddingSect(true)
    try {
      const res = await fetch(`/api/tests/${testId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSectionTitle.trim(),
          instructions: newSectionInstructions.trim() || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to add section.')
      }
      const d = await res.json()
      setTest((t) => t ? { ...t, sections: [...t.sections, d.section] } : t)
      setNewSectionTitle('')
      setNewSectionInstructions('')
    } catch (err) {
      setSectionError(err instanceof Error ? err.message : 'Failed to add section.')
    } finally {
      setAddingSect(false)
    }
  }

  // -------------------------------------------------------------------------
  // Publish / delete
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Add question
  // -------------------------------------------------------------------------
  const handleAddQuestion = async (sectionId: string, question: QuestionDraft) => {
    const res = await fetch(`/api/tests/${testId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...question, section_id: sectionId }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      throw new Error(d.error ?? `Server error ${res.status}`)
    }
    const data = await res.json()
    setTest((t) => {
      if (!t) return t
      return {
        ...t,
        sections: t.sections.map((s) =>
          s.id === sectionId ? { ...s, questions: [...s.questions, data.question] } : s
        ),
      }
    })
    setShowAddQuestion(null)
  }


  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  if (loading) {
    return <div className="p-8 text-neutral-400 text-center">Loading…</div>
  }

  if (!test) {
    return (
      <div className="p-8 text-center text-neutral-400">
        Test not found.{' '}
        <Link href="/teacher/tests" className="text-blue-600 hover:underline">Go back</Link>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="mb-6">
        <Link
          href="/teacher/tests"
          className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 mb-4"
        >
          <ChevronLeft size={16} /> Back to Tests
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{test.title}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="reading">{test.type}</Badge>
              <Badge>{test.difficulty}</Badge>
              <Badge variant={test.is_published ? 'success' : 'default'}>
                {test.is_published ? 'Published' : 'Draft'}
              </Badge>
              <span className="text-xs text-neutral-400">Updated {formatDate(test.updated_at)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            <Button variant="secondary" size="sm" onClick={openSettings}>
              <Settings size={15} className="mr-1.5" /> Settings
            </Button>
            <Link href={`/student/tests/${testId}`}>
              <Button variant="secondary" size="sm">
                <Eye size={15} className="mr-1.5" /> Preview Test
              </Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={togglePublish} loading={saving}>
              {test.is_published
                ? <><EyeOff size={15} className="mr-1.5" /> Unpublish</>
                : <><Eye size={15} className="mr-1.5" /> Publish</>}
            </Button>
            <Button variant="danger" size="sm" onClick={deleteTest}>
              <Trash2 size={15} className="mr-1.5" /> Delete
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Sections ── */}
      {test.sections.length === 0 ? (
        <div className="text-center py-14 text-neutral-400 border-2 border-dashed border-neutral-200 rounded-xl">
          <p className="mb-2 font-medium">No sections yet</p>
          <p className="text-sm mb-4">Open <strong>Settings</strong> to add your first section.</p>
          <Button variant="secondary" size="sm" onClick={openSettings}>
            <Settings size={14} className="mr-1.5" /> Open Settings
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {test.sections.map((section) => (
            <div key={section.id} className="border border-neutral-200 rounded-xl overflow-hidden">
              {/* Section header */}
              <div className="bg-neutral-50 px-5 py-3 flex items-center justify-between border-b border-neutral-200">
                <h3 className="font-semibold text-neutral-800 text-sm">
                  {section.title || `Section ${section.order_num}`}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400">
                    {section.questions.length} question{section.questions.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Questions list */}
              {section.questions.length === 0 ? (
                <div className="px-5 py-4 text-sm text-neutral-400 italic">
                  No questions yet — add one below.
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {section.questions.map((question) => (
                    <div key={question.id} className="px-5 py-3 flex items-start gap-3">
                      <span className="text-xs font-mono text-neutral-400 pt-0.5 flex-shrink-0 w-6">
                        {question.order_num}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-800">{question.question_text}</p>
                        <p className="text-xs text-emerald-600 mt-0.5">Answer: {question.correct_answer}</p>
                      </div>
                      <Badge className="flex-shrink-0 text-xs">
                        {question.type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Add question */}
              <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddQuestion(section.id)}
                  className="text-xs text-neutral-600"
                >
                  <Plus size={14} className="mr-1" /> Add Question
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          SETTINGS MODAL
      ──────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Test Settings"
        size="lg"
      >
        <div className="space-y-6">
          {/* ── Metadata ── */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-700 mb-3">Test Info</h3>
            <div className="space-y-3">
              <Input
                label="Title"
                value={settingsTitle}
                onChange={(e) => setSettingsTitle(e.target.value)}
              />
              <Select
                label="Difficulty"
                value={settingsDifficulty}
                onChange={(e) => setSettingsDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
              <Input
                label="Time Limit (minutes)"
                type="number"
                value={settingsTimeLimit}
                onChange={(e) => setSettingsTimeLimit(parseInt(e.target.value) || 60)}
                min={1}
                max={240}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={saveSettings}
                loading={settingsSaving}
              >
                <Save size={14} className="mr-1.5" /> Save Changes
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-neutral-200" />

          {/* ── Existing sections ── */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-700 mb-3">
              Sections ({test.sections.length})
            </h3>

            {test.sections.length === 0 ? (
              <p className="text-sm text-neutral-400">No sections yet. Add one below.</p>
            ) : (
              <div className="space-y-1.5 mb-3">
                {test.sections.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200"
                  >
                    <span className="text-sm text-neutral-800">
                      {s.title || `Section ${s.order_num}`}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {s.questions.length} question{s.questions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Add section form */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-neutral-700">Add New Section</p>
              <Input
                label="Section Title"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder={`e.g., Section ${test.sections.length + 1} or Passage A`}
              />
              <Textarea
                label="Instructions (optional)"
                value={newSectionInstructions}
                onChange={(e) => setNewSectionInstructions(e.target.value)}
                placeholder="Instructions shown to students before this section…"
              />
              {sectionError && (
                <p className="text-xs text-red-600">{sectionError}</p>
              )}
              <Button
                type="button"
                size="sm"
                onClick={addSection}
                loading={addingSect}
                disabled={addingSect}
              >
                <Plus size={14} className="mr-1.5" /> Add Section
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ────────────────────────────────────────────────────────────
          ADD QUESTION MODAL
      ──────────────────────────────────────────────────────────── */}
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
            onSave={(q) => handleAddQuestion(showAddQuestion, q)}
            onCancel={() => setShowAddQuestion(null)}
          />
        )}
      </Modal>
    </div>
  )
}
