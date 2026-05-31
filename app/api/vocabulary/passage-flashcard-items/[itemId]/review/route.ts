import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type Params = { params: Promise<{ itemId: string }> }

// SM-2 algorithm (same as personal vocabulary)
function sm2(
  easeFactor: number,
  intervalDays: number,
  repetitions: number,
  rating: number
): { easeFactor: number; intervalDays: number; repetitions: number; dueDate: string } {
  const q = [0, 3, 4, 5][rating] ?? 0
  let ef = easeFactor, interval = intervalDays, reps = repetitions

  if (q < 3) {
    reps = 0; interval = 1
  } else {
    ef = Math.max(1.3, ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    if (reps === 0) interval = 1
    else if (reps === 1) interval = 6
    else interval = Math.round(interval * ef)
    reps += 1
  }

  const due = new Date()
  due.setDate(due.getDate() + interval)
  return { easeFactor: ef, intervalDays: interval, repetitions: reps, dueDate: due.toISOString().split('T')[0] }
}

// POST /api/vocabulary/passage-flashcard-items/[itemId]/review
export async function POST(request: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { itemId } = await params

  let body: { rating: number }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }) }

  const { rating } = body
  if (typeof rating !== 'number' || rating < 0 || rating > 3) {
    return NextResponse.json({ error: 'rating must be 0-3.' }, { status: 400 })
  }

  // Fetch current progress (if any)
  const { data: existing } = await supabase
    .from('passage_flashcard_progress')
    .select('ease_factor, interval_days, repetitions')
    .eq('student_id', user.id)
    .eq('item_id', itemId)
    .maybeSingle()

  const current = existing ?? { ease_factor: 2.5, interval_days: 1, repetitions: 0 }
  const next = sm2(current.ease_factor, current.interval_days, current.repetitions, rating)

  const { error } = await supabase
    .from('passage_flashcard_progress')
    .upsert(
      {
        student_id: user.id,
        item_id: itemId,
        ease_factor: next.easeFactor,
        interval_days: next.intervalDays,
        repetitions: next.repetitions,
        due_date: next.dueDate,
        last_reviewed_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,item_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, next })
}
