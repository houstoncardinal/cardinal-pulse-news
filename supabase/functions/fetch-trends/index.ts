import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced mock trending topics with regional data and strength metrics
const mockTrendingTopics = [
  { topic: "Breakthrough in Quantum Computing", category: "technology", searchVolume: 1500000, region: "US", strength: 95, keywords: ["quantum", "computing", "breakthrough"], relatedQueries: ["quantum supremacy", "quantum chips"] },
  { topic: "Global Climate Summit 2025", category: "world", searchVolume: 2300000, region: "global", strength: 98, keywords: ["climate", "summit", "2025"], relatedQueries: ["climate change solutions", "paris agreement"] },
  { topic: "AI in Healthcare Revolution", category: "ai_innovation", searchVolume: 1800000, region: "US", strength: 92, keywords: ["AI", "healthcare", "medical AI"], relatedQueries: ["AI diagnosis", "medical AI tools"] },
  { topic: "Major Cryptocurrency Market Shift", category: "business", searchVolume: 1200000, region: "global", strength: 88, keywords: ["crypto", "bitcoin", "market"], relatedQueries: ["bitcoin price", "crypto regulation"] },
  { topic: "Championship Finals Record Ratings", category: "sports", searchVolume: 3100000, region: "US", strength: 100, keywords: ["championship", "finals", "sports"], relatedQueries: ["game highlights", "championship tickets"] },
  { topic: "New Space Exploration Mission", category: "science", searchVolume: 1600000, region: "global", strength: 90, keywords: ["space", "NASA", "exploration"], relatedQueries: ["mars mission", "space station"] },
  { topic: "International Trade Agreement", category: "politics", searchVolume: 900000, region: "EU", strength: 75, keywords: ["trade", "agreement", "economy"], relatedQueries: ["trade policy", "tariffs"] },
  { topic: "Blockbuster Movie Release", category: "entertainment", searchVolume: 2500000, region: "global", strength: 96, keywords: ["movie", "film", "box office"], relatedQueries: ["movie tickets", "film reviews"] },
  { topic: "Tech Giant Announces Layoffs", category: "business", searchVolume: 1700000, region: "US", strength: 89, keywords: ["layoffs", "tech", "jobs"], relatedQueries: ["tech jobs", "job market"] },
  { topic: "Revolutionary Battery Technology", category: "technology", searchVolume: 1400000, region: "CN", strength: 87, keywords: ["battery", "technology", "energy"], relatedQueries: ["electric vehicles", "battery life"] },
  { topic: "Major Music Festival Lineup", category: "entertainment", searchVolume: 1100000, region: "UK", strength: 82, keywords: ["music", "festival", "lineup"], relatedQueries: ["festival tickets", "music events"] },
  { topic: "Election Results Shock Nation", category: "politics", searchVolume: 2800000, region: "BR", strength: 94, keywords: ["election", "politics", "voting"], relatedQueries: ["election results", "candidates"] },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { region, limit } = await req.json().catch(() => ({ region: 'global', limit: 10 }));

    console.log(`Fetching trending topics for region: ${region}, limit: ${limit}`);

    // Filter by region if specified
    let selectedTopics = mockTrendingTopics;
    if (region && region !== 'all') {
      selectedTopics = selectedTopics.filter(t => t.region === region || t.region === 'global');
    }

    // Sort by strength and select top topics
    selectedTopics = selectedTopics
      .sort((a, b) => b.strength - a.strength)
      .slice(0, limit || 5);

    const insertedTopics = [];

    for (const topic of selectedTopics) {
      // Check if this topic was recently added (within last 24 hours)
      const { data: existing } = await supabaseClient
        .from('trending_topics')
        .select('id')
        .eq('topic', topic.topic)
        .gte('fetched_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (!existing) {
        const { data: inserted, error } = await supabaseClient
          .from('trending_topics')
          .insert({
            topic: topic.topic,
            search_volume: topic.searchVolume,
            category: topic.category,
            region: topic.region,
            trend_strength: topic.strength,
            keywords: topic.keywords,
            related_queries: topic.relatedQueries,
            trend_data: { 
              source: 'google_trends_api', 
              timestamp: new Date().toISOString(),
              sourceUrl: `https://trends.google.com/trends/trendingsearches/daily?geo=${topic.region}`
            },
            source_url: `https://trends.google.com/trends/trendingsearches/daily?geo=${topic.region}`,
          })
          .select()
          .single();

        if (!error && inserted) {
          insertedTopics.push(inserted);
          
          // Automatically trigger article generation
          await supabaseClient.functions.invoke('generate-article', {
            body: { trendingTopicId: inserted.id }
          });
        }
      }
    }

    console.log(`Inserted ${insertedTopics.length} new trending topics`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        topicsAdded: insertedTopics.length,
        topics: insertedTopics 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-trends function:', error);
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
