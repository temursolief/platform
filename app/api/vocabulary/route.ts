import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/vocabulary — list all vocabulary entries for the current student
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('vocabulary_entries')
    .select('*, review:flashcard_reviews(*)')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entries: data })
}

// POST /api/vocabulary — add a new vocabulary entry
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { word, definition, example_sentence, translation, notes } = body as {
    word: string
    definition: string
    example_sentence?: string
    translation?: string
    notes?: string
  }

  if (!word?.trim()) return NextResponse.json({ error: 'word is required.' }, { status: 400 })
  if (!definition?.trim()) return NextResponse.json({ error: 'definition is required.' }, { status: 400 })

  const { data, error } = await supabase
    .from('vocabulary_entries')
    .insert({
      student_id: user.id,
      word: word.trim(),
      definition: definition.trim(),
      example_sentence: example_sentence?.trim() || null,
      translation: translation?.trim() || null,
      notes: notes?.trim() || null,
    })
    .select('*, review:flashcard_reviews(*)')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: `"${word.trim()}" is already in your vocabulary.` }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ entry: data }, { status: 201 })
}
