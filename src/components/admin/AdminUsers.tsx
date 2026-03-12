import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Trash2, Edit2, Mail, Shield, UserX } from "lucide-react";
import { toast } from "sonner";

interface ProfileWithRole {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  user_roles: { role: string; id: string }[];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<ProfileWithRole[]>([]);
  const [selectedUser, setSelectedUser] = useState<ProfileWithRole | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, bio, created_at, user_roles(id, role)")
      .order("created_at", { ascending: false });
    if (data) setUsers(data as unknown as ProfileWithRole[]);
  };

  useEffect(() => { load(); }, []);

  const changeRole = async (userId: string, currentRoleId: string, newRole: string) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("id", currentRoleId);
    if (error) toast.error(error.message);
    else { toast.success(`Role updated to ${newRole}`); load(); }
  };

  const deleteUserRole = async (userId: string) => {
    // Remove all roles for this user (effectively disabling)
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);
    if (error) toast.error(error.message);
    else { toast.success("User roles removed"); load(); }
  };

  const viewUser = (u: ProfileWithRole) => {
    setSelectedUser(u);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground">
          Registered Users ({users.length})
        </h3>
      </div>

      {users.map((u) => (
        <div key={u.user_id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
            {u.avatar_url ? (
              <img src={u.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <User className="h-4 w-4 text-secondary-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{u.full_name || "Unnamed"}</p>
            <p className="text-[10px] text-muted-foreground">
              Joined {new Date(u.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {u.user_roles?.map((r) => (
              <Badge key={r.id} variant={r.role === "admin" ? "default" : "secondary"} className="text-[10px]">
                {r.role}
              </Badge>
            ))}
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => viewUser(u)}>
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}

      {users.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">No users yet.</p>
      )}

      {/* User Detail / Edit Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-secondary-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{selectedUser.full_name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(selectedUser.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedUser.bio && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Bio</p>
                  <p className="text-sm text-foreground">{selectedUser.bio}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Role Management</p>
                {selectedUser.user_roles?.map((r) => (
                  <div key={r.id} className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <Select
                      value={r.role}
                      onValueChange={(v) => changeRole(selectedUser.user_id, r.id, v)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <Button
                variant="destructive"
                size="sm"
                className="w-full gap-1.5"
                onClick={() => {
                  deleteUserRole(selectedUser.user_id);
                  setDetailOpen(false);
                }}
              >
                <UserX className="h-4 w-4" /> Remove All Roles
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
