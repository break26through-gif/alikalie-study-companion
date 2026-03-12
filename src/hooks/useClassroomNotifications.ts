import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useClassroomNotifications(classroomId: string | undefined) {
  useEffect(() => {
    if (!classroomId) return;

    const channel = supabase
      .channel(`classroom-${classroomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "classroom_notes",
          filter: `classroom_id=eq.${classroomId}`,
        },
        (payload) => {
          const note = payload.new as { title: string };
          toast.info(`📝 New note: ${note.title}`, { duration: 5000 });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "assignments",
          filter: `classroom_id=eq.${classroomId}`,
        },
        (payload) => {
          const assignment = payload.new as { title: string };
          toast.info(`📋 New assignment: ${assignment.title}`, { duration: 5000 });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "announcements",
          filter: `classroom_id=eq.${classroomId}`,
        },
        (payload) => {
          const announcement = payload.new as { title: string };
          toast.info(`📢 New announcement: ${announcement.title}`, { duration: 5000 });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "quizzes",
          filter: `classroom_id=eq.${classroomId}`,
        },
        (payload) => {
          const quiz = payload.new as { title: string };
          toast.info(`🧠 New quiz: ${quiz.title}`, { duration: 5000 });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classroomId]);
}
