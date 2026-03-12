import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { moduleTitle, moduleDescription } = await req.json();
    if (!moduleTitle) throw new Error("moduleTitle is required");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert academic content writer. Generate comprehensive, well-structured study notes in Markdown format. The notes should be approximately 5000 words, covering all key concepts, definitions, examples, and practical applications. Use clear headings (##, ###), bullet points, code examples where relevant, tables, and bold key terms. Make the content engaging, thorough, and suitable for university-level students.`,
          },
          {
            role: "user",
            content: `Generate comprehensive study notes (approximately 5000 words) for the following module:\n\nTitle: ${moduleTitle}\n${moduleDescription ? `Description: ${moduleDescription}` : ""}\n\nInclude:\n1. Introduction and overview\n2. Key concepts and definitions\n3. Detailed explanations with examples\n4. Practical applications\n5. Common pitfalls and best practices\n6. Summary and key takeaways\n7. Practice questions at the end`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Failed to generate notes");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Failed to generate notes";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-notes error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
