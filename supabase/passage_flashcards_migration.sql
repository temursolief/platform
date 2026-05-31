-- ============================================================
-- Passage Flashcard Collections Migration
-- Run in Supabase SQL Editor after vocabulary_migration.sql
-- ============================================================

-- One flashcard collection per section (passage), created by teacher
CREATE TABLE IF NOT EXISTS public.passage_flashcard_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL UNIQUE REFERENCES public.sections(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual flashcard items in a collection
CREATE TABLE IF NOT EXISTS public.passage_flashcard_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES public.passage_flashcard_collections(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  definition TEXT NOT NULL,
  example_sentence TEXT,
  translation TEXT,
  notes TEXT,
  order_num INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Per-student SM-2 progress for each passage flashcard item
CREATE TABLE IF NOT EXISTS public.passage_flashcard_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.passage_flashcard_items(id) ON DELETE CASCADE,
  ease_factor FLOAT NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 1,
  repetitions INTEGER NOT NULL DEFAULT 0,
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_reviewed_at TIMESTAMPTZ,
  UNIQUE(student_id, item_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pfc_section ON public.passage_flashcard_collections(section_id);
CREATE INDEX IF NOT EXISTS idx_pfc_teacher ON public.passage_flashcard_collections(teacher_id);
CREATE INDEX IF NOT EXISTS idx_pfi_collection ON public.passage_flashcard_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_pfp_student ON public.passage_flashcard_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_pfp_item ON public.passage_flashcard_progress(item_id);
CREATE INDEX IF NOT EXISTS idx_pfp_due ON public.passage_flashcard_progress(student_id, due_date);

-- RLS
ALTER TABLE public.passage_flashcard_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passage_flashcard_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passage_flashcard_progress ENABLE ROW LEVEL SECURITY;

-- Collections: teachers manage their own
CREATE POLICY "Teachers manage own flashcard collections"
  ON public.passage_flashcard_collections FOR ALL
  USING (auth.uid() = teacher_id);

-- Collections: students can view collections for published tests
CREATE POLICY "Students view published flashcard collections"
  ON public.passage_flashcard_collections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sections s
      JOIN public.tests t ON t.id = s.test_id
      WHERE s.id = section_id AND t.is_published = TRUE
    )
  );

-- Items: teachers manage through collection ownership
CREATE POLICY "Teachers manage own flashcard items"
  ON public.passage_flashcard_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.passage_flashcard_collections c
      WHERE c.id = collection_id AND c.teacher_id = auth.uid()
    )
  );

-- Items: students can view items in published-test collections
CREATE POLICY "Students view accessible flashcard items"
  ON public.passage_flashcard_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.passage_flashcard_collections c
      JOIN public.sections s ON s.id = c.section_id
      JOIN public.tests t ON t.id = s.test_id
      WHERE c.id = collection_id AND t.is_published = TRUE
    )
  );

-- Progress: students manage their own
CREATE POLICY "Students manage own passage flashcard progress"
  ON public.passage_flashcard_progress FOR ALL
  USING (auth.uid() = student_id);
