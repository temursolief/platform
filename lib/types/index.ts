export type UserRole = 'student' | 'teacher' | 'admin'

export type TestType = 'listening' | 'reading'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export type QuestionType =
  | 'multiple_choice'
  | 'true_false_ng'
  | 'matching'
  | 'fill_blank'
  | 'short_answer'
  | 'sentence_completion'
  | 'diagram_label'
  | 'summary_completion'
  | 'list_selection'

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
