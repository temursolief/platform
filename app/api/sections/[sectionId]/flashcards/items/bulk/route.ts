import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ParsedVocabularyEntry } from '@/lib/vocabulary/parse-import'

type Params = { params: Promise<{ sectionId: string }> }

// POST /api/sections/[sectionId]/flashcards/items/bulk
// Save multiple flashcard items to a passage collection (teachers only)
export async function POST(request: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sectionId } = await params

  let body: { entries: ParsedVocabularyEntry[]; collectionTitle?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { entries, collectionTitle } = body
  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ error: 'entries array is required.' }, { status: 400 })
  }
  if (entries.length > 500) {
    return NextResponse.json({ error: 'Max 500 entries per import.' }, { status: 400 })
  }

  // Verify teacher owns the section's test
  const { data: section } = await supabase
    .from('sections')
    .select('id, title, test_id, tests!inner(teacher_id)')
    .eq('id', sectionId)
    .single()

  if (!section) return NextResponse.json({ error: 'Section not found.' }, { status: 404 })

  const testRaw = section.tests as unknown
  const test = (Array.isArray(testRaw) ? testRaw[0] : testRaw) as { teacher_id: string } | null
  if (test?.teacher_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  // Upsert collection (create if not exists, keep existing title unless provided)
  const title = collectionTitle?.trim() || section.title || `Section ${sectionId}`
  const { data: collection, error: colError } = await supabase
    .from('passage_flashcard_collections')
    .upsert(
      { section_id: sectionId, teacher_id: user.id, title },
      { onConflict: 'section_id' }
    )
    .select('id')
    .single()

  if (colError || !collection) {
    return NextResponse.json({ error: colError?.message ?? 'Failed to create collection.' }, { status: 500 })
  }

  // Get current item count for order_num sequencing
  const { count: existing } = await supabase
    .from('passage_flashcard_items')
    .select('id', { count: 'exact', head: true })
    .eq('collection_id', collection.id)

  const startOrder = (existing ?? 0) + 1
  const rows = entries
    .filter((e) => e.word?.trim())
    .map((e, i) => ({
      collection_id: collection.id,
      word: e.word.trim(),
      definition: e.definition.trim(),
      example_sentence: e.example_sentence?.trim() || null,
      translation: e.translation?.trim() || null,
      notes: e.notes?.trim() || null,
      order_num: startOrder + i,
    }))

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No valid entries to save.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('passage_flashcard_items')
    .insert(rows)
    .select('id, word')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ saved: data?.length ?? 0, total: rows.length, collectionId: collection.id })
}
