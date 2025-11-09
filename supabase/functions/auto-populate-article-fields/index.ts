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
    const { title, content } = await req.json();

    if (!title || !content) {
      throw new Error('Title and content are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Auto-populating article fields for:', title.substring(0, 50));

    const prompt = `Analyze this news article and generate comprehensive metadata for it.

TITLE: ${title}

CONTENT: ${content.substring(0, 3000)}

Generate the following fields with professional journalism standards:

1. URL Slug: SEO-friendly, lowercase, hyphenated (max 80 chars)
2. Category: Choose ONE from [world, business, technology, entertainment, sports, science, lifestyle, politics, ai_innovation]
3. Excerpt: Compelling 2-3 sentence summary (120-160 chars)
4. Hashtags: 5-8 relevant trending hashtags (no # symbol)
5. Meta Title: SEO optimized (50-60 chars)
6. Meta Description: Search engine snippet (150-160 chars)
7. Meta Keywords: 8-12 relevant keywords (comma separated)
8. News Keywords: 5-7 news-specific keywords (comma separated)
9. Open Graph Title: Social media optimized (max 60 chars)
10. Open Graph Description: Social sharing snippet (max 200 chars)

Be precise, professional, and optimize for news discovery and SEO.`;

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
            content: 'You are an expert SEO and metadata specialist for a professional news organization. Generate precise, optimized metadata that follows journalism best practices and maximizes discoverability.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_article_metadata',
              description: 'Generate comprehensive article metadata',
              parameters: {
                type: 'object',
                properties: {
                  slug: { 
                    type: 'string',
                    description: 'URL-friendly slug (lowercase, hyphenated, max 80 chars)'
                  },
                  category: { 
                    type: 'string',
                    enum: ['world', 'business', 'technology', 'entertainment', 'sports', 'science', 'lifestyle', 'politics', 'ai_innovation']
                  },
                  excerpt: { 
                    type: 'string',
                    description: 'Compelling summary (120-160 chars)'
                  },
                  hashtags: { 
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of 5-8 hashtags without # symbol'
                  },
                  metaTitle: { 
                    type: 'string',
                    description: 'SEO title (50-60 chars)'
                  },
                  metaDescription: { 
                    type: 'string',
                    description: 'SEO description (150-160 chars)'
                  },
                  metaKeywords: { 
                    type: 'string',
                    description: 'Comma-separated keywords'
                  },
                  newsKeywords: { 
                    type: 'string',
                    description: 'Comma-separated news keywords'
                  },
                  ogTitle: { 
                    type: 'string',
                    description: 'Open Graph title (max 60 chars)'
                  },
                  ogDescription: { 
                    type: 'string',
                    description: 'Open Graph description (max 200 chars)'
                  }
                },
                required: ['slug', 'category', 'excerpt', 'hashtags', 'metaTitle', 'metaDescription', 'metaKeywords', 'newsKeywords', 'ogTitle', 'ogDescription'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_article_metadata' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway returned ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI Response received');

    // Extract tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function?.name !== 'generate_article_metadata') {
      throw new Error('AI did not return expected metadata structure');
    }

    const metadata = JSON.parse(toolCall.function.arguments);

    // Generate Google News optimized schema markup
    const schemaMarkup = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": title,
      "description": metadata.excerpt,
      "articleBody": content.substring(0, 500) + "...",
      "datePublished": new Date().toISOString(),
      "dateModified": new Date().toISOString(),
      "author": {
        "@type": "Organization",
        "name": "Cardinal News",
        "url": "https://cardinalnews.app"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Cardinal News",
        "url": "https://cardinalnews.app",
        "logo": {
          "@type": "ImageObject",
          "url": "https://cardinalnews.app/logo.png",
          "width": 600,
          "height": 60
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://cardinalnews.app/article/${metadata.slug}`
      },
      "articleSection": metadata.category,
      "keywords": metadata.newsKeywords,
      "inLanguage": "en-US",
      "isAccessibleForFree": "True",
      "genre": "News"
    };

    const result = {
      slug: metadata.slug,
      category: metadata.category,
      excerpt: metadata.excerpt,
      tags: metadata.hashtags,
      metaTitle: metadata.metaTitle,
      metaDescription: metadata.metaDescription,
      metaKeywords: metadata.metaKeywords,
      newsKeywords: metadata.newsKeywords,
      ogTitle: metadata.ogTitle,
      ogDescription: metadata.ogDescription,
      schemaMarkup: JSON.stringify(schemaMarkup, null, 2)
    };

    console.log('Successfully generated metadata for:', title.substring(0, 50));

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in auto-populate-article-fields:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
