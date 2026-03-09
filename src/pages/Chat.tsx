import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { MessageCircle, ChevronRight } from "lucide-react";

interface ConvWithModule {
  id: string;
  module_id: string;
  updated_at: string;
  modules: { title: string } | null;
}

export default function Chat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConvWithModule[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("conversations")
      .select("id, module_id, updated_at, modules(title)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        if (data) setConversations(data as unknown as ConvWithModule[]);
      });
  }, [user]);

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-1 font-display text-2xl font-bold text-foreground">Chats</h1>
      <p className="mb-6 text-sm text-muted-foreground">Your AI study conversations</p>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No conversations yet. Go to a module and start chatting!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/modules/${c.module_id}`)}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-card transition-all hover:shadow-elevated"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <MessageCircle className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">
                  {c.modules?.title || "Unknown Module"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last active {new Date(c.updated_at).toLocaleDateString()}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
