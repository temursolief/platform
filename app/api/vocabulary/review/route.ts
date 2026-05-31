import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/vocabulary/review — get cards due for review today
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]

  // Fetch due review IDs first, then join entries
  const { data: dueReviews, error: reviewError } = await supabase
    .from('flashcard_reviews')
    .select('entry_id')
    .eq('student_id', user.id)
    .lte('due_date', today)

  if (reviewError) return NextResponse.json({ error: reviewError.message }, { status: 500 })
  if (!dueReviews?.length) return NextResponse.json({ entries: [] })

  const dueEntryIds = dueReviews.map((r) => r.entry_id)

  const { data, error } = await supabase
    .from('vocabulary_entries')
    .select('*, review:flashcard_reviews(*)')
    .eq('student_id', user.id)
    .in('id', dueEntryIds)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entries: data ?? [] })
}
