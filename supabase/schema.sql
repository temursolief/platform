-- ============================================================
-- IELTS Platform — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor to initialize the database
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Users table (synced with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_sign_in TIMESTAMPTZ
);

-- Tests table
CREATE TABLE IF NOT EXISTS public.tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('listening', 'reading')),
    difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    time_limit_minutes INTEGER NOT NULL DEFAULT 60,
    total_questions INTEGER NOT NULL DEFAULT 40,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sections table (e.g., Listening Section 1, Reading Passage 1)
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    order_num INTEGER NOT NULL,
    title TEXT,
    passage_html TEXT,
    audio_url TEXT,
    audio_duration_seconds INTEGER,
    instructions TEXT,
    time_limit_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    order_num INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'multiple_choice',
        'true_false_ng',
        'matching',
        'fill_blank',
        'short_answer',
        'sentence_completion',
        'diagram_label',
        'summary_completion',
        'list_selection'
    )),
    question_text TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    acceptable_answers TEXT[],
    points INTEGER DEFAULT 1,
    hint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multiple choice options
CREATE TABLE IF NOT EXISTS public.options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE
);

-- Student test attempts
CREATE TABLE IF NOT EXISTS public.attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    raw_score INTEGER,
    total_questions INTEGER,
    band_score DECIMAL(2,1),
    time_taken_seconds INTEGER,
    is_completed BOOLEAN DEFAULT FALSE,
    UNIQUE(student_id, test_id, started_at)
);

-- Student answers
CREATE TABLE IF NOT EXISTS public.answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    given_answer TEXT,
    is_correct BOOLEAN,
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(attempt_id, question_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tests_teacher ON public.tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tests_published ON public.tests(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_sections_test ON public.sections(test_id);
CREATE INDEX IF NOT EXISTS idx_questions_section ON public.questions(section_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON public.attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_test ON public.attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_answers_attempt ON public.answers(attempt_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Tests
CREATE POLICY "Teachers can manage own tests"
    ON public.tests FOR ALL
    USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view published tests"
    ON public.tests FOR SELECT
    USING (is_published = TRUE);

-- Sections (readable if test is readable)
CREATE POLICY "Sections readable with test"
    ON public.sections FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tests t
            WHERE t.id = test_id
            AND (t.is_published = TRUE OR t.teacher_id = auth.uid())
        )
    );

CREATE POLICY "Teachers manage own sections"
    ON public.sections FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.tests t
            WHERE t.id = test_id AND t.teacher_id = auth.uid()
        )
    );

-- Questions
CREATE POLICY "Questions readable with test"
    ON public.questions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.sections s
            JOIN public.tests t ON t.id = s.test_id
            WHERE s.id = section_id
            AND (t.is_published = TRUE OR t.teacher_id = auth.uid())
        )
    );

CREATE POLICY "Teachers manage own questions"
    ON public.questions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.sections s
            JOIN public.tests t ON t.id = s.test_id
            WHERE s.id = section_id AND t.teacher_id = auth.uid()
        )
    );

-- Options
CREATE POLICY "Options readable with question"
    ON public.options FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.questions q
            JOIN public.sections s ON s.id = q.section_id
            JOIN public.tests t ON t.id = s.test_id
            WHERE q.id = question_id
            AND (t.is_published = TRUE OR t.teacher_id = auth.uid())
        )
    );

CREATE POLICY "Teachers manage own options"
    ON public.options FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.questions q
            JOIN public.sections s ON s.id = q.section_id
            JOIN public.tests t ON t.id = s.test_id
            WHERE q.id = question_id AND t.teacher_id = auth.uid()
        )
    );

-- Attempts
CREATE POLICY "Students manage own attempts"
    ON public.attempts FOR ALL
    USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view attempts on own tests"
    ON public.attempts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tests t
            WHERE t.id = test_id AND t.teacher_id = auth.uid()
        )
    );

-- Answers
CREATE POLICY "Students manage own answers"
    ON public.answers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.attempts a
            WHERE a.id = attempt_id AND a.student_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can view answers on own tests"
    ON public.answers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.attempts a
            JOIN public.tests t ON t.id = a.test_id
            WHERE a.id = attempt_id AND t.teacher_id = auth.uid()
        )
    );

-- ============================================================
-- TRIGGER: Auto-create user profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        'student'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STORAGE BUCKETS
-- Run in Supabase Dashboard > Storage, or via API:
--   supabase.storage.createBucket('audio', { public: true })
--   supabase.storage.createBucket('passages', { public: true })
-- ============================================================

-- ============================================================
-- PROMOTE A USER TO TEACHER (run manually as needed)
-- Replace 'user@example.com' with the actual email
-- ============================================================
-- UPDATE public.users SET role = 'teacher' WHERE email = 'user@example.com';
