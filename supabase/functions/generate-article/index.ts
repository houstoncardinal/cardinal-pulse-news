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

    // Fetch existing article titles to avoid duplication
    const { data: existingArticles } = await supabaseClient
      .from('articles')
      .select('title')
      .order('created_at', { ascending: false })
      .limit(100);
    
    const existingTitles = existingArticles?.map(a => a.title) || [];
    const existingContext = existingTitles.length > 0 
      ? `\n\nCRITICAL UNIQUENESS REQUIREMENT: These titles already exist in our system - your article MUST have a completely different headline and unique angle:\n${existingTitles.slice(-10).join('\n')}\n\nYou MUST find a fresh perspective that makes your article stand out from these existing pieces.`
      : '';

    // Fetch the trending topic
    const { data: topic, error: topicError } = await supabaseClient
      .from('trending_topics')
      .select('*')
      .eq('id', trendingTopicId)
      .single();

    if (topicError || !topic) {
      throw new Error('Trending topic not found');
    }

    const timestamp = new Date().toISOString();
    const uniqueFrameworks = [
      "investigative analysis", "expert roundtable", "data-driven report",
      "comprehensive overview", "critical examination", "industry insider view",
      "breaking coverage", "impact study", "trend forecast", "detailed investigation"
    ];
    const framework = uniqueFrameworks[Math.floor(Math.random() * uniqueFrameworks.length)];

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
            content: `You are an ELITE investigative journalist for Cardinal News with expertise across multiple domains. You have access to extensive knowledge and can synthesize complex information into compelling narratives.

            SUPREME QUALITY MANDATE:
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            🎯 CORE PRINCIPLES:
            - ACCURACY IS PARAMOUNT: Every fact must be verifiable
            - ORIGINALITY REQUIRED: Unique angle, fresh perspective, novel insights
            - DEPTH OVER BREADTH: Comprehensive analysis over surface coverage
            - JOURNALISTIC INTEGRITY: Balanced, fair, ethical reporting
            - READER VALUE: Every sentence must inform, educate, or engage
            
            📊 GENERATION PARAMETERS:
            - Framework: ${framework}
            - Timestamp: ${timestamp}
            - Quality Threshold: PREMIUM TIER
            
            Your output MUST be valid JSON with this exact structure:
            {
              "title": "UNIQUE and compelling headline under 60 characters",
              "excerpt": "Brief summary with fresh perspective under 160 characters",
              "content": "Full article content in HTML format (1000-1500 words). Use proper HTML tags: <h2> for main sections, <h3> for subsections, <p> for paragraphs, <blockquote> for powerful quotes or key statements. Include impactful quotes from experts or key figures when relevant. Structure with clear sections and compelling subheadings. Write in an engaging, professional journalistic style with strong narrative flow and ORIGINAL insights.",
              "metaTitle": "SEO-optimized title under 60 characters",
              "metaDescription": "SEO description under 160 characters",
              "metaKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
              "tags": ["tag1", "tag2", "tag3"],
              "category": "one of: world, business, technology, sports, entertainment, music, movies, events, science, politics, ai_innovation, lifestyle",
              "sources": [
                {"name": "Primary Source Name", "url": "https://source1.com", "credibility": "high"},
                {"name": "Secondary Source Name", "url": "https://source2.com", "credibility": "medium"}
              ],
              "imagePrompt": "ULTRA-SPECIFIC news photograph prompt: [Primary subject with exact details], [Specific setting/location], [Key visual elements], [Lighting conditions], [Composition style], [Mood/atmosphere]. Include: technical details (aperture, focal length simulation), time of day, weather conditions, and any symbolic elements that enhance the story. Make it PHOTOJOURNALISM QUALITY.",
              "data_points": [
                {"metric": "Key statistic 1", "value": "X", "source": "verified source"},
                {"metric": "Key statistic 2", "value": "Y", "source": "verified source"}
              ]
            }
            
            Content Formatting Guidelines:
            - Start with a strong opening paragraph that hooks readers
            - Use <h2> tags for major section headings (e.g., "The Impact on Global Markets", "Expert Analysis")
            - Use <h3> tags for subsections when needed
            - Include <blockquote> tags for powerful statements, expert opinions, or key quotes
            - Each paragraph should be wrapped in <p> tags
            - Write with authority and include expert perspectives
            - Add dramatic impact with well-placed quotes
            
            ADVANCED REQUIREMENTS:
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            
            📈 SEO & E-E-A-T EXCELLENCE:
            - Demonstrate EXPERIENCE: Specific data, case studies, real examples
            - Prove EXPERTISE: Cite studies, research, expert quotes (with credentials)
            - Establish AUTHORITY: Industry analysis, comparative context, historical perspective
            - Build TRUST: Multiple credible sources, transparent methodology, fact-based
            - Natural keyword integration (LSI keywords, semantic relevance)
            - Schema-optimized structure for featured snippets
            
            🔍 FACT-CHECKING PROTOCOL:
            - Every statistic MUST have a source
            - Verify dates, names, locations, numbers
            - Cross-reference multiple sources for major claims
            - Include uncertainty language where appropriate ("according to...", "reports suggest...")
            - Cite at least 3-4 HIGH-CREDIBILITY sources
            
            🎨 VISUAL STORYTELLING:
            - Create CINEMATIC imagePrompt: Include camera angle, lens type, lighting setup
            - Specify mood, color palette, depth of field
            - Describe foreground, midground, background elements
            - Include time of day, weather, environmental details
            - Make it AWARD-WINNING PHOTOJOURNALISM quality
            
            📊 DATA JOURNALISM:
            - Include specific metrics and statistics
            - Provide context for numbers (YoY growth, comparisons)
            - Explain what data means for readers
            - Use data to support narrative, not replace it
            
            ✍️ WRITING EXCELLENCE:
            - Hook readers in first 2 sentences
            - Use active voice, strong verbs
            - Vary sentence length for rhythm
            - Include quotes from relevant experts
            - End with forward-looking perspective or call-to-action
            - Balance depth with readability (Flesch score 60-70)`
          },
          {
            role: 'user',
            content: `Write a professional news article about this trending topic: "${topic.topic}". 
            Region: ${topic.region || 'global'}
            Keywords: ${topic.keywords?.join(', ') || 'N/A'}
            Related queries: ${topic.related_queries?.join(', ') || 'N/A'}
            ${topic.trend_data ? `Additional context: ${JSON.stringify(topic.trend_data)}` : ''}
            ${existingContext}
            
            Framework: ${framework}
            
            Make it comprehensive, engaging, and SEO-optimized with proper source citations. 
            CRITICAL: Your article MUST present a unique angle not covered in existing articles. Find fresh insights and original perspectives.
            Return ONLY valid JSON, no additional text.`
          }
        ],
        temperature: 0.25, // Optimized for accuracy + creativity balance
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
    let imageUrl = '';
    let imageCredit = '';

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
        console.log('⚠️ News image fetch failed, using AI generation...');
        
        // Fallback to AI image generation
        const { data: aiImageData, error: aiError } = await supabaseClient.functions.invoke('generate-ai-image', {
          body: {
            title: articleData.title,
            category: articleData.category,
            excerpt: articleData.excerpt
          }
        });

        if (!aiError && aiImageData?.success) {
          imageUrl = aiImageData.imageUrl;
          imageCredit = 'AI Generated by Cardinal News';
          console.log('✓ Generated AI image successfully');
        } else {
          console.error('❌ Both image fetch and AI generation failed');
        }
      }
    } catch (imageError) {
      console.error('Image fetch failed:', imageError);
      
      // Try AI generation as last resort
      try {
        const { data: aiImageData, error: aiError } = await supabaseClient.functions.invoke('generate-ai-image', {
          body: {
            title: articleData.title,
            category: articleData.category,
            excerpt: articleData.excerpt
          }
        });

        if (!aiError && aiImageData?.success) {
          imageUrl = aiImageData.imageUrl;
          imageCredit = 'AI Generated by Cardinal News';
          console.log('✓ Generated AI image as fallback');
        }
      } catch (aiError) {
        console.error('AI image generation also failed:', aiError);
      }
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

    // Check for duplicate or similar titles
    const similarTitle = existingTitles.find(existing => 
      existing.toLowerCase().includes(articleData.title.toLowerCase().substring(0, 25)) ||
      articleData.title.toLowerCase().includes(existing.toLowerCase().substring(0, 25))
    );
    
    if (similarTitle) {
      console.log(`⚠️ Skipping duplicate/similar article: "${articleData.title}" (similar to: "${similarTitle}")`);
      throw new Error(`Article title too similar to existing: "${similarTitle}"`);
    }

    // Insert article into database - DRAFT STATUS (requires verification)
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
        status: 'draft', // Changed: Now requires verification before publishing
        read_time: readTime,
        image_url: imageUrl,
        image_credit: imageCredit,
        sources: articleData.sources || [],
        word_count: wordCount,
        featured_image: imageUrl,
      })
      .select()
      .single();

    console.log(`✓ Article created (draft): "${articleData.title}" (ID: ${article?.id})`);

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    // NEW: Automatic verification pipeline
    console.log(`🔍 Starting verification pipeline for article: ${article.id}`);
    try {
      const { data: verificationResult, error: verifyError } = await supabaseClient.functions.invoke(
        'verify-and-publish-article',
        {
          body: { articleId: article.id }
        }
      );

      if (verifyError) {
        console.error('Verification failed:', verifyError);
        console.log('⚠️ Article saved as draft - requires manual review');
      } else {
        console.log(`✓ Verification complete: ${verificationResult.decision}`);
        console.log(`✓ Final score: ${verificationResult.verification.score}/100`);
        
        if (verificationResult.decision === 'publish') {
          console.log(`✅ Article AUTO-PUBLISHED: "${articleData.title}"`);
        } else if (verificationResult.decision === 'reject') {
          console.log(`❌ Article REJECTED: ${verificationResult.verification.reasons.join(', ')}`);
        } else {
          console.log(`⚠️ Article NEEDS REVIEW - saved as draft`);
        }
      }
    } catch (verifyError) {
      console.error('Verification pipeline error:', verifyError);
      console.log('⚠️ Article saved as draft - verification failed');
    }

    console.log(`✓ Article generation complete: "${articleData.title}" (ID: ${article?.id})`);

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
