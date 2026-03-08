import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, MessageCircle, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import ModuleChat from "@/components/ModuleChat";

interface Module {
  id: string;
  title: string;
  description: string | null;
  notes_content: string | null;
}

export default function ModuleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mod, setMod] = useState<Module | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from("modules").select("*").eq("id", id).single().then(({ data }) => {
      if (data) setMod(data);
    });
  }, [id]);

  if (!mod) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - var(--bottom-nav-height))" }}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-3 sm:px-4">
        <button onClick={() => navigate("/modules")} className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-base font-semibold text-foreground sm:text-lg">{mod.title}</h1>
          {mod.description && <p className="truncate text-[11px] text-muted-foreground sm:text-xs">{mod.description}</p>}
        </div>
      </div>

      <Tabs defaultValue="notes" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-3 mt-2 grid w-auto grid-cols-2 sm:mx-4 sm:mt-3">
          <TabsTrigger value="notes" className="gap-1.5 text-xs sm:text-sm">
            <BookOpen className="h-3.5 w-3.5" /> Notes
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5 text-xs sm:text-sm">
            <MessageCircle className="h-3.5 w-3.5" /> AI Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="flex-1 overflow-auto px-3 py-3 sm:px-4 sm:py-4">
          {mod.notes_content ? (
            <div className="prose prose-sm max-w-none text-foreground prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-code:text-primary prose-li:text-muted-foreground">
              <ReactMarkdown>{mod.notes_content}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center py-20 text-center">
              <BookOpen className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No notes available yet for this module.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="chat" className="flex flex-1 flex-col overflow-hidden">
          {user && id && <ModuleChat moduleId={id} moduleTitle={mod.title} userId={user.id} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
