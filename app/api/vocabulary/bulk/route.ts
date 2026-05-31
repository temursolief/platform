import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ParsedVocabularyEntry } from '@/lib/vocabulary/parse-import'

// POST /api/vocabulary/bulk
// Save multiple personal vocabulary entries at once (students)
// Duplicates (same word) are skipped silently
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { entries: ParsedVocabularyEntry[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { entries } = body
  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ error: 'entries array is required.' }, { status: 400 })
  }
  if (entries.length > 500) {
    return NextResponse.json({ error: 'Max 500 entries per import.' }, { status: 400 })
  }

  const rows = entries
    .filter((e) => e.word?.trim())
    .map((e) => ({
      student_id: user.id,
      word: e.word.trim(),
      definition: e.definition.trim(),
      example_sentence: e.example_sentence?.trim() || null,
      translation: e.translation?.trim() || null,
      notes: e.notes?.trim() || null,
    }))

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No valid entries to save.' }, { status: 400 })
  }

  // onConflict: skip duplicates (student_id, word) silently
  const { data, error } = await supabase
    .from('vocabulary_entries')
    .upsert(rows, { onConflict: 'student_id,word', ignoreDuplicates: true })
    .select('id, word')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ saved: data?.length ?? 0, total: rows.length })
}
