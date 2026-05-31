import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// SM-2 algorithm
// rating: 0=Again, 1=Hard, 2=Good, 3=Easy
function sm2(
  easeFactor: number,
  intervalDays: number,
  repetitions: number,
  rating: number
): { easeFactor: number; intervalDays: number; repetitions: number; dueDate: string } {
  // Map 0-3 rating to SM-2 quality 0-5
  const q = [0, 3, 4, 5][rating] ?? 0

  let ef = easeFactor
  let interval = intervalDays
  let reps = repetitions

  if (q < 3) {
    reps = 0
    interval = 1
  } else {
    ef = Math.max(1.3, ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    if (reps === 0) {
      interval = 1
    } else if (reps === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * ef)
    }
    reps += 1
  }

  const due = new Date()
  due.setDate(due.getDate() + interval)
  const dueDate = due.toISOString().split('T')[0]

  return { easeFactor: ef, intervalDays: interval, repetitions: reps, dueDate }
}

// POST /api/vocabulary/[id]/review — submit a review rating for a card
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  let body: { rating: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { rating } = body
  if (typeof rating !== 'number' || rating < 0 || rating > 3) {
    return NextResponse.json({ error: 'rating must be 0, 1, 2, or 3.' }, { status: 400 })
  }

  // Fetch current review state
  const { data: entry, error: fetchError } = await supabase
    .from('vocabulary_entries')
    .select('id, flashcard_reviews(*)')
    .eq('id', id)
    .eq('student_id', user.id)
    .single()

  if (fetchError || !entry) {
    return NextResponse.json({ error: 'Entry not found.' }, { status: 404 })
  }

  const reviews = entry.flashcard_reviews as {
    id: string; ease_factor: number; interval_days: number; repetitions: number
  }[] | null

  const current = reviews?.[0]
  if (!current) {
    return NextResponse.json({ error: 'Review record not found.' }, { status: 404 })
  }

  const next = sm2(current.ease_factor, current.interval_days, current.repetitions, rating)

  const { error: updateError } = await supabase
    .from('flashcard_reviews')
    .update({
      ease_factor: next.easeFactor,
      interval_days: next.intervalDays,
      repetitions: next.repetitions,
      due_date: next.dueDate,
      last_reviewed_at: new Date().toISOString(),
    })
    .eq('id', current.id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ ok: true, next })
}
