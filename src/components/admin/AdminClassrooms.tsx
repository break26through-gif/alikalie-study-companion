import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

interface Classroom {
  id: string;
  name: string;
  description: string | null;
  code: string;
  approved: boolean;
  created_by: string;
  created_at: string;
  creator_name?: string;
  member_count?: number;
}

export default function AdminClassrooms() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  const fetch = async () => {
    const { data } = await supabase
      .from("classrooms")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      const enriched = await Promise.all(
        data.map(async (c: any) => {
          const { data: prof } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", c.created_by)
            .single();
          const { count } = await supabase
            .from("classroom_members")
            .select("*", { count: "exact", head: true })
            .eq("classroom_id", c.id);
          return { ...c, creator_name: prof?.full_name || "Unknown", member_count: count || 0 };
        })
      );
      setClassrooms(enriched);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const approve = async (id: string) => {
    const { data: classroom, error: approveError } = await supabase
      .from("classrooms")
      .update({ approved: true })
      .eq("id", id)
      .select("id, created_by")
      .single();

    if (approveError || !classroom) {
      toast.error(approveError?.message || "Failed to approve classroom");
      return;
    }

    const { error: ownerError } = await supabase.from("classroom_members").upsert(
      {
        classroom_id: classroom.id,
        user_id: classroom.created_by,
        role: "owner",
      },
      { onConflict: "classroom_id,user_id" }
    );

    if (ownerError) {
      toast.error(ownerError.message);
      return;
    }

    toast.success("Classroom approved!");
    fetch();
  };

  const reject = async (id: string) => {
    const { error } = await supabase.from("classrooms").update({ approved: false }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Classroom rejected"); fetch(); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("classrooms").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Classroom deleted"); fetch(); }
  };

  return (
    <div className="space-y-2">
      <h3 className="font-display text-sm font-semibold text-foreground mb-2">All Classrooms</h3>
      {classrooms.map((c) => (
        <div key={c.id} className="rounded-xl border border-border bg-card p-3 shadow-card">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium text-foreground">{c.name}</p>
                <Badge variant={c.approved ? "default" : "secondary"} className="text-[10px]">
                  {c.approved ? "Approved" : "Pending"}
                </Badge>
              </div>
              {c.description && <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.description}</p>}
              <p className="mt-1 text-[10px] text-muted-foreground">
                By {c.creator_name} · Code: {c.code} · <Users className="inline h-3 w-3" /> {c.member_count}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              {!c.approved && (
                <Button variant="ghost" size="sm" onClick={() => approve(c.id)} className="text-green-600 hover:text-green-700 h-8 w-8 p-0">
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
              {c.approved && (
                <Button variant="ghost" size="sm" onClick={() => reject(c.id)} className="text-yellow-600 hover:text-yellow-700 h-8 w-8 p-0">
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => remove(c.id)} className="text-destructive hover:text-destructive h-8 w-8 p-0">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
      {classrooms.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">No classrooms yet.</p>
      )}
    </div>
  );
}
