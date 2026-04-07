import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, BookOpen, Headphones, Edit2, BarChart2 } from 'lucide-react'
import { formatDate, formatDifficulty } from '@/lib/utils/format'

export default async function TeacherTestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tests } = await supabase
    .from('tests')
    .select('*')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Manage Tests</h1>
          <p className="text-neutral-500 mt-1">{tests?.length ?? 0} tests total</p>
        </div>
        <Link
          href="/teacher/tests/new"
          className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <Plus size={16} />
          New Test
        </Link>
      </div>

      {!tests?.length ? (
        <div className="text-center py-16 text-neutral-400">
          <BookOpen size={40} className="mx-auto mb-4 opacity-40" />
          <p className="mb-2">No tests yet.</p>
          <Link
            href="/teacher/tests/new"
            className="text-sm text-blue-600 hover:underline"
          >
            Create your first test
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {tests.map((test) => (
            <Card key={test.id}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0">
                  {test.type === 'listening' ? (
                    <Headphones size={22} className="text-neutral-600" />
                  ) : (
                    <BookOpen size={22} className="text-neutral-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-neutral-900 text-sm">{test.title}</h3>
                    <Badge variant={test.type === 'listening' ? 'listening' : 'reading'}>
                      {test.type}
                    </Badge>
                    <Badge>{formatDifficulty(test.difficulty)}</Badge>
                    <Badge variant={test.is_published ? 'success' : 'default'}>
                      {test.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                    <span>{test.time_limit_minutes} min</span>
                    <span>·</span>
                    <span>{test.total_questions} questions</span>
                    <span>·</span>
                    <span>Created {formatDate(test.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/teacher/tests/${test.id}/analytics`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs text-neutral-600 hover:bg-neutral-50 transition-colors"
                  >
                    <BarChart2 size={14} />
                    Analytics
                  </Link>
                  <Link
                    href={`/teacher/tests/${test.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs text-neutral-600 hover:bg-neutral-50 transition-colors"
                  >
                    <Edit2 size={14} />
                    Edit
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
