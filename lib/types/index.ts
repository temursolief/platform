export type UserRole = 'student' | 'teacher' | 'admin'

export type TestType = 'reading'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

// Reading question types
// matching_headings        — match headings to text sections
// true_false_ng            — True / False / Not Given (writer's views/claims)
// yes_no_ng                — Yes / No / Not Given (factual information)
// multiple_choice          — standard A-D (or A-C) MC
// summary_completion       — fill blanks in a summary
// matching_information     — match information to paragraphs (A, B, C…)
// matching_features        — match features to a list of people/things
// matching_sentence_endings — match sentence halves from two lists
// sentence_completion      — complete sentences with words from passage
// note_table_flowchart_completion — notes / table / flow-chart / form blanks
// diagram_label            — label a diagram (Reading & Listening)
// short_answer             — free-text, word-limit answer
// Listening question types (overlap with Reading + extras)
// matching                 — generic listening match (answer from a list)
// list_selection           — select from a printed list (A-H style)
// Legacy / general
// fill_blank               — kept for backward compatibility
export type QuestionType =
  // Reading
  | 'multiple_choice'
  | 'true_false_ng'
  | 'yes_no_ng'
  | 'matching_headings'
  | 'matching_information'
  | 'matching_features'
  | 'matching_sentence_endings'
  | 'sentence_completion'
  | 'summary_completion'
  | 'note_table_flowchart_completion'
  | 'diagram_label'
  | 'short_answer'
  // Listening / shared
  | 'matching'
  | 'list_selection'
  // Legacy
  | 'fill_blank'

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  last_sign_in: string | null
}

export interface Test {
  id: string
  teacher_id: string
  title: string
  type: TestType
  difficulty: Difficulty
  time_limit_minutes: number
  total_questions: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface Section {
  id: string
  test_id: string
  order_num: number
  title: string | null
  passage_html: string | null
  audio_url: string | null
  audio_duration_seconds: number | null
  instructions: string | null
  time_limit_seconds: number | null
  created_at: string
}

export interface Question {
  id: string
  section_id: string
  order_num: number
  type: QuestionType
  question_text: string
  correct_answer: string
  acceptable_answers: string[] | null
  /** URL of an image shown with this question (diagram, map, plan, etc.) */
  image_url: string | null
  points: number
  hint: string | null
  created_at: string
  options?: Option[]
}

export interface Option {
  id: string
  question_id: string
  label: string
  option_text: string
  is_correct: boolean
}

export interface Attempt {
  id: string
  student_id: string
  test_id: string
  started_at: string
  submitted_at: string | null
  raw_score: number | null
  total_questions: number | null
  band_score: number | null
  time_taken_seconds: number | null
  is_completed: boolean
}

export interface Answer {
  id: string
  attempt_id: string
  question_id: string
  given_answer: string | null
  is_correct: boolean | null
  answered_at: string
}

// Extended types with relations
export interface TestWithSections extends Test {
  sections: SectionWithQuestions[]
}

export interface SectionWithQuestions extends Section {
  questions: Question[]
}

export interface AttemptWithDetails extends Attempt {
  test: Test
  answers: Answer[]
}

// API response types
export interface SubmitTestResponse {
  attempt: Attempt
  results: Record<string, boolean>
  summary: {
    rawScore: number
    totalQuestions: number
    bandScore: number
    timeTaken: number
  }
}

export interface TestListItem {
  id: string
  title: string
  type: TestType
  difficulty: Difficulty
  time_limit_minutes: number
  total_questions: number
  created_at: string
  teacher?: {
    full_name: string | null
  }
  attempt?: Attempt | null
}

export interface TeacherAnalytics {
  testId: string
  testTitle: string
  totalAttempts: number
  averageBandScore: number
  averageRawScore: number
  completionRate: number
  questionStats: {
    questionId: string
    questionText: string
    correctRate: number
  }[]
}

export interface StudentStats {
  totalAttempts: number
  averageBandScore: number
  bestBandScore: number
  recentAttempts: AttemptWithDetails[]
  scoreHistory: {
    date: string
    bandScore: number
    type: TestType
  }[]
}
