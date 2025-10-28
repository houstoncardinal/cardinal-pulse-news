import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 10 } = await req.json();
    
    if (!query || query.trim().length === 0) {
      return new Response(JSON.stringify({ results: [], suggestions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Search articles using multiple strategies
    const searchTerms = query.toLowerCase().split(' ').filter((term: string) => term.length > 2);
    
    // Full-text search across title, excerpt, and content
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, slug, excerpt, category, published_at, image_url')
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%,category.ilike.%${query}%`)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Search error:', error);
      throw error;
    }

    // Generate AI-powered search suggestions and query completion
    let suggestions: string[] = [];
    let completions: string[] = [];
    
    if (LOVABLE_API_KEY && query.length >= 3) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                content: `You are a news search assistant. Given a partial search query, generate:
1. 3-5 related search suggestions that might interest the user
2. 2-3 query completions that finish the user's sentence naturally

Return ONLY a JSON object with this structure:
{
  "suggestions": ["suggestion 1", "suggestion 2", ...],
  "completions": ["completion 1", "completion 2", ...]
}

Focus on news topics, current events, and common news categories like: world news, business, technology, sports, entertainment, politics, weather, etc.`
              },
              {
                role: "user",
                content: `Search query: "${query}"\n\nProvide relevant suggestions and completions.`
              }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices[0].message.content;
          try {
            const parsed = JSON.parse(content);
            suggestions = parsed.suggestions || [];
            completions = parsed.completions || [];
          } catch {
            // If parsing fails, extract suggestions manually
            suggestions = [];
          }
        }
      } catch (aiError) {
        console.error('AI suggestion error:', aiError);
        // Continue without AI suggestions
      }
    }

    // Calculate relevance scores
    const scoredResults = articles?.map((article: any) => {
      let score = 0;
      const lowerTitle = article.title.toLowerCase();
      const lowerExcerpt = article.excerpt?.toLowerCase() || '';
      const lowerQuery = query.toLowerCase();

      // Exact match in title = highest score
      if (lowerTitle === lowerQuery) score += 100;
      // Title starts with query
      else if (lowerTitle.startsWith(lowerQuery)) score += 50;
      // Title contains query
      else if (lowerTitle.includes(lowerQuery)) score += 25;
      
      // Excerpt contains query
      if (lowerExcerpt.includes(lowerQuery)) score += 10;
      
      // Each search term found
      searchTerms.forEach((term: string) => {
        if (lowerTitle.includes(term)) score += 5;
        if (lowerExcerpt.includes(term)) score += 2;
      });

      // Recency bonus (newer articles ranked higher)
      const daysSincePublished = Math.floor(
        (Date.now() - new Date(article.published_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      score += Math.max(0, 20 - daysSincePublished);

      return { ...article, relevanceScore: score };
    }) || [];

    // Sort by relevance score
    scoredResults.sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);

    return new Response(
      JSON.stringify({ 
        results: scoredResults,
        suggestions,
        completions,
        total: scoredResults.length 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Smart search error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        results: [],
        suggestions: [],
        completions: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
