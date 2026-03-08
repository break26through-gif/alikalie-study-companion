import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LogOut, User, Save } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { user, signOut, isAdmin } = useAuth();
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, bio")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name || "");
          setBio(data.bio || "");
        }
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, bio })
      .eq("user_id", user.id);
    if (error) toast.error("Failed to save");
    else toast.success("Profile updated!");
    setSaving(false);
  };

  return (
    <div className="px-4 py-6">
      <h1 className="mb-1 font-display text-2xl font-bold text-foreground">Profile</h1>
      <p className="mb-6 text-sm text-muted-foreground">Manage your account</p>

      <div className="mb-6 flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <User className="h-6 w-6 text-secondary-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">{fullName || "Student"}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          {isAdmin && (
            <span className="mt-1 inline-block rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
              Admin
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Bio</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell us about yourself..." />
        </div>
        <Button onClick={save} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>

      <Button variant="outline" onClick={signOut} className="mt-6 w-full gap-2 text-destructive">
        <LogOut className="h-4 w-4" /> Sign Out
      </Button>
    </div>
  );
}
