-- ============================================================
-- Vocabulary & Flashcard (Anki-style SM-2) Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- Vocabulary words saved by students
CREATE TABLE IF NOT EXISTS public.vocabulary_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  definition TEXT NOT NULL,
  example_sentence TEXT,
  translation TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, word)
);

-- SM-2 spaced repetition state per vocabulary entry
CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES public.vocabulary_entries(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ease_factor FLOAT NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 1,
  repetitions INTEGER NOT NULL DEFAULT 0,
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_reviewed_at TIMESTAMPTZ,
  UNIQUE(entry_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vocab_entries_student ON public.vocabulary_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_vocab_reviews_due ON public.flashcard_reviews(student_id, due_date);

-- RLS
ALTER TABLE public.vocabulary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own vocabulary"
  ON public.vocabulary_entries FOR ALL
  USING (auth.uid() = student_id);

CREATE POLICY "Students manage own flashcard reviews"
  ON public.flashcard_reviews FOR ALL
  USING (auth.uid() = student_id);

-- Auto-create flashcard_reviews row when a vocabulary entry is inserted
CREATE OR REPLACE FUNCTION public.handle_new_vocabulary_entry()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.flashcard_reviews (entry_id, student_id)
  VALUES (NEW.id, NEW.student_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vocabulary_entry_created ON public.vocabulary_entries;
CREATE TRIGGER on_vocabulary_entry_created
  AFTER INSERT ON public.vocabulary_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_vocabulary_entry();
