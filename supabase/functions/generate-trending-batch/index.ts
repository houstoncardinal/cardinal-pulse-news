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
    const { topics } = await req.json();
    
    if (!topics || !Array.isArray(topics)) {
      throw new Error("Topics array is required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log(`🚀 Starting batch generation for ${topics.length} trending topics...`);

    const generatedArticles = [];
    let successCount = 0;
    let failCount = 0;

    for (const topic of topics) {
      try {
        console.log(`📰 Generating article for: "${topic}"`);

        // Determine category based on topic
        let category = "world";
        if (topic.toLowerCase().includes("vs") || topic.toLowerCase().includes("lakers") || 
            topic.toLowerCase().includes("cavaliers") || topic.toLowerCase().includes("pacers")) {
          category = "sports";
        } else if (topic.toLowerCase().includes("stock") || topic.toLowerCase().includes("federal reserve") || 
                   topic.toLowerCase().includes("interest rate")) {
          category = "business";
        } else if (topic.toLowerCase().includes("tour") || topic.toLowerCase().includes("morgan wallen")) {
          category = "entertainment";
        }

        // Generate viral article
        const articlePrompt = `You are Hunain Qureshi, an award-winning breaking news journalist. Write a powerful, viral-worthy news article about the trending topic: "${topic}".

VIRAL CONTENT STRATEGY:
- Create an explosive opening that hooks readers instantly
- Use emotional storytelling and dramatic language
- Include shocking revelations or surprising angles
- Add human interest and real-world impact
- Make it highly shareable with quotable moments
- 900-1200 words for maximum engagement

CRITICAL REQUIREMENTS:
- Research and include accurate, current details about this trending topic
- Explain WHY this is trending NOW
- Include context and background
- Add expert perspectives or public reactions
- Strong call to action or "what's next" angle

Return ONLY valid JSON (no markdown):
{
  "title": "Explosive headline (60-70 chars)",
  "excerpt": "Powerful 2-3 sentence hook",
  "content": "<p>Full article with HTML formatting...</p>",
  "tags": ["${topic}", "breaking", "trending", "tag4", "tag5"],
  "meta_description": "SEO description 150-160 chars",
  "meta_keywords": ["${topic}", "news", "trending", "kw4", "kw5"]
}`;

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are a breaking news journalist. Return ONLY valid JSON without markdown." },
              { role: "user", content: articlePrompt }
            ],
            temperature: 0.3, // Low temperature for factual accuracy
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`AI API error (${response.status}):`, errorText.substring(0, 200));
          failCount++;
          continue;
        }

        const aiData = await response.json();
        let rawContent = aiData.choices?.[0]?.message?.content;
        
        if (!rawContent) {
          console.error("No content in AI response");
          failCount++;
          continue;
        }

        // Parse JSON response
        let articleData;
        try {
          rawContent = rawContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            console.error("No JSON found in response");
            failCount++;
            continue;
          }
          
          articleData = JSON.parse(jsonMatch[0]);
          
          if (!articleData.title || !articleData.content || !articleData.excerpt) {
            console.error("Missing required fields");
            failCount++;
            continue;
          }
        } catch (parseError) {
          console.error("JSON parse error:", parseError instanceof Error ? parseError.message : String(parseError));
          failCount++;
          continue;
        }

        // Check for duplicates
        const { data: existingArticle } = await supabaseClient
          .from('articles')
          .select('id')
          .ilike('title', `%${articleData.title.substring(0, 30)}%`)
          .maybeSingle();

        if (existingArticle) {
          console.log(`⚠️ Similar article exists, skipping`);
          continue;
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

        // Fetch news image
        let imageUrl = null;
        let imageCredit = null;
        
        try {
          const { data: imageData, error: imageError } = await supabaseClient.functions.invoke('fetch-news-image', {
            body: { 
              topic: topic,
              category: category
            }
          });

          if (!imageError && imageData?.success) {
            imageUrl = imageData.imageUrl;
            imageCredit = imageData.imageCredit;
          }
        } catch (imageError) {
          console.error('Image fetch failed:', imageError);
        }

        // Insert article as DRAFT for verification
        const now = new Date().toISOString();
        const { data: article, error: insertError } = await supabaseClient
          .from("articles")
          .insert({
            title: articleData.title,
            slug,
            content: articleData.content,
            excerpt: articleData.excerpt,
            category,
            author: "Hunain Qureshi",
            status: "draft", // Start as draft for verification
            published_at: null, // Will be set after verification
            featured_image: imageUrl,
            image_url: imageUrl,
            image_credit: imageCredit,
            tags: articleData.tags,
            meta_description: articleData.meta_description,
            meta_keywords: articleData.meta_keywords,
            meta_title: articleData.title,
            read_time: readTime,
            word_count: wordCount,
            og_title: articleData.title,
            og_description: articleData.excerpt,
            og_image: imageUrl,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Insert error:", insertError);
          failCount++;
          continue;
        }

        console.log(`✓ Draft created: "${articleData.title}", now verifying...`);

        // Run verification and auto-publish pipeline
        try {
          const { data: verificationData, error: verifyError } = await supabaseClient.functions.invoke('verify-and-publish-article', {
            body: { articleId: article.id }
          });

          if (!verifyError && verificationData?.decision === 'publish') {
            console.log(`✓ PUBLISHED after verification: "${articleData.title}"`);
            generatedArticles.push({
              topic,
              title: articleData.title,
              category,
              verificationStatus: 'published'
            });
            successCount++;
          } else {
            const status = verificationData?.decision || 'verification_failed';
            console.log(`✗ ${status.toUpperCase()}: "${articleData.title}"`);
            failCount++;
          }
        } catch (verifyError) {
          console.error("Verification error:", verifyError);
          failCount++;
        }

        // Delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`Error generating article for "${topic}":`, error);
        failCount++;
      }
    }

    console.log(`✅ Batch complete! ${successCount} published, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Generated ${successCount} trending articles`,
        totalRequested: topics.length,
        successCount,
        failCount,
        articles: generatedArticles
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Batch generation error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
