import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

interface ProfileWithRole {
  user_id: string;
  full_name: string | null;
  user_roles: { role: string }[];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<ProfileWithRole[]>([]);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("user_id, full_name, user_roles(role)")
      .then(({ data }) => {
        if (data) setUsers(data as unknown as ProfileWithRole[]);
      });
  }, []);

  return (
    <div className="space-y-2">
      <h3 className="font-display text-sm font-semibold text-foreground mb-2">Registered Users</h3>
      {users.map((u) => (
        <div key={u.user_id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
            <User className="h-4 w-4 text-secondary-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{u.full_name || "Unnamed"}</p>
          </div>
          <div className="flex gap-1">
            {u.user_roles?.map((r, i) => (
              <Badge key={i} variant={r.role === "admin" ? "default" : "secondary"} className="text-[10px]">
                {r.role}
              </Badge>
            ))}
          </div>
        </div>
      ))}
      {users.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">No users yet.</p>
      )}
    </div>
  );
}
