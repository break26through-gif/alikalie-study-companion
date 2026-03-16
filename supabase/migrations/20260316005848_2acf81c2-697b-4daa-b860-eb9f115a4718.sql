-- Performance + consistency hardening for high-frequency classroom usage
CREATE INDEX IF NOT EXISTS idx_classroom_members_user_id ON public.classroom_members(user_id);
CREATE INDEX IF NOT EXISTS idx_classroom_members_classroom_id ON public.classroom_members(classroom_id);
CREATE INDEX IF NOT EXISTS idx_assignments_classroom_id ON public.assignments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_announcements_classroom_id ON public.announcements(classroom_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_classroom_id ON public.quizzes(classroom_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_quiz_id ON public.quiz_responses(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_question_id ON public.quiz_responses(question_id);

-- Idempotency protections to avoid duplicate rows under rapid repeated requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'classroom_members_classroom_user_key'
      AND conrelid = 'public.classroom_members'::regclass
  ) THEN
    ALTER TABLE public.classroom_members
      ADD CONSTRAINT classroom_members_classroom_user_key UNIQUE (classroom_id, user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'assignment_submissions_assignment_user_key'
      AND conrelid = 'public.assignment_submissions'::regclass
  ) THEN
    ALTER TABLE public.assignment_submissions
      ADD CONSTRAINT assignment_submissions_assignment_user_key UNIQUE (assignment_id, user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'quiz_responses_question_user_key'
      AND conrelid = 'public.quiz_responses'::regclass
  ) THEN
    ALTER TABLE public.quiz_responses
      ADD CONSTRAINT quiz_responses_question_user_key UNIQUE (question_id, user_id);
  END IF;
END
$$;

-- Classroom creators should retain tutor-level control even if membership row is temporarily missing
DROP POLICY IF EXISTS "Members can view classroom members" ON public.classroom_members;
CREATE POLICY "Members can view classroom members"
ON public.classroom_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.classroom_members cm
    WHERE cm.classroom_id = classroom_members.classroom_id
      AND cm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.classrooms c
    WHERE c.id = classroom_members.classroom_id
      AND c.created_by = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Owner or admin can manage members" ON public.classroom_members;
CREATE POLICY "Owner or admin can manage members"
ON public.classroom_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.classroom_members cm
    WHERE cm.classroom_id = classroom_members.classroom_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'owner'
  )
  OR EXISTS (
    SELECT 1
    FROM public.classrooms c
    WHERE c.id = classroom_members.classroom_id
      AND c.created_by = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow classroom creators to manage classroom content even if owner membership row is missing
DROP POLICY IF EXISTS "Owner can create announcements" ON public.announcements;
CREATE POLICY "Owner can create announcements"
ON public.announcements
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author_id
  AND (
    EXISTS (
      SELECT 1
      FROM public.classroom_members cm
      WHERE cm.classroom_id = announcements.classroom_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'owner'
    )
    OR EXISTS (
      SELECT 1
      FROM public.classrooms c
      WHERE c.id = announcements.classroom_id
        AND c.created_by = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Owner can create notes" ON public.classroom_notes;
CREATE POLICY "Owner can create notes"
ON public.classroom_notes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author_id
  AND (
    EXISTS (
      SELECT 1
      FROM public.classroom_members cm
      WHERE cm.classroom_id = classroom_notes.classroom_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'owner'
    )
    OR EXISTS (
      SELECT 1
      FROM public.classrooms c
      WHERE c.id = classroom_notes.classroom_id
        AND c.created_by = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Owner can create assignments" ON public.assignments;
CREATE POLICY "Owner can create assignments"
ON public.assignments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND (
    EXISTS (
      SELECT 1
      FROM public.classroom_members cm
      WHERE cm.classroom_id = assignments.classroom_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'owner'
    )
    OR EXISTS (
      SELECT 1
      FROM public.classrooms c
      WHERE c.id = assignments.classroom_id
        AND c.created_by = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Owner can create quizzes" ON public.quizzes;
CREATE POLICY "Owner can create quizzes"
ON public.quizzes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND (
    EXISTS (
      SELECT 1
      FROM public.classroom_members cm
      WHERE cm.classroom_id = quizzes.classroom_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'owner'
    )
    OR EXISTS (
      SELECT 1
      FROM public.classrooms c
      WHERE c.id = quizzes.classroom_id
        AND c.created_by = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Owner can manage questions" ON public.quiz_questions;
CREATE POLICY "Owner can manage questions"
ON public.quiz_questions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.quizzes q
    JOIN public.classrooms c ON c.id = q.classroom_id
    LEFT JOIN public.classroom_members cm
      ON cm.classroom_id = q.classroom_id
     AND cm.user_id = auth.uid()
    WHERE q.id = quiz_questions.quiz_id
      AND (cm.role = 'owner' OR c.created_by = auth.uid())
  )
);

-- Tutors/owners/admin can grade submissions
DROP POLICY IF EXISTS "Users can update own submissions" ON public.assignment_submissions;
CREATE POLICY "Owners or submitters can update submissions"
ON public.assignment_submissions
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.assignments a
    JOIN public.classrooms c ON c.id = a.classroom_id
    LEFT JOIN public.classroom_members cm
      ON cm.classroom_id = a.classroom_id
     AND cm.user_id = auth.uid()
    WHERE a.id = assignment_submissions.assignment_id
      AND (cm.role = 'owner' OR c.created_by = auth.uid())
  )
);