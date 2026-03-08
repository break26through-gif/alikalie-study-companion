import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, LogIn, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Classroom {
  id: string;
  name: string;
  description: string | null;
  code: string;
  approved: boolean;
  created_by: string;
  avatar_url: string | null;
  created_at: string;
  member_count?: number;
}

export default function Classrooms() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchClassrooms = async () => {
    if (!user) return;
    // Get classrooms where user is a member
    const { data: memberOf } = await supabase
      .from("classroom_members")
      .select("classroom_id")
      .eq("user_id", user.id);

    const classroomIds = memberOf?.map((m: any) => m.classroom_id) || [];

    if (classroomIds.length === 0) {
      setClassrooms([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("classrooms")
      .select("*")
      .in("id", classroomIds)
      .order("created_at", { ascending: false });

    if (data) {
      // Get member counts
      const withCounts = await Promise.all(
        data.map(async (c: any) => {
          const { count } = await supabase
            .from("classroom_members")
            .select("*", { count: "exact", head: true })
            .eq("classroom_id", c.id);
          return { ...c, member_count: count || 0 };
        })
      );
      setClassrooms(withCounts);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClassrooms();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from("classrooms")
      .insert({ name: name.trim(), description: description.trim() || null, created_by: user.id })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    // Add creator as owner
    await supabase.from("classroom_members").insert({
      classroom_id: data.id,
      user_id: user.id,
      role: "owner",
    });

    toast.success("Classroom created! Waiting for admin approval.");
    setName("");
    setDescription("");
    setCreateOpen(false);
    setSubmitting(false);
    fetchClassrooms();
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinCode.trim()) return;
    setSubmitting(true);

    const { data: classroom } = await supabase
      .from("classrooms")
      .select("id, approved")
      .eq("code", joinCode.trim().toLowerCase())
      .single();

    if (!classroom) {
      toast.error("Classroom not found. Check the code.");
      setSubmitting(false);
      return;
    }

    if (!classroom.approved) {
      toast.error("This classroom is not yet approved by admin.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("classroom_members").insert({
      classroom_id: classroom.id,
      user_id: user.id,
      role: "member",
    });

    if (error) {
      if (error.code === "23505") toast.info("You're already in this classroom.");
      else toast.error(error.message);
    } else {
      toast.success("Joined classroom!");
    }
    setJoinCode("");
    setJoinOpen(false);
    setSubmitting(false);
    fetchClassrooms();
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Classrooms</h1>
          <p className="text-sm text-muted-foreground">Collaborate with classmates</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <LogIn className="h-4 w-4" /> Join
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a Classroom</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Classroom Code</Label>
                  <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Enter classroom code" required />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Joining..." : "Join Classroom"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Create
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a Classroom</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Classroom Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CS 101 Study Group" required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this classroom about?" rows={3} />
                </div>
                <p className="text-xs text-muted-foreground">⏳ Classrooms require admin approval before members can join.</p>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Classroom"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
      ) : classrooms.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center shadow-card">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium text-foreground">No classrooms yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create or join a classroom to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classrooms.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/classrooms/${c.id}`)}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-card transition-all hover:shadow-elevated active:scale-[0.98]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-lg font-bold text-secondary-foreground">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-display font-semibold text-foreground">{c.name}</p>
                  {c.approved ? (
                    <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-500" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
                  )}
                </div>
                {c.description && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.description}</p>
                )}
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" /> {c.member_count} members
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
