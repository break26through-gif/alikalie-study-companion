import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";

interface Category { id: string; name: string; }
interface Module { id: string; title: string; description: string | null; category_id: string | null; notes_content: string | null; }

export default function AdminModules() {
  const [cats, setCats] = useState<Category[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [catId, setCatId] = useState("");
  const [notes, setNotes] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editCatId, setEditCatId] = useState("");

  const load = async () => {
    const [c, m] = await Promise.all([
      supabase.from("categories").select("id, name").order("sort_order"),
      supabase.from("modules").select("*").order("sort_order"),
    ]);
    if (c.data) setCats(c.data);
    if (m.data) setModules(m.data);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!title.trim() || !catId) return;
    const { error } = await supabase.from("modules").insert({
      title, description: desc || null, category_id: catId, notes_content: notes || null,
    });
    if (error) toast.error(error.message);
    else { setTitle(""); setDesc(""); setNotes(""); load(); toast.success("Module added"); }
  };

  const update = async (id: string) => {
    const { error } = await supabase.from("modules").update({
      title: editTitle, description: editDesc || null, notes_content: editNotes || null, category_id: editCatId || null,
    }).eq("id", id);
    if (error) toast.error(error.message);
    else { setEditId(null); load(); toast.success("Updated"); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("modules").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { load(); toast.success("Deleted"); }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground">Add Module</h3>
        <Select value={catId} onValueChange={setCatId}>
          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>
            {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Module title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <Textarea placeholder="Notes content (Markdown)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
        <Button onClick={add} size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Add Module</Button>
      </div>

      <div className="space-y-2">
        {modules.map((mod) => (
          <div key={mod.id} className="rounded-xl border border-border bg-card p-3 shadow-card">
            {editId === mod.id ? (
              <div className="space-y-2">
                <Select value={editCatId} onValueChange={setEditCatId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description" />
                <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={4} placeholder="Notes (Markdown)" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => update(mod.id)}><Check className="mr-1 h-3.5 w-3.5" /> Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditId(null)}><X className="mr-1 h-3.5 w-3.5" /> Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{mod.title}</p>
                  {mod.description && <p className="text-xs text-muted-foreground">{mod.description}</p>}
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {cats.find((c) => c.id === mod.category_id)?.name || "No category"}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => {
                  setEditId(mod.id); setEditTitle(mod.title); setEditDesc(mod.description || "");
                  setEditNotes(mod.notes_content || ""); setEditCatId(mod.category_id || "");
                }}><Edit2 className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(mod.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
