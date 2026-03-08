
-- Create classrooms table
CREATE TABLE public.classrooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  avatar_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create classroom_members table
CREATE TABLE public.classroom_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(classroom_id, user_id)
);

-- Create classroom_notes table
CREATE TABLE public.classroom_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assignments table
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assignment_submissions table
CREATE TABLE public.assignment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, user_id)
);

-- Create emoji_reactions table for platform interactions
CREATE TABLE public.emoji_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('note', 'assignment', 'submission')),
  target_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_type, target_id, emoji)
);

-- Enable RLS on all tables
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emoji_reactions ENABLE ROW LEVEL SECURITY;

-- Classrooms RLS
CREATE POLICY "Authenticated can view approved classrooms" ON public.classrooms FOR SELECT TO authenticated USING (approved = true OR created_by = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can create classrooms" ON public.classrooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owner or admin can update classrooms" ON public.classrooms FOR UPDATE TO authenticated USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete classrooms" ON public.classrooms FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin') OR created_by = auth.uid());

-- Classroom members RLS
CREATE POLICY "Members can view classroom members" ON public.classroom_members FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM classroom_members cm WHERE cm.classroom_id = classroom_members.classroom_id AND cm.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can join classrooms" ON public.classroom_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner or admin can manage members" ON public.classroom_members FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM classroom_members cm WHERE cm.classroom_id = classroom_members.classroom_id AND cm.user_id = auth.uid() AND cm.role = 'owner') OR has_role(auth.uid(), 'admin'));

-- Classroom notes RLS
CREATE POLICY "Members can view notes" ON public.classroom_notes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM classroom_members cm WHERE cm.classroom_id = classroom_notes.classroom_id AND cm.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner can create notes" ON public.classroom_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id AND EXISTS (SELECT 1 FROM classroom_members cm WHERE cm.classroom_id = classroom_notes.classroom_id AND cm.user_id = auth.uid() AND cm.role = 'owner'));
CREATE POLICY "Owner can update notes" ON public.classroom_notes FOR UPDATE TO authenticated USING (author_id = auth.uid());
CREATE POLICY "Owner can delete notes" ON public.classroom_notes FOR DELETE TO authenticated USING (author_id = auth.uid());

-- Assignments RLS
CREATE POLICY "Members can view assignments" ON public.assignments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM classroom_members cm WHERE cm.classroom_id = assignments.classroom_id AND cm.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner can create assignments" ON public.assignments FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by AND EXISTS (SELECT 1 FROM classroom_members cm WHERE cm.classroom_id = assignments.classroom_id AND cm.user_id = auth.uid() AND cm.role = 'owner'));
CREATE POLICY "Owner can update assignments" ON public.assignments FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Owner can delete assignments" ON public.assignments FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Submissions RLS
CREATE POLICY "Members can view submissions in their classroom" ON public.assignment_submissions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM assignments a JOIN classroom_members cm ON cm.classroom_id = a.classroom_id WHERE a.id = assignment_submissions.assignment_id AND cm.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can submit assignments" ON public.assignment_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own submissions" ON public.assignment_submissions FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Emoji reactions RLS
CREATE POLICY "Authenticated can view reactions" ON public.emoji_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can add reactions" ON public.emoji_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions" ON public.emoji_reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Storage bucket for classroom avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('classroom-avatars', 'classroom-avatars', true);

CREATE POLICY "Anyone can view classroom avatars" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'classroom-avatars');
CREATE POLICY "Authenticated can upload classroom avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'classroom-avatars');
CREATE POLICY "Users can update own uploads" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'classroom-avatars');
