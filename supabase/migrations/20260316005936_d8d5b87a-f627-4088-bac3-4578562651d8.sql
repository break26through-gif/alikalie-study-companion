-- Ensure classroom members and classroom creators always have visibility
DROP POLICY IF EXISTS "Authenticated can view approved classrooms" ON public.classrooms;
CREATE POLICY "Authenticated can view approved classrooms"
ON public.classrooms
FOR SELECT
TO authenticated
USING (
  approved = true
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.classroom_members cm
    WHERE cm.classroom_id = classrooms.id
      AND cm.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Members can view announcements" ON public.announcements;
CREATE POLICY "Members can view announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.classroom_members cm
    WHERE cm.classroom_id = announcements.classroom_id
      AND cm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.classrooms c
    WHERE c.id = announcements.classroom_id
      AND c.created_by = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Members can view notes" ON public.classroom_notes;
CREATE POLICY "Members can view notes"
ON public.classroom_notes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.classroom_members cm
    WHERE cm.classroom_id = classroom_notes.classroom_id
      AND cm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.classrooms c
    WHERE c.id = classroom_notes.classroom_id
      AND c.created_by = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Members can view assignments" ON public.assignments;
CREATE POLICY "Members can view assignments"
ON public.assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.classroom_members cm
    WHERE cm.classroom_id = assignments.classroom_id
      AND cm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.classrooms c
    WHERE c.id = assignments.classroom_id
      AND c.created_by = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Members can view quizzes" ON public.quizzes;
CREATE POLICY "Members can view quizzes"
ON public.quizzes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.classroom_members cm
    WHERE cm.classroom_id = quizzes.classroom_id
      AND cm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.classrooms c
    WHERE c.id = quizzes.classroom_id
      AND c.created_by = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Members can view submissions in their classroom" ON public.assignment_submissions;
CREATE POLICY "Members can view submissions in their classroom"
ON public.assignment_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.assignments a
    JOIN public.classroom_members cm ON cm.classroom_id = a.classroom_id
    WHERE a.id = assignment_submissions.assignment_id
      AND cm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.assignments a
    JOIN public.classrooms c ON c.id = a.classroom_id
    WHERE a.id = assignment_submissions.assignment_id
      AND c.created_by = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Members can view questions" ON public.quiz_questions;
CREATE POLICY "Members can view questions"
ON public.quiz_questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.quizzes q
    JOIN public.classroom_members cm ON cm.classroom_id = q.classroom_id
    WHERE q.id = quiz_questions.quiz_id
      AND cm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.quizzes q
    JOIN public.classrooms c ON c.id = q.classroom_id
    WHERE q.id = quiz_questions.quiz_id
      AND c.created_by = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);