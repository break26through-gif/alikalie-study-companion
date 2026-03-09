import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const EMOJIS = ["👍", "❤️", "🔥", "👏", "😂"];

interface Props {
  targetType: "note" | "assignment" | "submission" | "announcement" | "quiz";
  targetId: string;
}

interface ReactionCount {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

export default function EmojiReaction({ targetType, targetId }: Props) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<ReactionCount[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const fetchReactions = async () => {
    const { data } = await supabase
      .from("emoji_reactions")
      .select("emoji, user_id")
      .eq("target_type", targetType)
      .eq("target_id", targetId);

    if (data) {
      const counts: Record<string, { count: number; hasReacted: boolean }> = {};
      data.forEach((r: any) => {
        if (!counts[r.emoji]) counts[r.emoji] = { count: 0, hasReacted: false };
        counts[r.emoji].count++;
        if (r.user_id === user?.id) counts[r.emoji].hasReacted = true;
      });
      setReactions(
        Object.entries(counts).map(([emoji, v]) => ({ emoji, ...v }))
      );
    }
  };

  useEffect(() => {
    fetchReactions();
  }, [targetType, targetId, user]);

  const toggleReaction = async (emoji: string) => {
    if (!user) return;
    const existing = reactions.find((r) => r.emoji === emoji && r.hasReacted);
    if (existing) {
      await supabase
        .from("emoji_reactions")
        .delete()
        .eq("user_id", user.id)
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .eq("emoji", emoji);
    } else {
      await supabase.from("emoji_reactions").insert({
        user_id: user.id,
        target_type: targetType,
        target_id: targetId,
        emoji,
      });
    }
    setShowPicker(false);
    fetchReactions();
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => toggleReaction(r.emoji)}
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs transition-all active:scale-95",
            r.hasReacted
              ? "border-primary/30 bg-primary/10 text-foreground"
              : "border-border bg-card text-muted-foreground hover:bg-secondary"
          )}
        >
          {r.emoji} {r.count}
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs text-muted-foreground hover:bg-secondary"
        >
          +
        </button>
        {showPicker && (
          <div className="absolute bottom-8 right-0 z-50 flex gap-1 rounded-lg border border-border bg-card p-1.5 shadow-elevated">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => toggleReaction(e)}
                className="rounded p-1 text-base hover:bg-secondary active:scale-90 transition-transform"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
