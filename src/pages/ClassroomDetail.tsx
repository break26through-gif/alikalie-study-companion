import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Copy, Users, FileText, ClipboardList, Plus, Send, Trash2, User } from "lucide-react";
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
  submissions?: { id: string; user_id: string; content: string; submitted_at: string }[];
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
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  // Note form
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);

  // Assignment form
  const [assignTitle, setAssignTitle] = useState("");
  const [assignDesc, setAssignDesc] = useState("");
  const [assignDue, setAssignDue] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);

  // Submission
  const [submitContent, setSubmitContent] = useState<Record<string, string>>({});

  const fetchAll = async () => {
    if (!id || !user) return;

    const { data: cr } = await supabase.from("classrooms").select("*").eq("id", id).single();
    setClassroom(cr);

    // Members with profiles
    const { data: mems } = await supabase
      .from("classroom_members")
      .select("user_id, role")
      .eq("classroom_id", id);

    if (mems) {
      const enriched = await Promise.all(
        mems.map(async (m: any) => {
          const { data: prof } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", m.user_id)
            .single();
          return { ...m, profiles: prof };
        })
      );
      setMembers(enriched);
      setIsOwner(mems.some((m: any) => m.user_id === user.id && m.role === "owner"));
    }

    const { data: n } = await supabase
      .from("classroom_notes")
      .select("*")
      .eq("classroom_id", id)
      .order("created_at", { ascending: false });
    if (n) setNotes(n);

    const { data: a } = await supabase
      .from("assignments")
      .select("*")
      .eq("classroom_id", id)
      .order("created_at", { ascending: false });

    if (a) {
      const withSubs = await Promise.all(
        a.map(async (assign: any) => {
          const { data: subs } = await supabase
            .from("assignment_submissions")
            .select("*")
            .eq("assignment_id", assign.id);
          return { ...assign, submissions: subs || [] };
        })
      );
      setAssignments(withSubs);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [id, user]);

  const copyCode = () => {
    if (classroom?.code) {
      navigator.clipboard.writeText(classroom.code);
      toast.success("Classroom code copied!");
    }
  };

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    const { error } = await supabase.from("classroom_notes").insert({
      classroom_id: id,
      author_id: user.id,
      title: noteTitle.trim(),
      content: noteContent.trim(),
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Note added!");
      setNoteTitle("");
      setNoteContent("");
      setNoteOpen(false);
      fetchAll();
    }
  };

  const addAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    const { error } = await supabase.from("assignments").insert({
      classroom_id: id,
      created_by: user.id,
      title: assignTitle.trim(),
      description: assignDesc.trim() || null,
      due_date: assignDue || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Assignment created!");
      setAssignTitle("");
      setAssignDesc("");
      setAssignDue("");
      setAssignOpen(false);
      fetchAll();
    }
  };

  const submitAssignment = async (assignmentId: string) => {
    if (!user) return;
    const content = submitContent[assignmentId];
    if (!content?.trim()) {
      toast.error("Please enter your submission");
      return;
    }
    const { error } = await supabase.from("assignment_submissions").insert({
      assignment_id: assignmentId,
      user_id: user.id,
      content: content.trim(),
    });
    if (error) {
      if (error.code === "23505") toast.info("You already submitted this.");
      else toast.error(error.message);
    } else {
      toast.success("Submitted!");
      setSubmitContent((prev) => ({ ...prev, [assignmentId]: "" }));
      fetchAll();
    }
  };

  const removeMember = async (userId: string) => {
    if (!id) return;
    const { error } = await supabase
      .from("classroom_members")
      .delete()
      .eq("classroom_id", id)
      .eq("user_id", userId);
    if (error) toast.error(error.message);
    else {
      toast.success("Member removed");
      fetchAll();
    }
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

      <Tabs defaultValue="notes">
        <TabsList className="mb-4 grid w-full grid-cols-3">
          <TabsTrigger value="notes" className="gap-1"><FileText className="h-3.5 w-3.5" /> Notes</TabsTrigger>
          <TabsTrigger value="assignments" className="gap-1"><ClipboardList className="h-3.5 w-3.5" /> Tasks</TabsTrigger>
          <TabsTrigger value="members" className="gap-1"><Users className="h-3.5 w-3.5" /> Members</TabsTrigger>
        </TabsList>

        {/* NOTES TAB */}
        <TabsContent value="notes" className="space-y-3">
          {isOwner && (
            <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full gap-1.5"><Plus className="h-4 w-4" /> Add Note</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add a Note</DialogTitle></DialogHeader>
                <form onSubmit={addNote} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} required placeholder="Note title" />
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} required rows={5} placeholder="Write your note..." />
                  </div>
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

        {/* ASSIGNMENTS TAB */}
        <TabsContent value="assignments" className="space-y-3">
          {isOwner && (
            <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full gap-1.5"><Plus className="h-4 w-4" /> Add Assignment</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Assignment</DialogTitle></DialogHeader>
                <form onSubmit={addAssignment} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={assignTitle} onChange={(e) => setAssignTitle(e.target.value)} required placeholder="Assignment title" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={assignDesc} onChange={(e) => setAssignDesc(e.target.value)} rows={3} placeholder="Instructions..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date (optional)</Label>
                    <Input type="datetime-local" value={assignDue} onChange={(e) => setAssignDue(e.target.value)} />
                  </div>
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
                  {a.due_date && (
                    <p className="mt-1 text-xs text-muted-foreground">📅 Due: {new Date(a.due_date).toLocaleString()}</p>
                  )}

                  {/* Submissions count for owner */}
                  {isOwner && (
                    <p className="mt-2 text-xs text-primary">{a.submissions?.length || 0} submissions</p>
                  )}

                  {/* Submit area for non-owners */}
                  {!isOwner && !mySubmission && (
                    <div className="mt-3 flex gap-2">
                      <Textarea
                        className="flex-1"
                        rows={2}
                        placeholder="Your answer..."
                        value={submitContent[a.id] || ""}
                        onChange={(e) => setSubmitContent((prev) => ({ ...prev, [a.id]: e.target.value }))}
                      />
                      <Button size="sm" onClick={() => submitAssignment(a.id)} className="self-end">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {mySubmission && (
                    <p className="mt-2 text-xs text-green-600 dark:text-green-400">✅ Submitted</p>
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

        {/* MEMBERS TAB */}
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
