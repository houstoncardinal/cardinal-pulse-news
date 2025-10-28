import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching articles to regenerate...');

    // Find articles with minimal content (likely Yahoo imports)
    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .or('word_count.eq.0,word_count.is.null')
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    console.log(`Found ${articles?.length || 0} articles to regenerate`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const regeneratedArticles = [];
    const failedArticles = [];

    for (const article of articles || []) {
      try {
        console.log(`Regenerating article: ${article.title}`);

        // Extract Yahoo Finance source if available
        const yahooSource = article.sources?.find((s: any) => s.name === 'Yahoo Finance');
        
        // Generate comprehensive article using Lovable AI
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are a professional business and finance journalist for Cardinal News. Write compelling, accurate, SEO-optimized news articles. 
                
                Your output MUST be valid JSON with this exact structure:
                {
                  "title": "Compelling headline under 60 characters",
                  "excerpt": "Brief summary under 160 characters",
                  "content": "Full article content in HTML format (1000-1500 words). Use proper HTML tags: <h2> for main sections, <h3> for subsections, <p> for paragraphs, <blockquote> for powerful quotes or key statements. Include impactful quotes from experts or key figures when relevant. Structure with clear sections and compelling subheadings. Write in an engaging, professional journalistic style with strong narrative flow.",
                  "metaTitle": "SEO-optimized title under 60 characters",
                  "metaDescription": "SEO description under 160 characters",
                  "metaKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
                  "tags": ["tag1", "tag2", "tag3"],
                  "imagePrompt": "A detailed, specific prompt for generating a photorealistic financial/business news photograph. Describe the main subject, setting, lighting, mood, and key visual elements. Be very specific about what should be shown."
                }
                
                Content Formatting Guidelines:
                - Start with a strong opening paragraph that hooks readers
                - Use <h2> tags for major section headings
                - Use <h3> tags for subsections when needed
                - Include <blockquote> tags for powerful statements or expert opinions
                - Each paragraph should be wrapped in <p> tags
                - Write with authority and include expert perspectives
                - Add context and analysis beyond just reporting facts
                
                SEO & E-E-A-T Guidelines:
                - Demonstrate Experience: Include specific details, data, and real-world examples
                - Show Expertise: Reference credible sources and expert opinions
                - Establish Authority: Write with confidence and include verifiable facts
                - Build Trust: Be accurate and maintain objectivity
                - Cite sources appropriately
                - Include relevant market data, statistics, and analysis
                - Make it newsworthy, timely, and engaging
                
                IMPORTANT: Always credit sources but write original, comprehensive content.`
              },
              {
                role: 'user',
                content: `Write a comprehensive professional news article based on this existing article:

HEADLINE: "${article.title}"
CATEGORY: ${article.category}
${article.excerpt ? `CURRENT EXCERPT: ${article.excerpt}` : ''}
${yahooSource ? `ORIGINAL SOURCE: ${yahooSource.name} - ${yahooSource.url}` : ''}
${article.tags && article.tags.length > 0 ? `TOPICS: ${article.tags.join(', ')}` : ''}

Write a full, original article that expands on this story with analysis, context, and expert perspective. Make it engaging and comprehensive (1000-1500 words). ${yahooSource ? 'Credit the original source appropriately.' : ''} Return ONLY valid JSON, no additional text.`
              }
            ],
            temperature: 0.7,
            max_tokens: 4000,
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error('AI API error:', aiResponse.status, errorText);
          failedArticles.push({ id: article.id, title: article.title, error: 'AI generation failed' });
          continue;
        }

        const aiData = await aiResponse.json();
        let generatedContent = aiData.choices[0].message.content;
        
        // Strip markdown code blocks if present
        generatedContent = generatedContent.trim();
        if (generatedContent.startsWith('```json')) {
          generatedContent = generatedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (generatedContent.startsWith('```')) {
          generatedContent = generatedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        // Parse the JSON response
        let articleData;
        try {
          articleData = JSON.parse(generatedContent.trim());
        } catch (parseError) {
          console.error('Failed to parse AI response as JSON:', generatedContent);
          failedArticles.push({ id: article.id, title: article.title, error: 'JSON parse error' });
          continue;
        }

        // PRIORITIZE real news images - DO NOT generate AI images
        console.log('🔍 Searching for real news images...');
        let imageUrl = article.image_url || article.featured_image;
        let imageCredit = article.image_credit;

        // Only try to fetch real images if we don't already have one
        if (!imageUrl) {
          try {
            const { data: imageData, error: imageError } = await supabase.functions.invoke('fetch-news-image', {
              body: { 
                topic: articleData.title,
                category: article.category
              }
            });

            if (!imageError && imageData?.success) {
              imageUrl = imageData.imageUrl;
              imageCredit = imageData.imageCredit;
              console.log('✓ Real news image sourced:', imageCredit);
            } else {
              console.warn('⚠️ No real news image found - article will remain without image');
              // DO NOT generate AI images per user safety policy
              imageUrl = null;
              imageCredit = null;
            }
          } catch (imageError) {
            console.error('Image fetch failed:', imageError);
            imageUrl = null;
            imageCredit = null;
          }
        }

        // Calculate read time and word count
        const wordCount = articleData.content.split(/\s+/).length;
        const readTime = `${Math.max(1, Math.round(wordCount / 200))} min read`;

        // Update article with AI-generated content
        const { error: updateError } = await supabase
          .from('articles')
          .update({
            title: articleData.title,
            excerpt: articleData.excerpt,
            content: articleData.content,
            meta_title: articleData.metaTitle,
            meta_description: articleData.metaDescription,
            meta_keywords: articleData.metaKeywords,
            og_title: articleData.metaTitle,
            og_description: articleData.metaDescription,
            og_image: imageUrl,
            tags: articleData.tags,
            read_time: readTime,
            word_count: wordCount,
            image_url: imageUrl,
            featured_image: imageUrl,
            image_credit: imageCredit,
            updated_at: new Date().toISOString(),
          })
          .eq('id', article.id);

        if (updateError) {
          console.error(`Error updating article ${article.id}:`, updateError);
          failedArticles.push({ id: article.id, title: article.title, error: updateError.message });
          continue;
        }

        console.log(`✓ Article regenerated successfully: ${article.id}`);
        regeneratedArticles.push({ id: article.id, title: articleData.title });

      } catch (error) {
        console.error(`Error processing article ${article.id}:`, error);
        failedArticles.push({ 
          id: article.id, 
          title: article.title, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        regenerated: regeneratedArticles.length,
        failed: failedArticles.length,
        total: articles?.length || 0,
        regeneratedArticles,
        failedArticles,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in regenerate-yahoo-articles function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
