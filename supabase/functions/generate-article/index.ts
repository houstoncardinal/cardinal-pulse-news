import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { trendingTopicId } = await req.json();
    
    // Log job start
    const { data: job } = await supabaseClient
      .from('jobs')
      .insert({
        type: 'generate_article',
        status: 'running',
        started_at: new Date().toISOString(),
        payload: { trendingTopicId }
      })
      .select()
      .single();
    
    console.log('Generating article for trending topic:', trendingTopicId);

    // Fetch the trending topic
    const { data: topic, error: topicError } = await supabaseClient
      .from('trending_topics')
      .select('*')
      .eq('id', trendingTopicId)
      .single();

    if (topicError || !topic) {
      throw new Error('Trending topic not found');
    }

    // Generate article using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Generate article content
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
            content: `You are a professional news journalist for Cardinal News. Write compelling, accurate, SEO-optimized news articles based on trending topics. 
            
            Your output MUST be valid JSON with this exact structure:
            {
              "title": "Compelling headline under 60 characters",
              "excerpt": "Brief summary under 160 characters",
              "content": "Full article content in HTML format (1000-1500 words). Use proper HTML tags: <h2> for main sections, <h3> for subsections, <p> for paragraphs, <blockquote> for powerful quotes or key statements. Include impactful quotes from experts or key figures when relevant. Structure with clear sections and compelling subheadings. Write in an engaging, professional journalistic style with strong narrative flow.",
              "metaTitle": "SEO-optimized title under 60 characters",
              "metaDescription": "SEO description under 160 characters",
              "metaKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
              "tags": ["tag1", "tag2", "tag3"],
              "category": "one of: world, business, technology, sports, entertainment, music, movies, events, science, politics, ai_innovation, lifestyle",
              "sources": [{"name": "Source Name", "url": "https://source.com"}],
              "imagePrompt": "A detailed, specific prompt for generating a photorealistic news photograph. Describe the main subject, setting, lighting, mood, and key visual elements that would accurately represent this specific news story. Be very specific about what should be shown - mention key people, objects, locations, or events. Example: 'A photorealistic image of [specific subject] with [specific details about the scene], dramatic professional lighting, 16:9 news photography composition, ultra high resolution.'"
            }
            
            Content Formatting Guidelines:
            - Start with a strong opening paragraph that hooks readers
            - Use <h2> tags for major section headings (e.g., "The Impact on Global Markets", "Expert Analysis")
            - Use <h3> tags for subsections when needed
            - Include <blockquote> tags for powerful statements, expert opinions, or key quotes
            - Each paragraph should be wrapped in <p> tags
            - Write with authority and include expert perspectives
            - Add dramatic impact with well-placed quotes
            
            SEO & E-E-A-T Guidelines:
            - Demonstrate Experience: Include specific details, data, and real-world examples
            - Show Expertise: Reference credible sources, studies, and expert opinions
            - Establish Authority: Write with confidence and include verifiable facts
            - Build Trust: Cite reputable sources, be accurate, and maintain objectivity
            - Write factual, unbiased content with strong journalistic integrity
            - Use engaging headlines that attract clicks while being accurate
            - Include relevant context and background information
            - Cite at least 2-3 credible sources in the sources array
            - Optimize for search engines naturally without keyword stuffing
            - Make it newsworthy, timely, and engaging
            - Create a HIGHLY DETAILED and SPECIFIC imagePrompt that describes exactly what visual elements should appear in the hero image to accurately represent THIS SPECIFIC story. Include details about the main subjects, setting, actions, mood, and composition.`
          },
          {
            role: 'user',
            content: `Write a professional news article about this trending topic: "${topic.topic}". 
            Region: ${topic.region || 'global'}
            Keywords: ${topic.keywords?.join(', ') || 'N/A'}
            Related queries: ${topic.related_queries?.join(', ') || 'N/A'}
            ${topic.trend_data ? `Additional context: ${JSON.stringify(topic.trend_data)}` : ''}
            
            Make it comprehensive, engaging, and SEO-optimized with proper source citations. Return ONLY valid JSON, no additional text.`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    let generatedContent = aiData.choices[0].message.content;
    
    console.log('AI generated content:', generatedContent);

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
      throw new Error('AI did not return valid JSON');
    }

    // Fetch real news image from web
    console.log('🔍 Searching for real news images from web sources...');
    let imageUrl = null;
    let imageCredit = null;

    try {
      const { data: imageData, error: imageError } = await supabaseClient.functions.invoke('fetch-news-image', {
        body: { 
          topic: topic.topic,
          category: articleData.category
        }
      });

      if (!imageError && imageData?.success) {
        imageUrl = imageData.imageUrl;
        imageCredit = imageData.imageCredit;
        console.log('✓ Real news image sourced:', imageCredit);
      } else {
        console.warn('No suitable news image found, article will be published without image');
      }
    } catch (imageError) {
      console.error('Image fetch failed:', imageError);
      // Continue without image if fetch fails
    }

    // Generate slug
    const slug = articleData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50) + '-' + Math.random().toString(36).substring(2, 8);

    // Calculate read time and word count
    const wordCount = articleData.content.split(/\s+/).length;
    const readTime = `${Math.max(1, Math.round(wordCount / 200))} min read`;

    // Generate schema markup for SEO
    const schemaMarkup = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": articleData.title,
      "description": articleData.excerpt,
      "author": {
        "@type": "Organization",
        "name": "Cardinal News"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Cardinal News",
        "logo": {
          "@type": "ImageObject",
          "url": "https://cardinalnews.com/logo.png"
        }
      },
      "datePublished": new Date().toISOString(),
      "keywords": articleData.metaKeywords?.join(', '),
    };

    // Insert article into database - AUTO-PUBLISH
    const now = new Date().toISOString();
    const { data: article, error: insertError } = await supabaseClient
      .from('articles')
      .insert({
        title: articleData.title,
        slug: slug,
        excerpt: articleData.excerpt,
        content: articleData.content,
        category: articleData.category || 'world',
        author: 'Hunain Qureshi',
        tags: articleData.tags || [],
        meta_title: articleData.metaTitle,
        meta_description: articleData.metaDescription,
        meta_keywords: articleData.metaKeywords || [],
        schema_markup: schemaMarkup,
        og_title: articleData.metaTitle,
        og_description: articleData.metaDescription,
        og_image: imageUrl,
        trending_topic_id: trendingTopicId,
        status: 'published',
        published_at: now,
        read_time: readTime,
        image_url: imageUrl,
        image_credit: imageCredit,
        sources: articleData.sources || [],
        word_count: wordCount,
        featured_image: imageUrl,
      })
      .select()
      .single();

    console.log(`✓ Article published successfully: "${articleData.title}" (ID: ${article?.id})`);

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    // Mark topic as processed
    await supabaseClient
      .from('trending_topics')
      .update({ processed: true })
      .eq('id', trendingTopicId);

    console.log('Article generated successfully:', article.id);
    
    // Update job as completed
    if (job) {
      await supabaseClient
        .from('jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id)
    }

    return new Response(
      JSON.stringify({ success: true, article }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-article function:', error);
    
    // Update job as failed if it exists
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      
      const { data: runningJobs } = await supabaseClient
        .from('jobs')
        .select('id')
        .eq('type', 'generate_article')
        .eq('status', 'running')
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (runningJobs && runningJobs.length > 0) {
        await supabaseClient
          .from('jobs')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date().toISOString()
          })
          .eq('id', runningJobs[0].id)
      }
    } catch (jobError) {
      console.error('Error updating job status:', jobError)
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
