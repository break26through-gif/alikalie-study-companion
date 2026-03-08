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

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    const fileName = file.name;
    const fileType = file.type;

    // For text-based files, read directly
    if (fileType.startsWith("text/") || fileName.endsWith(".md") || fileName.endsWith(".txt") || fileName.endsWith(".csv")) {
      const text = await file.text();
      return new Response(JSON.stringify({ content: text, title: fileName }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For images, use AI vision to extract text
    if (fileType.startsWith("image/")) {
      const buffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

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
              role: "user",
              content: [
                { type: "text", text: "Extract all text content from this image. If it's a document, notes, or study material, preserve the structure and formatting as much as possible. Return the extracted text in a clean, readable format." },
                { type: "image_url", image_url: { url: `data:${fileType};base64,${base64}` } },
              ],
            },
          ],
        }),
      });

      if (!response.ok) throw new Error("Failed to process image");
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "Could not extract text from image";
      return new Response(JSON.stringify({ content, title: fileName }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For PDFs and Word docs, read as text (basic extraction)
    // For more complex docs, we use AI to process the raw content
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Try to extract readable text from the file
    let rawText = "";
    try {
      rawText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    } catch {
      rawText = "";
    }

    // Use AI to clean up and extract meaningful content
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
            role: "user",
            content: `Extract and clean up the meaningful text content from this document (${fileName}, type: ${fileType}). Remove any binary artifacts, formatting codes, or corrupted characters. Preserve the structure, headings, and content. If you can't extract meaningful text, describe what you can identify:\n\n${rawText.substring(0, 50000)}`,
          },
        ],
      }),
    });

    if (!response.ok) throw new Error("Failed to process document");
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Could not extract content from document";

    return new Response(JSON.stringify({ content, title: fileName }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
