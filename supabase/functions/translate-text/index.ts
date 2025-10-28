import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texts, targetLanguage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Translate all texts in batch
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
            content: `You are a professional translator. Translate the provided texts to ${targetLanguage}. Return ONLY a JSON array with the translations in the same order, preserving any HTML tags, special characters, and formatting. For very short texts (1-2 words), provide natural translations. If a text is already in the target language, return it unchanged.`
          },
          {
            role: "user",
            content: JSON.stringify(texts)
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI translation error:", response.status, errorText);
      throw new Error("Translation failed");
    }

    const data = await response.json();
    const translatedContent = data.choices[0].message.content;
    
    let translations;
    try {
      translations = JSON.parse(translatedContent);
    } catch {
      // If response isn't valid JSON, split by newlines as fallback
      translations = translatedContent.split('\n').filter((t: string) => t.trim());
    }

    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
