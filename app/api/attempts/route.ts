import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/attempts — list current user's attempts
export async function GET(_request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: attempts, error } = await supabase
    .from('attempts')
    .select('*, tests(id, title, type, difficulty)')
    .eq('student_id', user.id)
    .eq('is_completed', true)
    .order('submitted_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ attempts })
}
