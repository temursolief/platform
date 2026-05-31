import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ sectionId: string }> }

// POST /api/sections/[sectionId]/flashcards/items — add a flashcard item (teacher only)
export async function POST(request: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sectionId } = await params

  // Resolve collection (must belong to a test this teacher owns)
  const { data: collection } = await supabase
    .from('passage_flashcard_collections')
    .select('id, teacher_id')
    .eq('section_id', sectionId)
    .single()

  if (!collection) return NextResponse.json({ error: 'Collection not found. Create it first.' }, { status: 404 })
  if (collection.teacher_id !== user.id) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }) }

  const { word, definition, example_sentence, translation, notes } = body as {
    word: string; definition: string
    example_sentence?: string; translation?: string; notes?: string
  }

  if (!word?.trim()) return NextResponse.json({ error: 'word is required.' }, { status: 400 })
  if (!definition?.trim()) return NextResponse.json({ error: 'definition is required.' }, { status: 400 })

  // Get next order_num
  const { count } = await supabase
    .from('passage_flashcard_items')
    .select('id', { count: 'exact', head: true })
    .eq('collection_id', collection.id)

  const { data: item, error } = await supabase
    .from('passage_flashcard_items')
    .insert({
      collection_id: collection.id,
      word: word.trim(),
      definition: definition.trim(),
      example_sentence: example_sentence?.trim() || null,
      translation: translation?.trim() || null,
      notes: notes?.trim() || null,
      order_num: (count ?? 0) + 1,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item }, { status: 201 })
}
