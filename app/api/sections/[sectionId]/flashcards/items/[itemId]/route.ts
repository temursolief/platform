import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ sectionId: string; itemId: string }> }

// DELETE /api/sections/[sectionId]/flashcards/items/[itemId] — remove a flashcard item
export async function DELETE(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sectionId, itemId } = await params

  // Verify teacher owns the collection for this section
  const { data: collection } = await supabase
    .from('passage_flashcard_collections')
    .select('id, teacher_id')
    .eq('section_id', sectionId)
    .single()

  if (!collection || collection.teacher_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const { error } = await supabase
    .from('passage_flashcard_items')
    .delete()
    .eq('id', itemId)
    .eq('collection_id', collection.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
