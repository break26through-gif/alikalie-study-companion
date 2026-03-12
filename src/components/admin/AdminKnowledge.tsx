import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Trash2, Upload, FileText, Loader2, ImageIcon } from "lucide-react";
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
  const [progress, setProgress] = useState("");

  const load = async () => {
    const { data } = await supabase.from("knowledge_docs").select("*").order("created_at", { ascending: false });
    if (data) setDocs(data);
  };

  useEffect(() => { load(); }, []);

  const processFile = async (file: File): Promise<{ content: string; title: string }> => {
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

    if (!resp.ok) throw new Error(`Failed to parse ${file.name}`);
    return await resp.json();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;
    setUploading(true);

    const fileArray = Array.from(files);
    let processed = 0;

    for (const file of fileArray) {
      try {
        setProgress(`Processing ${processed + 1}/${fileArray.length}: ${file.name}`);
        const { content, title } = await processFile(file);

        const { error } = await supabase.from("knowledge_docs").insert({
          title: title || file.name,
          content,
          file_type: file.type,
          uploaded_by: user.id,
        });

        if (error) throw error;
        processed++;
      } catch (err: any) {
        toast.error(`Failed: ${file.name} - ${err.message}`);
      }
    }

    if (processed > 0) {
      toast.success(`${processed} document${processed > 1 ? "s" : ""} uploaded!`);
      load();
    }
    setUploading(false);
    setProgress("");
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
        <h3 className="mb-2 font-display text-sm font-semibold text-foreground">Upload Knowledge Documents</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Upload multiple files at once — PDFs, Word docs, images, or text files. The AI will parse and index them.
        </p>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <Button asChild size="sm" disabled={uploading} className="gap-1">
            <span>
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploading ? "Processing..." : "Upload Documents"}
            </span>
          </Button>
          <input
            type="file"
            className="hidden"
            onChange={handleUpload}
            accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.webp,.gif,.bmp"
            multiple
          />
        </label>
        {progress && (
          <p className="mt-2 text-xs text-muted-foreground animate-pulse">{progress}</p>
        )}
      </div>

      <div className="space-y-2">
        {docs.map((doc) => (
          <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
            {doc.file_type?.startsWith("image/") ? (
              <ImageIcon className="h-5 w-5 shrink-0 text-primary" />
            ) : (
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
            )}
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
