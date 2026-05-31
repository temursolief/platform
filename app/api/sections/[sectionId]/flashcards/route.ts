import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ sectionId: string }> }

// GET /api/sections/[sectionId]/flashcards — fetch collection + items (teacher or any user with section access)
export async function GET(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sectionId } = await params

  const { data: collection, error } = await supabase
    .from('passage_flashcard_collections')
    .select('*, items:passage_flashcard_items(* )')
    .eq('section_id', sectionId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ collection })
}

// PUT /api/sections/[sectionId]/flashcards — upsert collection for a section (teacher only)
export async function PUT(request: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sectionId } = await params

  // Verify teacher owns the test for this section
  const { data: section } = await supabase
    .from('sections')
    .select('id, test_id, title, tests!inner(teacher_id)')
    .eq('id', sectionId)
    .single()

  if (!section) return NextResponse.json({ error: 'Section not found.' }, { status: 404 })

  const testsRaw = section.tests as unknown
  const test = (Array.isArray(testsRaw) ? testsRaw[0] : testsRaw) as { teacher_id: string } | null
  if (test?.teacher_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  let body: { title?: string }
  try { body = await request.json() } catch { body = {} }

  const title = body.title?.trim() || section.title || `Section ${sectionId}`

  const { data: collection, error } = await supabase
    .from('passage_flashcard_collections')
    .upsert(
      { section_id: sectionId, teacher_id: user.id, title },
      { onConflict: 'section_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ collection })
}
