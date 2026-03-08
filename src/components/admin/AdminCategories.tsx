import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  description: string | null;
}

export default function AdminCategories() {
  const [cats, setCats] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    if (data) setCats(data);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("categories").insert({ name, description: desc || null });
    if (error) toast.error(error.message);
    else { setName(""); setDesc(""); load(); toast.success("Category added"); }
  };

  const update = async (id: string) => {
    const { error } = await supabase.from("categories").update({ name: editName, description: editDesc || null }).eq("id", id);
    if (error) toast.error(error.message);
    else { setEditId(null); load(); toast.success("Updated"); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { load(); toast.success("Deleted"); }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground">Add Category</h3>
        <Input placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <Button onClick={add} size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Add</Button>
      </div>

      <div className="space-y-2">
        {cats.map((cat) => (
          <div key={cat.id} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-card">
            {editId === cat.id ? (
              <>
                <div className="flex-1 space-y-1">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description" />
                </div>
                <Button size="icon" variant="ghost" onClick={() => update(cat.id)}><Check className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => setEditId(null)}><X className="h-4 w-4" /></Button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{cat.name}</p>
                  {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => { setEditId(cat.id); setEditName(cat.name); setEditDesc(cat.description || ""); }}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(cat.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
