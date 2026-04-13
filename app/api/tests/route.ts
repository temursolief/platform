import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/tests — list published tests (students) or own tests (teachers)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin'

  let query = supabase
    .from('tests')
    .select('id, title, type, difficulty, time_limit_minutes, total_questions, is_published, created_at')
    .order('created_at', { ascending: false })

  if (isTeacher) {
    query = query.eq('teacher_id', user.id) as typeof query
  } else {
    query = query.eq('is_published', true) as typeof query
  }

  const { data: tests, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tests })
}

// POST /api/tests — create a new test (teachers only)
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'student') {
    return NextResponse.json({ error: 'Only teachers can create tests.' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { title, type, difficulty, time_limit_minutes, sections = [], manual = false, is_published = false } = body as {
    title: string
    type?: string
    difficulty?: string
    time_limit_minutes?: number
    sections: RawSection[]
    manual?: boolean
    is_published?: boolean
  }

  if (!title?.trim()) {
    return NextResponse.json({ error: 'title is required.' }, { status: 400 })
  }
  if (type && type !== 'reading') {
    return NextResponse.json({ error: 'type must be "reading".' }, { status: 400 })
  }

  // Count total questions upfront
  const totalQuestions = (sections as RawSection[]).reduce(
    (acc, s) => acc + (s.questions?.length ?? 0),
    0
  )

  // --- Create the test row ---
  const { data: test, error: testError } = await supabase
    .from('tests')
    .insert({
      teacher_id: user.id,
      title: title.trim(),
      type: 'reading',
      difficulty: difficulty ?? 'intermediate',
      time_limit_minutes: time_limit_minutes ?? 60,
      total_questions: totalQuestions || 0,
      is_published: is_published ?? false,
    })
    .select()
    .single()

  if (testError) {
    return NextResponse.json({ error: `Could not create test: ${testError.message}` }, { status: 500 })
  }

  // If manual (no sections from JSON), return early
  if (manual || (sections as RawSection[]).length === 0) {
    return NextResponse.json({ test })
  }

  // --- Insert sections + questions (batched per section) ---
  const errors: string[] = []
  const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

  for (let si = 0; si < (sections as RawSection[]).length; si++) {
    const sec = (sections as RawSection[])[si]

    const { data: section, error: secError } = await supabase
      .from('sections')
      .insert({
        test_id: test.id,
        order_num: si + 1,
        title: sec.title ?? `Section ${si + 1}`,
        instructions: sec.instructions ?? null,
        passage_html: sec.passage_html ?? null,
      })
      .select()
      .single()

    if (secError) {
      errors.push(`Section ${si + 1}: ${secError.message}`)
      continue
    }

    // Flatten questions — support both top-level questions[] and question_groups[]
    const flatQuestions: RawQuestion[] = flattenQuestions(sec)

    if (flatQuestions.length === 0) continue

    // Build question rows for bulk insert
    const questionRows = flatQuestions.map((q, qi) => ({
      section_id: section.id,
      order_num: q.number ?? qi + 1,
      type: normaliseType(q.type),
      question_text: q.question_text ?? q.questionText ?? '',
      correct_answer: String(q.correct_answer ?? q.answer ?? ''),
      acceptable_answers: Array.isArray(q.acceptable_answers)
        ? q.acceptable_answers
        : q.acceptable_answers
        ? [String(q.acceptable_answers)]
        : null,
      image_url: q.image_url ?? null,
      hint: q.hint ?? null,
      points: 1,
    }))

    // Bulk insert all questions for this section at once
    const { data: insertedQuestions, error: qBulkError } = await supabase
      .from('questions')
      .insert(questionRows)
      .select()

    if (qBulkError) {
      errors.push(`Section ${si + 1} questions bulk insert: ${qBulkError.message}`)
      continue
    }

    if (!insertedQuestions?.length) continue

    // Build option rows for all questions in one pass
    const optionRows: {
      question_id: string
      label: string
      option_text: string
      is_correct: boolean
    }[] = []

    for (let qi = 0; qi < flatQuestions.length; qi++) {
      const q = flatQuestions[qi]
      const dbQ = insertedQuestions[qi]
      if (!dbQ) continue

      const qType = normaliseType(q.type)
      const correctLabel = String(q.correct_answer ?? '').toUpperCase()

      if (qType === 'multiple_choice' && q.options?.length) {
        // MC: label options A B C D
        q.options.forEach((optText, oi) => {
          const label = OPTION_LABELS[oi] ?? String.fromCharCode(65 + oi)
          optionRows.push({
            question_id: dbQ.id,
            label,
            option_text: String(optText),
            is_correct: label === correctLabel,
          })
        })
      } else if (q.match_options?.length) {
        // Matching / headings: store verbatim
        q.match_options.forEach((opt) => {
          const label = String(opt)
          optionRows.push({
            question_id: dbQ.id,
            label,
            option_text: label,
            is_correct: label.toUpperCase() === correctLabel,
          })
        })
      } else if (q.word_bank?.length) {
        // Summary/sentence completion word bank: store as options
        q.word_bank.forEach((word, oi) => {
          const label = OPTION_LABELS[oi] ?? String(word)
          optionRows.push({
            question_id: dbQ.id,
            label,
            option_text: String(word),
            is_correct: String(word).toLowerCase() === String(q.correct_answer ?? '').toLowerCase(),
          })
        })
      }
    }

    // Bulk insert all options for this section
    if (optionRows.length > 0) {
      const { error: optBulkError } = await supabase.from('options').insert(optionRows)
      if (optBulkError) {
        errors.push(`Section ${si + 1} options bulk insert: ${optBulkError.message}`)
      }
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ test, warnings: errors })
  }

  return NextResponse.json({ test })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface RawSection {
  title?: string
  instructions?: string
  passage_html?: string
  audio_filename?: string
  /** Top-level flat question list */
  questions?: RawQuestion[]
  /** Optional grouped questions — each group may share match_options / word_bank / image_url */
  question_groups?: RawQuestionGroup[]
}

interface RawQuestionGroup {
  instructions?: string
  /** Shared image for the whole group (map, diagram, etc.) */
  image_url?: string
  /** Shared dropdown options for matching types */
  match_options?: string[]
  /** Shared word bank for completion-with-word-box types */
  word_bank?: string[]
  questions: RawQuestion[]
}

interface RawQuestion {
  number?: number
  type?: string
  question_text?: string
  questionText?: string
  /** Image specific to this question */
  image_url?: string
  /** Standard MC choices — labelled A, B, C, D automatically */
  options?: string[]
  /** Matching / heading choices — stored verbatim as option rows */
  match_options?: string[]
  /** Word bank for summary/sentence completion with dropdown */
  word_bank?: string[]
  correct_answer?: string | number
  answer?: string
  acceptable_answers?: string[] | string
  hint?: string
}

/** Flatten section questions, inheriting group-level image_url / match_options / word_bank */
function flattenQuestions(sec: RawSection): RawQuestion[] {
  const result: RawQuestion[] = []

  if (sec.questions?.length) {
    result.push(...sec.questions)
  }

  for (const group of sec.question_groups ?? []) {
    for (const q of group.questions ?? []) {
      result.push({
        ...q,
        image_url: q.image_url ?? group.image_url,
        match_options: q.match_options ?? group.match_options,
        word_bank: q.word_bank ?? group.word_bank,
      })
    }
  }

  // Sort by question number so order_num is consistent
  result.sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
  return result
}

const TYPE_MAP: Record<string, string> = {
  // Multiple choice
  mc: 'multiple_choice',
  multiple_choice: 'multiple_choice',
  // True / False / Not Given
  tfng: 'true_false_ng',
  true_false_ng: 'true_false_ng',
  true_false: 'true_false_ng',
  // Yes / No / Not Given
  ynng: 'yes_no_ng',
  yes_no_ng: 'yes_no_ng',
  yes_no: 'yes_no_ng',
  // Matching types
  matching: 'matching',
  matching_headings: 'matching_headings',
  matching_heading: 'matching_headings',
  matching_information: 'matching_information',
  matching_info: 'matching_information',
  matching_features: 'matching_features',
  matching_feature: 'matching_features',
  matching_sentence_endings: 'matching_sentence_endings',
  matching_sentence_ending: 'matching_sentence_endings',
  matching_endings: 'matching_sentence_endings',
  // Completion types
  sentence_completion: 'sentence_completion',
  summary_completion: 'summary_completion',
  note_table_flowchart_completion: 'note_table_flowchart_completion',
  note_completion: 'note_table_flowchart_completion',
  table_completion: 'note_table_flowchart_completion',
  flowchart_completion: 'note_table_flowchart_completion',
  flow_chart_completion: 'note_table_flowchart_completion',
  form_completion: 'note_table_flowchart_completion',
  // Diagram / label
  diagram_label: 'diagram_label',
  diagram_labelling: 'diagram_label',
  diagram_labeling: 'diagram_label',
  map_labelling: 'diagram_label',
  map_labeling: 'diagram_label',
  plan_labelling: 'diagram_label',
  // Short answer
  short_answer: 'short_answer',
  // List / selection
  list_selection: 'list_selection',
  // Legacy fill_blank
  fill_blank: 'fill_blank',
  fill_in_the_blank: 'fill_blank',
  fill_in_blank: 'fill_blank',
}

function normaliseType(raw?: string): string {
  if (!raw) return 'fill_blank'
  const key = raw.toLowerCase().replace(/[\s-]/g, '_')
  return TYPE_MAP[key] ?? 'fill_blank'
}
