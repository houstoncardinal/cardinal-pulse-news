import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { topics } = await req.json();
    console.log("Generating articles for topics:", topics);

    if (!topics || !Array.isArray(topics)) {
      throw new Error("Topics array is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const results = [];

    for (const topic of topics) {
      try {
        console.log(`Generating article for: ${topic}`);

        // Generate article content with Lovable AI
        const contentPrompt = `You are Hunain Qureshi, a powerful and compelling news writer. Write a comprehensive, engaging news article about: "${topic}"

The article should be:
- 800-1200 words
- Professional yet captivating
- Include relevant context and background
- Well-structured with clear sections
- Written in an authoritative voice
- Include relevant statistics or details where appropriate

Return ONLY a JSON object with this exact structure:
{
  "title": "Compelling headline",
  "excerpt": "Engaging 2-3 sentence summary",
  "content": "Full article content with proper formatting",
  "category": "sports|technology|business|entertainment|world|politics",
  "tags": ["tag1", "tag2", "tag3"],
  "meta_description": "SEO-optimized description (150-160 chars)",
  "meta_keywords": ["keyword1", "keyword2", "keyword3"]
}`;

        const contentResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are a professional journalist. Always return valid JSON." },
              { role: "user", content: contentPrompt }
            ],
          }),
        });

        if (!contentResponse.ok) {
          const errorText = await contentResponse.text();
          console.error(`AI API error for ${topic}:`, contentResponse.status, errorText);
          throw new Error(`AI generation failed: ${contentResponse.status}`);
        }

        const contentData = await contentResponse.json();
        const generatedContent = contentData.choices[0].message.content;
        
        // Parse JSON from response
        let articleData;
        try {
          const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            articleData = JSON.parse(jsonMatch[0]);
          } else {
            articleData = JSON.parse(generatedContent);
          }
        } catch (parseError) {
          console.error("Failed to parse AI response:", generatedContent);
          throw new Error("Invalid JSON response from AI");
        }

        // Generate hero image
        console.log(`Generating image for: ${articleData.title}`);
        const imagePrompt = `Create a professional, high-quality news article hero image for: "${articleData.title}". Style: modern journalism, clean, impactful, 16:9 aspect ratio.`;

        const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image-preview",
            messages: [
              { role: "user", content: imagePrompt }
            ],
            modalities: ["image", "text"]
          }),
        });

        let imageUrl = null;
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          
          if (base64Image) {
            const base64Data = base64Image.split(",")[1];
            const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
            
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
              .from("article-images")
              .upload(fileName, imageBuffer, { contentType: "image/png" });

            if (!uploadError && uploadData) {
              const { data: { publicUrl } } = supabaseClient.storage
                .from("article-images")
                .getPublicUrl(fileName);
              imageUrl = publicUrl;
            }
          }
        }

        // Generate slug
        const slug = articleData.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .substring(0, 60) + "-" + Math.random().toString(36).substring(2, 8);

        // Calculate read time
        const wordCount = articleData.content.split(/\s+/).length;
        const readTime = Math.max(1, Math.round(wordCount / 200)) + " min read";

        // Insert article
        const { data: article, error: insertError } = await supabaseClient
          .from("articles")
          .insert({
            title: articleData.title,
            slug,
            content: articleData.content,
            excerpt: articleData.excerpt,
            category: articleData.category,
            author: "Hunain Qureshi",
            status: "published",
            featured_image: imageUrl,
            image_url: imageUrl,
            tags: articleData.tags,
            meta_description: articleData.meta_description,
            meta_keywords: articleData.meta_keywords,
            meta_title: articleData.title,
            read_time: readTime,
            word_count: wordCount,
            published_at: new Date().toISOString(),
            og_title: articleData.title,
            og_description: articleData.excerpt,
            og_image: imageUrl,
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Failed to insert article for ${topic}:`, insertError);
          throw insertError;
        }

        console.log(`Successfully created article: ${articleData.title}`);
        results.push({
          topic,
          success: true,
          articleId: article.id,
          title: articleData.title,
          slug,
        });
      } catch (topicError) {
        console.error(`Error generating article for ${topic}:`, topicError);
        results.push({
          topic,
          success: false,
          error: topicError instanceof Error ? topicError.message : String(topicError),
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-trending-articles:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
