import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, BookOpen, Headphones, ChevronRight } from 'lucide-react'
import { formatBandScore, formatDifficulty } from '@/lib/utils/format'

export default async function StudentTestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch published tests
  const { data: tests } = await supabase
    .from('tests')
    .select('id, title, type, difficulty, time_limit_minutes, total_questions, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  // Fetch user's completed attempts for these tests
  const { data: attempts } = await supabase
    .from('attempts')
    .select('test_id, band_score, raw_score, total_questions, submitted_at')
    .eq('student_id', user.id)
    .eq('is_completed', true)

  const attemptMap = new Map(attempts?.map((a) => [a.test_id, a]) ?? [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Available Tests</h1>
        <p className="text-neutral-500 mt-1">{tests?.length ?? 0} tests available</p>
      </div>

      {!tests?.length ? (
        <div className="text-center py-16 text-neutral-400">
          <BookOpen size={40} className="mx-auto mb-4 opacity-40" />
          <p>No tests available yet. Check back soon.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tests.map((test) => {
            const attempt = attemptMap.get(test.id)
            return (
              <Link key={test.id} href={`/student/tests/${test.id}`}>
                <Card hoverable className="group">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 group-hover:bg-neutral-200 transition-colors">
                      {test.type === 'listening' ? (
                        <Headphones size={22} className="text-neutral-600" />
                      ) : (
                        <BookOpen size={22} className="text-neutral-600" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-neutral-900 text-sm">{test.title}</h3>
                        <Badge variant={test.type === 'listening' ? 'listening' : 'reading'}>
                          {test.type}
                        </Badge>
                        <Badge>{formatDifficulty(test.difficulty)}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-neutral-500 flex items-center gap-1">
                          <Clock size={12} /> {test.time_limit_minutes} min
                        </span>
                        <span className="text-xs text-neutral-500">
                          {test.total_questions} questions
                        </span>
                        {attempt && (
                          <span className="text-xs text-neutral-500">
                            Best: {formatBandScore(attempt.band_score)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status / Action */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {attempt ? (
                        <span className="text-sm font-bold text-neutral-900 tabular-nums">
                          {formatBandScore(attempt.band_score)}
                        </span>
                      ) : (
                        <span className="text-xs text-blue-600 font-medium">Start</span>
                      )}
                      <ChevronRight size={16} className="text-neutral-400" />
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
