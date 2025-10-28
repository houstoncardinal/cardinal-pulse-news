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

    // Fetch existing article titles to avoid duplication
    const { data: existingArticles } = await supabaseClient
      .from('articles')
      .select('title')
      .order('created_at', { ascending: false })
      .limit(100);
    
    const existingTitles = existingArticles?.map(a => a.title) || [];

    const results = [];

    for (const topic of topics) {
      try {
        console.log(`Generating article for: ${topic}`);

        const timestamp = new Date().toISOString();
        const uniqueAngles = [
          "exclusive breaking analysis", "investigative deep dive", "expert consensus report",
          "comprehensive market update", "emerging patterns analysis", "insider perspective",
          "critical examination", "trend analysis report", "impact assessment study"
        ];
        const angle = uniqueAngles[Math.floor(Math.random() * uniqueAngles.length)];

        const existingContext = existingTitles.length > 0 
          ? `\n\nCRITICAL: These titles already exist - your article MUST have a completely different headline and angle:\n${existingTitles.slice(-10).join('\n')}`
          : '';

        // Generate article content with Lovable AI
        const contentPrompt = `You are Hunain Qureshi, a powerful and compelling news writer. Write a comprehensive, engaging news article about: "${topic}"

Unique Angle: ${angle}
Generation Timestamp: ${timestamp}
${existingContext}

The article should be:
- 800-1200 words
- Professional yet captivating with a UNIQUE perspective
- Include relevant context and background NOT covered in existing articles
- Well-structured with clear sections using varied heading styles
- Written in an authoritative voice with distinctive insights
- Include relevant statistics, data points, or details that are specific and fresh
- MUST have a completely unique headline that doesn't resemble existing articles
- Focus on a different aspect or angle of the topic than typical coverage

Return ONLY a JSON object with this exact structure:
{
  "title": "Compelling, UNIQUE headline that stands out",
  "excerpt": "Engaging 2-3 sentence summary with fresh perspective",
  "content": "Full article content with proper formatting and unique insights",
  "category": "sports|technology|business|entertainment|world|politics|ai-innovation|science",
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

        // Fetch real news image from web
        console.log(`🔍 Searching for real news images for: ${articleData.title}`);
        let imageUrl = null;
        let imageCredit = null;
        
        try {
          const { data: imageData, error: imageError } = await supabaseClient.functions.invoke('fetch-news-image', {
            body: { 
              topic: topic,
              category: articleData.category
            }
          });

          if (!imageError && imageData?.success) {
            imageUrl = imageData.imageUrl;
            imageCredit = imageData.imageCredit;
            console.log('✓ Real news image sourced:', imageCredit);
          } else {
            console.warn('No suitable news image found, continuing without image');
          }
        } catch (imageError) {
          console.error('Image fetch failed:', imageError);
        }

        // Enhanced duplicate detection - check both title similarity and content overlap
        const titleWords = new Set(
          articleData.title
            .toLowerCase()
            .split(/\s+/)
            .filter((word: string) => word.length > 3)
        );

        let isDuplicate = false;
        for (const existingTitle of existingTitles) {
          const existingWords = new Set(
            existingTitle
              .toLowerCase()
              .split(/\s+/)
              .filter((word: string) => word.length > 3)
          );

          const titleWordsArray = Array.from(titleWords) as string[];
          const commonWords = titleWordsArray.filter((word: string) => existingWords.has(word));
          const similarity = commonWords.length / Math.max(titleWords.size, existingWords.size);

          // More strict: 70% similarity threshold
          if (similarity > 0.7) {
            console.log(`⚠️ Skipping similar article: "${articleData.title}"`);
            console.log(`Similar to existing: "${existingTitle}" (${(similarity * 100).toFixed(1)}% match)`);
            isDuplicate = true;
            break;
          }
        }
        
        if (isDuplicate) {
          results.push({
            topic,
            success: false,
            error: 'Similar article already exists'
          });
          continue;
        }
        
        existingTitles.push(articleData.title);

        // Generate slug
        const slug = articleData.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .substring(0, 60) + "-" + Math.random().toString(36).substring(2, 8);

        // Calculate read time
        const wordCount = articleData.content.split(/\s+/).length;
        const readTime = Math.max(1, Math.round(wordCount / 200)) + " min read";

        // Insert article - AUTO-PUBLISH
        const now = new Date().toISOString();
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
            published_at: now,
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

        console.log(`✓ Published article by Hunain Qureshi: "${articleData.title}"`);

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
