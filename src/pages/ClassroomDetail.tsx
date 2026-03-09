import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Copy, Users, FileText, ClipboardList, Plus, Send, Trash2, User,
  Megaphone, HelpCircle, Upload, Download, CheckCircle, XCircle, Eye, Paperclip
} from "lucide-react";
import { toast } from "sonner";
import EmojiReaction from "@/components/EmojiReaction";
import { useClassroomNotifications } from "@/hooks/useClassroomNotifications";

interface Member {
  user_id: string;
  role: string;
  profiles?: { full_name: string | null };
}

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author_id: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
  submissions?: { id: string; user_id: string; content: string; file_url: string | null; file_name: string | null; submitted_at: string }[];
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  questions?: QuizQuestion[];
}

interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  correct_answer: string | null;
  sort_order: number;
}

interface QuizResponse {
  id: string;
  quiz_id: string;
  question_id: string;
  user_id: string;
  answer: string;
  is_correct: boolean | null;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author_id: string;
}

export default function ClassroomDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  useClassroomNotifications(id);

  const [classroom, setClassroom] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  // Forms
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);

  const [assignTitle, setAssignTitle] = useState("");
  const [assignDesc, setAssignDesc] = useState("");
  const [assignDue, setAssignDue] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);

  const [annoTitle, setAnnoTitle] = useState("");
  const [annoContent, setAnnoContent] = useState("");
  const [annoOpen, setAnnoOpen] = useState(false);

  // Quiz creation
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDesc, setQuizDesc] = useState("");
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<{
    question_text: string;
    question_type: string;
    options: string[];
    correct_answer: string;
  }[]>([{ question_text: "", question_type: "multiple_choice", options: ["", "", "", ""], correct_answer: "" }]);

  // Submission
  const [uploadingAssignment, setUploadingAssignment] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Quiz taking
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [myQuizResponses, setMyQuizResponses] = useState<QuizResponse[]>([]);

  // Admin view
  const [viewingSubmissions, setViewingSubmissions] = useState<string | null>(null);
  const [viewingQuizResponses, setViewingQuizResponses] = useState<string | null>(null);
  const [submissionProfiles, setSubmissionProfiles] = useState<Record<string, string>>({});

  const fetchAll = async () => {
    if (!id || !user) return;

    const [crRes, memsRes, notesRes, assignRes, quizRes, annoRes] = await Promise.all([
      supabase.from("classrooms").select("*").eq("id", id).single(),
      supabase.from("classroom_members").select("user_id, role").eq("classroom_id", id),
      supabase.from("classroom_notes").select("*").eq("classroom_id", id).order("created_at", { ascending: false }),
      supabase.from("assignments").select("*").eq("classroom_id", id).order("created_at", { ascending: false }),
      supabase.from("quizzes").select("*").eq("classroom_id", id).order("created_at", { ascending: false }),
      supabase.from("announcements").select("*").eq("classroom_id", id).order("created_at", { ascending: false }),
    ]);

    setClassroom(crRes.data);
    if (notesRes.data) setNotes(notesRes.data);
    if (annoRes.data) setAnnouncements(annoRes.data as Announcement[]);

    if (memsRes.data) {
      const enriched = await Promise.all(
        memsRes.data.map(async (m: any) => {
          const { data: prof } = await supabase.from("profiles").select("full_name").eq("user_id", m.user_id).single();
          return { ...m, profiles: prof };
        })
      );
      setMembers(enriched);
      setIsOwner(memsRes.data.some((m: any) => m.user_id === user.id && m.role === "owner"));
    }

    if (assignRes.data) {
      const withSubs = await Promise.all(
        assignRes.data.map(async (a: any) => {
          const { data: subs } = await supabase.from("assignment_submissions").select("*").eq("assignment_id", a.id);
          return { ...a, submissions: subs || [] };
        })
      );
      setAssignments(withSubs);
    }

    if (quizRes.data) {
      const withQ = await Promise.all(
        (quizRes.data as Quiz[]).map(async (q) => {
          const { data: questions } = await supabase.from("quiz_questions").select("*").eq("quiz_id", q.id).order("sort_order");
          return { ...q, questions: (questions || []) as QuizQuestion[] };
        })
      );
      setQuizzes(withQ);

      // Load my responses
      const quizIds = (quizRes.data as Quiz[]).map((q) => q.id);
      if (quizIds.length > 0) {
        const { data: responses } = await supabase
          .from("quiz_responses")
          .select("*")
          .eq("user_id", user.id)
          .in("quiz_id", quizIds);
        if (responses) setMyQuizResponses(responses as QuizResponse[]);
      }
    }

    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [id, user]);

  const copyCode = () => {
    if (classroom?.code) {
      navigator.clipboard.writeText(classroom.code);
      toast.success("Classroom code copied!");
    }
  };

  // --- Notes ---
  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    const { error } = await supabase.from("classroom_notes").insert({ classroom_id: id, author_id: user.id, title: noteTitle.trim(), content: noteContent.trim() });
    if (error) toast.error(error.message);
    else { toast.success("Note added!"); setNoteTitle(""); setNoteContent(""); setNoteOpen(false); fetchAll(); }
  };

  // --- Announcements ---
  const addAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    const { error } = await supabase.from("announcements").insert({ classroom_id: id, author_id: user.id, title: annoTitle.trim(), content: annoContent.trim() });
    if (error) toast.error(error.message);
    else { toast.success("Announcement posted!"); setAnnoTitle(""); setAnnoContent(""); setAnnoOpen(false); fetchAll(); }
  };

  // --- Assignments ---
  const addAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    const { error } = await supabase.from("assignments").insert({ classroom_id: id, created_by: user.id, title: assignTitle.trim(), description: assignDesc.trim() || null, due_date: assignDue || null });
    if (error) toast.error(error.message);
    else { toast.success("Assignment created!"); setAssignTitle(""); setAssignDesc(""); setAssignDue(""); setAssignOpen(false); fetchAll(); }
  };

  const handleFileSubmit = async (assignmentId: string, file: File) => {
    if (!user) return;
    setUploadingAssignment(assignmentId);
    try {
      const ext = file.name.split(".").pop();
      const path = `${id}/${assignmentId}/${user.id}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("assignment-files").upload(path, file);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("assignment-files").getPublicUrl(path);

      const { error } = await supabase.from("assignment_submissions").insert({
        assignment_id: assignmentId,
        user_id: user.id,
        content: file.name,
        file_url: urlData.publicUrl,
        file_name: file.name,
      });
      if (error) {
        if (error.code === "23505") toast.info("You already submitted this.");
        else throw error;
      } else {
        toast.success("File submitted!");
        fetchAll();
      }
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setUploadingAssignment(null);
  };

  // --- Quizzes ---
  const addQuizQuestion = () => {
    setQuizQuestions([...quizQuestions, { question_text: "", question_type: "multiple_choice", options: ["", "", "", ""], correct_answer: "" }]);
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    setQuizQuestions(quizQuestions.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    const updated = [...quizQuestions];
    updated[qIdx].options[oIdx] = value;
    setQuizQuestions(updated);
  };

  const createQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    const { data: quiz, error } = await supabase.from("quizzes").insert({ classroom_id: id, created_by: user.id, title: quizTitle.trim(), description: quizDesc.trim() || null }).select().single();
    if (error || !quiz) { toast.error(error?.message || "Failed"); return; }

    for (let i = 0; i < quizQuestions.length; i++) {
      const q = quizQuestions[i];
      if (!q.question_text.trim()) continue;
      await supabase.from("quiz_questions").insert({
        quiz_id: quiz.id,
        question_text: q.question_text.trim(),
        question_type: q.question_type,
        options: q.question_type === "multiple_choice" ? q.options.filter(o => o.trim()) : null,
        correct_answer: q.question_type === "multiple_choice" ? q.correct_answer : null,
        sort_order: i,
      });
    }

    toast.success("Quiz created!");
    setQuizTitle(""); setQuizDesc("");
    setQuizQuestions([{ question_text: "", question_type: "multiple_choice", options: ["", "", "", ""], correct_answer: "" }]);
    setQuizOpen(false);
    fetchAll();
  };

  const submitQuizAnswer = async (quizId: string, questionId: string, answer: string, correctAnswer: string | null, questionType: string) => {
    if (!user) return;
    const isCorrect = questionType === "multiple_choice" ? answer === correctAnswer : null;
    const { error } = await supabase.from("quiz_responses").insert({ quiz_id: quizId, question_id: questionId, user_id: user.id, answer, is_correct: isCorrect });
    if (error) {
      if (error.code === "23505") toast.info("Already answered.");
      else toast.error(error.message);
    } else {
      toast.success(isCorrect === true ? "✅ Correct!" : isCorrect === false ? "❌ Incorrect" : "Answer submitted!");
      fetchAll();
    }
  };

  // Admin: load profiles for submissions
  const loadSubmissionProfiles = async (submissions: any[]) => {
    const userIds = [...new Set(submissions.map((s: any) => s.user_id))];
    const profiles: Record<string, string> = {};
    for (const uid of userIds) {
      const { data } = await supabase.from("profiles").select("full_name").eq("user_id", uid).single();
      profiles[uid] = data?.full_name || "Unknown";
    }
    setSubmissionProfiles(profiles);
  };

  const removeMember = async (userId: string) => {
    if (!id) return;
    const { error } = await supabase.from("classroom_members").delete().eq("classroom_id", id).eq("user_id", userId);
    if (error) toast.error(error.message);
    else { toast.success("Member removed"); fetchAll(); }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (!classroom) return <div className="p-4 text-center text-muted-foreground">Classroom not found</div>;

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate("/classrooms")} className="rounded-full p-2 text-muted-foreground hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-bold text-foreground">{classroom.name}</h1>
          {classroom.description && <p className="truncate text-xs text-muted-foreground">{classroom.description}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={copyCode} className="gap-1.5 shrink-0">
          <Copy className="h-3.5 w-3.5" /> {classroom.code}
        </Button>
      </div>

      {!classroom.approved && (
        <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-center text-sm text-yellow-600 dark:text-yellow-400">
          ⏳ Waiting for admin approval
        </div>
      )}

      <Tabs defaultValue="announcements">
        <TabsList className="mb-4 grid w-full grid-cols-5 text-[10px] sm:text-xs">
          <TabsTrigger value="announcements" className="gap-0.5 px-1"><Megaphone className="h-3 w-3" /> <span className="hidden sm:inline">Feed</span></TabsTrigger>
          <TabsTrigger value="notes" className="gap-0.5 px-1"><FileText className="h-3 w-3" /> <span className="hidden sm:inline">Notes</span></TabsTrigger>
          <TabsTrigger value="assignments" className="gap-0.5 px-1"><ClipboardList className="h-3 w-3" /> <span className="hidden sm:inline">Tasks</span></TabsTrigger>
          <TabsTrigger value="quizzes" className="gap-0.5 px-1"><HelpCircle className="h-3 w-3" /> <span className="hidden sm:inline">Quiz</span></TabsTrigger>
          <TabsTrigger value="members" className="gap-0.5 px-1"><Users className="h-3 w-3" /> <span className="hidden sm:inline">Team</span></TabsTrigger>
        </TabsList>

        {/* ANNOUNCEMENTS */}
        <TabsContent value="announcements" className="space-y-3">
          {isOwner && (
            <Dialog open={annoOpen} onOpenChange={setAnnoOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full gap-1.5"><Megaphone className="h-4 w-4" /> Post Announcement</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
                <form onSubmit={addAnnouncement} className="space-y-4">
                  <div className="space-y-2"><Label>Title</Label><Input value={annoTitle} onChange={(e) => setAnnoTitle(e.target.value)} required placeholder="Announcement title" /></div>
                  <div className="space-y-2"><Label>Content</Label><Textarea value={annoContent} onChange={(e) => setAnnoContent(e.target.value)} required rows={4} placeholder="What do you want to announce?" /></div>
                  <Button type="submit" className="w-full">Post</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
          {announcements.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No announcements yet.</p>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-start gap-2">
                  <Megaphone className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-foreground">{a.title}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{a.content}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                      <EmojiReaction targetType="announcement" targetId={a.id} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* NOTES */}
        <TabsContent value="notes" className="space-y-3">
          {isOwner && (
            <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
              <DialogTrigger asChild><Button size="sm" className="w-full gap-1.5"><Plus className="h-4 w-4" /> Add Note</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add a Note</DialogTitle></DialogHeader>
                <form onSubmit={addNote} className="space-y-4">
                  <div className="space-y-2"><Label>Title</Label><Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} required placeholder="Note title" /></div>
                  <div className="space-y-2"><Label>Content</Label><Textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} required rows={5} placeholder="Write your note..." /></div>
                  <Button type="submit" className="w-full">Post Note</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
          {notes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                <h3 className="font-display font-semibold text-foreground">{note.title}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{note.content}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{new Date(note.created_at).toLocaleDateString()}</span>
                  <EmojiReaction targetType="note" targetId={note.id} />
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* ASSIGNMENTS with file upload */}
        <TabsContent value="assignments" className="space-y-3">
          {isOwner && (
            <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
              <DialogTrigger asChild><Button size="sm" className="w-full gap-1.5"><Plus className="h-4 w-4" /> Add Assignment</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Assignment</DialogTitle></DialogHeader>
                <form onSubmit={addAssignment} className="space-y-4">
                  <div className="space-y-2"><Label>Title</Label><Input value={assignTitle} onChange={(e) => setAssignTitle(e.target.value)} required placeholder="Assignment title" /></div>
                  <div className="space-y-2"><Label>Description</Label><Textarea value={assignDesc} onChange={(e) => setAssignDesc(e.target.value)} rows={3} placeholder="Instructions..." /></div>
                  <div className="space-y-2"><Label>Due Date (optional)</Label><Input type="datetime-local" value={assignDue} onChange={(e) => setAssignDue(e.target.value)} /></div>
                  <Button type="submit" className="w-full">Create Assignment</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
          {assignments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No assignments yet.</p>
          ) : (
            assignments.map((a) => {
              const mySubmission = a.submissions?.find((s) => s.user_id === user?.id);
              return (
                <div key={a.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                  <h3 className="font-display font-semibold text-foreground">{a.title}</h3>
                  {a.description && <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>}
                  {a.due_date && <p className="mt-1 text-xs text-muted-foreground">📅 Due: {new Date(a.due_date).toLocaleString()}</p>}

                  {/* Owner: view submissions */}
                  {isOwner && (
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          setViewingSubmissions(viewingSubmissions === a.id ? null : a.id);
                          if (a.submissions) loadSubmissionProfiles(a.submissions);
                        }}
                        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                      >
                        <Eye className="h-3.5 w-3.5" /> {a.submissions?.length || 0} submissions
                      </button>
                      {viewingSubmissions === a.id && a.submissions && (
                        <div className="mt-2 space-y-2">
                          {a.submissions.map((sub) => (
                            <div key={sub.id} className="rounded-lg border border-border bg-secondary/30 p-3">
                              <p className="text-xs font-medium text-foreground">{submissionProfiles[sub.user_id] || "Loading..."}</p>
                              {sub.file_url ? (
                                <div className="mt-1 flex items-center gap-2">
                                  <Paperclip className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground truncate">{sub.file_name || "File"}</span>
                                  <a href={sub.file_url} download={sub.file_name || "file"} target="_blank" rel="noopener noreferrer" className="ml-auto">
                                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs"><Download className="h-3 w-3" /> Download</Button>
                                  </a>
                                </div>
                              ) : (
                                <p className="mt-1 text-xs text-muted-foreground">{sub.content}</p>
                              )}
                              <p className="mt-1 text-[10px] text-muted-foreground">{new Date(sub.submitted_at).toLocaleString()}</p>
                            </div>
                          ))}
                          {a.submissions.length === 0 && <p className="text-xs text-muted-foreground">No submissions yet.</p>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Member: submit file */}
                  {!isOwner && !mySubmission && (
                    <div className="mt-3">
                      <input
                        type="file"
                        ref={(el) => { fileInputRefs.current[a.id] = el; }}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSubmit(a.id, file);
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5"
                        disabled={uploadingAssignment === a.id}
                        onClick={() => fileInputRefs.current[a.id]?.click()}
                      >
                        <Upload className="h-4 w-4" />
                        {uploadingAssignment === a.id ? "Uploading..." : "Upload Submission"}
                      </Button>
                    </div>
                  )}
                  {mySubmission && (
                    <p className="mt-2 text-xs text-green-600 dark:text-green-400">✅ Submitted: {mySubmission.file_name || mySubmission.content}</p>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                    <EmojiReaction targetType="assignment" targetId={a.id} />
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        {/* QUIZZES */}
        <TabsContent value="quizzes" className="space-y-3">
          {isOwner && (
            <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
              <DialogTrigger asChild><Button size="sm" className="w-full gap-1.5"><Plus className="h-4 w-4" /> Create Quiz</Button></DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Create Quiz</DialogTitle></DialogHeader>
                <form onSubmit={createQuiz} className="space-y-4">
                  <div className="space-y-2"><Label>Quiz Title</Label><Input value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} required placeholder="Quiz title" /></div>
                  <div className="space-y-2"><Label>Description</Label><Textarea value={quizDesc} onChange={(e) => setQuizDesc(e.target.value)} rows={2} placeholder="Optional description" /></div>

                  {quizQuestions.map((q, qIdx) => (
                    <div key={qIdx} className="rounded-lg border border-border p-3 space-y-2">
                      <p className="text-xs font-semibold text-foreground">Question {qIdx + 1}</p>
                      <Input value={q.question_text} onChange={(e) => updateQuestion(qIdx, "question_text", e.target.value)} placeholder="Enter question" />
                      <Select value={q.question_type} onValueChange={(v) => updateQuestion(qIdx, "question_type", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                          <SelectItem value="open_ended">Open Ended</SelectItem>
                        </SelectContent>
                      </Select>
                      {q.question_type === "multiple_choice" && (
                        <div className="space-y-1">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2">
                              <Input
                                value={opt}
                                onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                                placeholder={`Option ${oIdx + 1}`}
                                className="text-xs"
                              />
                              <input
                                type="radio"
                                name={`correct-${qIdx}`}
                                checked={q.correct_answer === opt && opt !== ""}
                                onChange={() => updateQuestion(qIdx, "correct_answer", opt)}
                                className="accent-primary"
                              />
                            </div>
                          ))}
                          <p className="text-[10px] text-muted-foreground">Select the radio for the correct answer</p>
                        </div>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addQuizQuestion} className="w-full">+ Add Question</Button>
                  <Button type="submit" className="w-full">Create Quiz</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {quizzes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No quizzes yet.</p>
          ) : (
            quizzes.map((quiz) => (
              <div key={quiz.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                <h3 className="font-display font-semibold text-foreground">{quiz.title}</h3>
                {quiz.description && <p className="mt-1 text-sm text-muted-foreground">{quiz.description}</p>}

                {/* Owner: view all responses */}
                {isOwner && (
                  <button
                    onClick={async () => {
                      setViewingQuizResponses(viewingQuizResponses === quiz.id ? null : quiz.id);
                      if (viewingQuizResponses !== quiz.id) {
                        // Load all responses for this quiz
                        const { data: allResp } = await supabase.from("quiz_responses").select("*").eq("quiz_id", quiz.id);
                        if (allResp) {
                          setMyQuizResponses((prev) => [...prev.filter(r => r.quiz_id !== quiz.id), ...(allResp as any)]);
                          const uids = [...new Set(allResp.map((r: any) => r.user_id))];
                          const profs: Record<string, string> = { ...submissionProfiles };
                          for (const uid of uids) {
                            if (!profs[uid]) {
                              const { data } = await supabase.from("profiles").select("full_name").eq("user_id", uid).single();
                              profs[uid] = data?.full_name || "Unknown";
                            }
                          }
                          setSubmissionProfiles(profs);
                        }
                      }
                    }}
                    className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Responses
                  </button>
                )}

                {/* Owner: response view */}
                {isOwner && viewingQuizResponses === quiz.id && quiz.questions && (
                  <div className="mt-3 space-y-3">
                    {quiz.questions.map((q) => {
                      const responses = myQuizResponses.filter((r) => r.question_id === q.id);
                      return (
                        <div key={q.id} className="rounded-lg border border-border bg-secondary/30 p-3">
                          <p className="text-xs font-medium text-foreground">{q.question_text}</p>
                          {responses.length === 0 ? (
                            <p className="mt-1 text-[10px] text-muted-foreground">No responses yet</p>
                          ) : (
                            <div className="mt-1 space-y-1">
                              {responses.map((r) => (
                                <div key={r.id} className="flex items-center gap-2 text-xs">
                                  <span className="font-medium text-foreground">{submissionProfiles[r.user_id] || "..."}</span>
                                  <span className="text-muted-foreground">→ {r.answer}</span>
                                  {r.is_correct === true && <CheckCircle className="h-3 w-3 text-green-500" />}
                                  {r.is_correct === false && <XCircle className="h-3 w-3 text-red-500" />}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Member: take quiz */}
                {!isOwner && quiz.questions && (
                  <div className="mt-3 space-y-3">
                    {quiz.questions.map((q) => {
                      const myAnswer = myQuizResponses.find((r) => r.question_id === q.id);
                      return (
                        <div key={q.id} className="rounded-lg border border-border bg-secondary/20 p-3">
                          <p className="text-xs font-medium text-foreground">{q.question_text}</p>
                          {myAnswer ? (
                            <div className="mt-1 flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Your answer: {myAnswer.answer}</span>
                              {myAnswer.is_correct === true && <CheckCircle className="h-3 w-3 text-green-500" />}
                              {myAnswer.is_correct === false && <XCircle className="h-3 w-3 text-red-500" />}
                            </div>
                          ) : q.question_type === "multiple_choice" && q.options ? (
                            <div className="mt-2 space-y-1">
                              {(q.options as string[]).map((opt, oIdx) => (
                                <button
                                  key={oIdx}
                                  onClick={() => submitQuizAnswer(quiz.id, q.id, opt, q.correct_answer, q.question_type)}
                                  className="block w-full rounded-lg border border-border bg-card px-3 py-2 text-left text-xs hover:bg-secondary transition-colors"
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-2 flex gap-2">
                              <Input
                                className="flex-1 text-xs"
                                placeholder="Your answer..."
                                value={quizAnswers[q.id] || ""}
                                onChange={(e) => setQuizAnswers({ ...quizAnswers, [q.id]: e.target.value })}
                              />
                              <Button size="sm" onClick={() => { submitQuizAnswer(quiz.id, q.id, quizAnswers[q.id] || "", null, q.question_type); setQuizAnswers({ ...quizAnswers, [q.id]: "" }); }}>
                                <Send className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{new Date(quiz.created_at).toLocaleDateString()}</span>
                  <EmojiReaction targetType="quiz" targetId={quiz.id} />
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* MEMBERS */}
        <TabsContent value="members" className="space-y-2">
          <p className="text-sm text-muted-foreground">{members.length} members</p>
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                <User className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{m.profiles?.full_name || "Unknown"}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{m.role}</p>
              </div>
              {isOwner && m.role !== "owner" && (
                <Button variant="ghost" size="sm" onClick={() => removeMember(m.user_id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
