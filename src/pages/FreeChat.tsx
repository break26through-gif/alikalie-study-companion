import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Send, Loader2, ArrowLeft, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export default function FreeChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextarea = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 150)}px`;
  }, []);

  useEffect(() => {
    adjustTextarea();
  }, [input, adjustTextarea]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    const init = async () => {
      const requestedId = searchParams.get("c");

      // 1) If a conversation id was provided, only use it if it belongs to the user and is a free chat.
      if (requestedId) {
        const { data: existing } = await supabase
          .from("conversations")
          .select("id")
          .eq("id", requestedId)
          .eq("user_id", user.id)
          .is("module_id", null)
          .maybeSingle();

        if (existing?.id) {
          setConvId(existing.id);
          const { data: msgs } = await supabase
            .from("messages")
            .select("role, content")
            .eq("conversation_id", existing.id)
            .order("created_at");
          if (msgs) setMessages(msgs as Msg[]);
          return;
        }
      }

      // 2) Otherwise, load the user's latest free chat conversation, or create one.
      let { data: conv } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", user.id)
        .is("module_id", null)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!conv) {
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({ user_id: user.id, module_id: null })
          .select("id")
          .single();
        conv = newConv;
      }

      if (conv?.id) {
        setConvId(conv.id);
        const { data: msgs } = await supabase
          .from("messages")
          .select("role, content")
          .eq("conversation_id", conv.id)
          .order("created_at");
        if (msgs) setMessages(msgs as Msg[]);
      }
    };

    init();
  }, [user, searchParams]);

  const sendMessage = async () => {
    if (!user || !input.trim() || !convId || loading) return;

    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    await supabase.from("messages").insert({
      conversation_id: convId,
      role: "user",
      content: userMsg.content,
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", convId);

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-chat`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          moduleTitle: "Free Chat",
          moduleId: null,
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Failed to get AI response");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              const finalContent = assistantSoFar;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: finalContent } : m);
                }
                return [...prev, { role: "assistant", content: finalContent }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (assistantSoFar) {
        await supabase.from("messages").insert({
          conversation_id: convId,
          role: "assistant",
          content: assistantSoFar,
        });

        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", convId);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - var(--bottom-nav-height))" }}>
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-3 sm:px-4">
        <button
          onClick={() => navigate(-1)}
          className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-base font-semibold text-foreground sm:text-lg">Free Chat</h1>
          <p className="truncate text-[11px] text-muted-foreground sm:text-xs">Learn anything after login — no course needed</p>
        </div>
        <Sparkles className="h-4 w-4 text-primary" />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Ask anything and the AI will explain with clear steps and practical examples.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-secondary-foreground rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-secondary px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-secondary-foreground" />
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="flex items-end gap-2 border-t border-border bg-card px-4 py-3"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            disabled={loading}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50"
            style={{ minHeight: "40px", maxHeight: "150px" }}
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()} className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
