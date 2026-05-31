'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, BookOpen, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import type { PassageFlashcardItem } from '@/lib/types'
import { ImportVocabularyModal } from '@/components/vocabulary/ImportVocabularyModal'

interface Props {
  sectionId: string
  sectionTitle: string
}

interface ItemFormState {
  word: string
  definition: string
  example_sentence: string
  translation: string
  notes: string
}

const EMPTY_FORM: ItemFormState = {
  word: '', definition: '', example_sentence: '', translation: '', notes: '',
}

export function SectionFlashcardManager({ sectionId, sectionTitle }: Props) {
  const [open, setOpen] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [items, setItems] = useState<PassageFlashcardItem[]>([])
  const [collectionExists, setCollectionExists] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<ItemFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCollection = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sections/${sectionId}/flashcards`)
      const data = await res.json()
      if (data.collection) {
        setCollectionExists(true)
        setItems(data.collection.items ?? [])
      } else {
        setCollectionExists(false)
        setItems([])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [sectionId])

  useEffect(() => {
    if (open) loadCollection()
  }, [open, loadCollection])

  const ensureCollection = async (): Promise<boolean> => {
    if (collectionExists) return true
    const res = await fetch(`/api/sections/${sectionId}/flashcards`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: sectionTitle }),
    })
    if (!res.ok) return false
    setCollectionExists(true)
    return true
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const ok = await ensureCollection()
      if (!ok) { setError('Failed to initialise collection.'); return }

      const res = await fetch(`/api/sections/${sectionId}/flashcards/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setItems((prev) => [...prev, data.item])
      setForm(EMPTY_FORM)
    } catch {
      setError('Network error.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Remove this flashcard?')) return
    await fetch(`/api/sections/${sectionId}/flashcards/items/${itemId}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((i) => i.id !== itemId))
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-xs text-neutral-600"
        title="Manage vocabulary flashcards for this passage"
      >
        <BookOpen size={14} className="mr-1" />
        Flashcards {items.length > 0 ? `(${items.length})` : ''}
      </Button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`Flashcards — ${sectionTitle}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Existing items */}
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-neutral-400 italic">
              No flashcards yet. Add vocabulary words students should learn for this passage.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-neutral-50 border border-neutral-200 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-900">{item.word}</span>
                      {item.translation && (
                        <span className="text-xs text-neutral-400">({item.translation})</span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{item.definition}</p>
                    {item.example_sentence && (
                      <p className="text-xs text-neutral-400 mt-0.5 italic line-clamp-1">
                        &ldquo;{item.example_sentence}&rdquo;
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 rounded text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-neutral-200" />

          {/* Bulk import button */}
          <div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowImport(true)}
              className="w-full justify-center"
            >
              <Upload size={14} className="mr-1.5" /> Import from .apkg or .json
            </Button>
          </div>

          {/* Add form */}
          <form onSubmit={handleAddItem} className="space-y-3">
            <p className="text-sm font-semibold text-neutral-700">Add Flashcard</p>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Word *"
                value={form.word}
                onChange={(e) => setForm((f) => ({ ...f, word: e.target.value }))}
                placeholder="e.g. ubiquitous"
                required
              />
              <Input
                label="Translation"
                value={form.translation}
                onChange={(e) => setForm((f) => ({ ...f, translation: e.target.value }))}
                placeholder="in students' language"
              />
            </div>

            <Textarea
              label="Definition *"
              value={form.definition}
              onChange={(e) => setForm((f) => ({ ...f, definition: e.target.value }))}
              placeholder="Present everywhere at the same time"
              required
            />

            <Input
              label="Example sentence"
              value={form.example_sentence}
              onChange={(e) => setForm((f) => ({ ...f, example_sentence: e.target.value }))}
              placeholder="Mobile phones have become ubiquitous in modern life."
            />

            <Input
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Memory hook or usage context"
            />

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" size="sm" loading={saving} disabled={saving}>
                <Plus size={14} className="mr-1.5" /> Add Flashcard
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setForm(EMPTY_FORM)}>
                Clear
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {showImport && (
        <ImportVocabularyModal
          context="teacher"
          sectionId={sectionId}
          onImported={(_parsed, savedCount) => {
            if (savedCount > 0) loadCollection()
          }}
          onClose={() => setShowImport(false)}
        />
      )}
    </>
  )
}
