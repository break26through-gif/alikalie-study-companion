import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, LogIn, Clock, CheckCircle, Copy } from "lucide-react";
import { toast } from "sonner";

// Deterministic brand colors for classrooms
const BRAND_COLORS = [
  { bg: "from-blue-500/20 to-blue-600/10", accent: "bg-blue-500", text: "text-blue-600 dark:text-blue-400", ring: "ring-blue-500/30" },
  { bg: "from-emerald-500/20 to-emerald-600/10", accent: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-500/30" },
  { bg: "from-violet-500/20 to-violet-600/10", accent: "bg-violet-500", text: "text-violet-600 dark:text-violet-400", ring: "ring-violet-500/30" },
  { bg: "from-amber-500/20 to-amber-600/10", accent: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", ring: "ring-amber-500/30" },
  { bg: "from-rose-500/20 to-rose-600/10", accent: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", ring: "ring-rose-500/30" },
  { bg: "from-cyan-500/20 to-cyan-600/10", accent: "bg-cyan-500", text: "text-cyan-600 dark:text-cyan-400", ring: "ring-cyan-500/30" },
  { bg: "from-orange-500/20 to-orange-600/10", accent: "bg-orange-500", text: "text-orange-600 dark:text-orange-400", ring: "ring-orange-500/30" },
  { bg: "from-pink-500/20 to-pink-600/10", accent: "bg-pink-500", text: "text-pink-600 dark:text-pink-400", ring: "ring-pink-500/30" },
];

function getColorForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return BRAND_COLORS[Math.abs(hash) % BRAND_COLORS.length];
}

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

  const fetchClassrooms = useCallback(async () => {
    if (!user) {
      setClassrooms([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [memberOfRes, createdByUserRes] = await Promise.all([
        supabase.from("classroom_members").select("classroom_id").eq("user_id", user.id),
        supabase.from("classrooms").select("id").eq("created_by", user.id),
      ]);

      const memberClassroomIds = (memberOfRes.data || []).map((m: any) => m.classroom_id);
      const createdIds = (createdByUserRes.data || []).map((c: any) => c.id);
      const allIds = [...new Set([...memberClassroomIds, ...createdIds])];

      if (allIds.length === 0) {
        setClassrooms([]);
        return;
      }

      const [classroomsRes, memberCountsRes] = await Promise.all([
        supabase.from("classrooms").select("*").in("id", allIds).order("created_at", { ascending: false }),
        supabase.from("classroom_members").select("classroom_id").in("classroom_id", allIds),
      ]);

      if (classroomsRes.error) throw classroomsRes.error;
      if (memberCountsRes.error) throw memberCountsRes.error;

      const countMap = (memberCountsRes.data || []).reduce<Record<string, number>>((acc, row: any) => {
        acc[row.classroom_id] = (acc[row.classroom_id] || 0) + 1;
        return acc;
      }, {});

      const hydrated = (classroomsRes.data || []).map((c: any) => ({
        ...c,
        member_count: countMap[c.id] || 0,
      }));

      setClassrooms(hydrated);
    } catch (err: any) {
      toast.error(err.message || "Failed to load classrooms");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchClassrooms();
  }, [fetchClassrooms]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("classrooms")
        .insert({ name: name.trim(), description: description.trim() || null, created_by: user.id })
        .select()
        .single();

      if (error) throw error;

      const { error: membershipError } = await supabase.from("classroom_members").upsert(
        {
          classroom_id: data.id,
          user_id: user.id,
          role: "owner",
        },
        { onConflict: "classroom_id,user_id" }
      );

      if (membershipError) throw membershipError;

      toast.success("Classroom created! Waiting for admin approval.");
      setName("");
      setDescription("");
      setCreateOpen(false);
      await fetchClassrooms();
    } catch (error: any) {
      toast.error(error.message || "Failed to create classroom");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinCode.trim()) return;
    setSubmitting(true);

    try {
      const normalizedCode = joinCode.trim().toLowerCase();
      const { data: classroom, error: classroomError } = await supabase
        .from("classrooms")
        .select("id, approved")
        .eq("code", normalizedCode)
        .maybeSingle();

      if (classroomError) throw classroomError;

      if (!classroom) {
        toast.error("Classroom not found. Check the code.");
        return;
      }

      if (!classroom.approved) {
        toast.error("This classroom is not yet approved by admin.");
        return;
      }

      const { data: existingMembership } = await supabase
        .from("classroom_members")
        .select("id")
        .eq("classroom_id", classroom.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingMembership) {
        toast.info("You're already in this classroom.");
      } else {
        const { error } = await supabase.from("classroom_members").insert({
          classroom_id: classroom.id,
          user_id: user.id,
          role: "member",
        });

        if (error) throw error;
        toast.success("Joined classroom!");
      }

      setJoinCode("");
      setJoinOpen(false);
      await fetchClassrooms();
    } catch (error: any) {
      toast.error(error.message || "Failed to join classroom");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
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
          {classrooms.map((c) => {
            const color = getColorForId(c.id);
            return (
              <button
                key={c.id}
                onClick={() => navigate(`/classrooms/${c.id}`)}
                className={`flex w-full items-center gap-3 rounded-xl border border-border bg-gradient-to-br ${color.bg} p-4 text-left shadow-card transition-all hover:shadow-elevated active:scale-[0.98] ring-1 ${color.ring}`}
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color.accent} text-lg font-bold text-white`}>
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
                  <div className="mt-1 flex items-center gap-3">
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" /> {c.member_count} members
                    </p>
                    {c.approved && (
                      <button
                        onClick={(e) => copyCode(c.code, e)}
                        className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-mono font-medium ${color.text} bg-background/50 hover:bg-background/80 transition-colors`}
                      >
                        <Copy className="h-2.5 w-2.5" /> {c.code}
                      </button>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
