import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Doc {
  id: string;
  title: string;
  content: string;
  file_type: string | null;
  created_at: string;
}

export default function AdminKnowledge() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("knowledge_docs").select("*").order("created_at", { ascending: false });
    if (data) setDocs(data);
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);

    try {
      // Read file content - for text files read directly, for others use the edge function
      const formData = new FormData();
      formData.append("file", file);

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-document`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!resp.ok) throw new Error("Failed to parse document");
      const { content, title } = await resp.json();

      const { error } = await supabase.from("knowledge_docs").insert({
        title: title || file.name,
        content,
        file_type: file.type,
        uploaded_by: user.id,
      });

      if (error) throw error;
      toast.success("Document uploaded and processed!");
      load();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    setUploading(false);
    e.target.value = "";
  };

  const remove = async (id: string) => {
    await supabase.from("knowledge_docs").delete().eq("id", id);
    load();
    toast.success("Removed");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <h3 className="mb-2 font-display text-sm font-semibold text-foreground">Upload Knowledge Document</h3>
        <p className="mb-3 text-xs text-muted-foreground">Upload PDF, Word, PNG, or text files. The AI will parse and use them for study references.</p>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <Button asChild size="sm" disabled={uploading} className="gap-1">
            <span>
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploading ? "Processing..." : "Upload Document"}
            </span>
          </Button>
          <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg" />
        </label>
      </div>

      <div className="space-y-2">
        {docs.map((doc) => (
          <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
            <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{doc.title}</p>
              <p className="text-[10px] text-muted-foreground">
                {doc.file_type} • {new Date(doc.created_at).toLocaleDateString()}
              </p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => remove(doc.id)} className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {docs.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">No knowledge documents uploaded yet.</p>
        )}
      </div>
    </div>
  );
}
