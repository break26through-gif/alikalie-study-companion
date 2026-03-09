
-- Quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quiz questions (multiple choice or open-ended)
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice', -- 'multiple_choice' or 'open_ended'
  options JSONB, -- array of strings for multiple choice
  correct_answer TEXT, -- for multiple choice
  sort_order INT DEFAULT 0
);

-- Quiz responses from students
CREATE TABLE public.quiz_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  answer TEXT NOT NULL,
  is_correct BOOLEAN,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(question_id, user_id)
);

-- Announcements (owner-only posts)
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add file_url column to assignment_submissions for file uploads
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Storage bucket for assignment files
INSERT INTO storage.buckets (id, name, public) VALUES ('assignment-files', 'assignment-files', true) ON CONFLICT (id) DO NOTHING;

-- RLS for quizzes
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view quizzes" ON public.quizzes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM classroom_members cm WHERE cm.classroom_id = quizzes.classroom_id AND cm.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner can create quizzes" ON public.quizzes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND EXISTS (SELECT 1 FROM classroom_members cm WHERE cm.classroom_id = quizzes.classroom_id AND cm.user_id = auth.uid() AND cm.role = 'owner'));
CREATE POLICY "Owner can delete quizzes" ON public.quizzes FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- RLS for quiz_questions
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view questions" ON public.quiz_questions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM quizzes q JOIN classroom_members cm ON cm.classroom_id = q.classroom_id WHERE q.id = quiz_questions.quiz_id AND cm.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner can manage questions" ON public.quiz_questions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM quizzes q JOIN classroom_members cm ON cm.classroom_id = q.classroom_id WHERE q.id = quiz_questions.quiz_id AND cm.user_id = auth.uid() AND cm.role = 'owner'));
CREATE POLICY "Owner can delete questions" ON public.quiz_questions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM quizzes q WHERE q.id = quiz_questions.quiz_id AND q.created_by = auth.uid()));

-- RLS for quiz_responses
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can submit responses" ON public.quiz_responses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own responses" ON public.quiz_responses FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM quizzes q WHERE q.id = quiz_responses.quiz_id AND q.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'));

-- RLS for announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view announcements" ON public.announcements FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM classroom_members cm WHERE cm.classroom_id = announcements.classroom_id AND cm.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner can create announcements" ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND EXISTS (SELECT 1 FROM classroom_members cm WHERE cm.classroom_id = announcements.classroom_id AND cm.user_id = auth.uid() AND cm.role = 'owner'));
CREATE POLICY "Owner can delete announcements" ON public.announcements FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- Storage RLS for assignment files
CREATE POLICY "Authenticated can upload assignment files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'assignment-files');
CREATE POLICY "Anyone can view assignment files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'assignment-files');
