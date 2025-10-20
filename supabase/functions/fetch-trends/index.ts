import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock trending topics (In production, replace with Google Trends API)
const mockTrendingTopics = [
  { topic: "Breakthrough in Quantum Computing", category: "technology", searchVolume: 1500000 },
  { topic: "Global Climate Summit 2025", category: "world", searchVolume: 2300000 },
  { topic: "AI in Healthcare Revolution", category: "ai_innovation", searchVolume: 1800000 },
  { topic: "Major Cryptocurrency Market Shift", category: "business", searchVolume: 1200000 },
  { topic: "Championship Finals Record Ratings", category: "sports", searchVolume: 3100000 },
  { topic: "New Space Exploration Mission", category: "science", searchVolume: 1600000 },
  { topic: "International Trade Agreement", category: "politics", searchVolume: 900000 },
  { topic: "Blockbuster Movie Release", category: "entertainment", searchVolume: 2500000 },
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

    console.log('Fetching trending topics...');

    // In production, you would fetch from Google Trends API here
    // For now, we'll use mock data and randomly select topics
    const selectedTopics = mockTrendingTopics
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

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
            trend_data: { source: 'mock_trends', timestamp: new Date().toISOString() },
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
