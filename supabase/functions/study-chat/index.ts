import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const messages = body?.messages ?? [];
    const moduleTitle = body?.moduleTitle ?? "Free Chat";
    const moduleId: string | null = body?.moduleId ?? null;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch knowledge docs for context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const isFreeChat = !moduleId;

    // Get module notes (optional)
    let moduleNotes: string | null = null;
    if (moduleId) {
      const { data: moduleData } = await supabase
        .from("modules")
        .select("notes_content")
        .eq("id", moduleId)
        .maybeSingle();
      moduleNotes = moduleData?.notes_content ?? null;
    }

    // Get all knowledge docs
    const { data: knowledgeDocs } = await supabase
      .from("knowledge_docs")
      .select("title, content")
      .limit(20);

    let knowledgeContext = "";
    if (moduleNotes) {
      knowledgeContext += `\n\n## Module Notes for "${moduleTitle}":\n${moduleNotes}`;
    }
    if (knowledgeDocs && knowledgeDocs.length > 0) {
      knowledgeContext += "\n\n## Additional Knowledge Base:\n";
      for (const doc of knowledgeDocs) {
        knowledgeContext += `\n### ${doc.title}:\n${doc.content.substring(0, 3000)}\n`;
      }
    }

    const systemPrompt = isFreeChat
      ? `You are the Alikalie Fofanah Study Companion AI — a knowledgeable and friendly tutor specializing in Computer Science, ICT, and B.Tech courses.

IMPORTANT GUIDELINES:
- This is a free-form learning chat (no specific module selected)
- Use Sierra Leone and African contexts as case studies whenever possible
- Reference real-world examples from African technology ecosystems
- Be encouraging and supportive in your teaching style
- Explain concepts clearly with practical examples
- When relevant, reference local institutions, companies, and technologies in Sierra Leone and Africa
- Use the provided knowledge base to give accurate, contextual answers

${knowledgeContext}`
      : `You are the Alikalie Fofanah Study Companion AI — a knowledgeable and friendly tutor specializing in Computer Science, ICT, and B.Tech courses.

IMPORTANT GUIDELINES:
- You are currently helping a student study the module: "${moduleTitle}"
- Use Sierra Leone and African contexts as case studies whenever possible
- Reference real-world examples from African technology ecosystems
- Be encouraging and supportive in your teaching style
- Explain concepts clearly with practical examples
- When relevant, reference local institutions, companies, and technologies in Sierra Leone and Africa
- If the student asks about something outside your knowledge, guide them to the relevant resources
- Use the provided knowledge base and module notes to give accurate, contextual answers

${knowledgeContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
