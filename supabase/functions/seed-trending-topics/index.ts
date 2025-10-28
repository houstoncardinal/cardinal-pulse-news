import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Diverse trending topics across all categories
const DIVERSE_TOPICS = [
  // World News
  { topic: "Global Climate Summit Reaches Historic Agreement", category: "world", strength: 95, volume: 250000 },
  { topic: "International Trade Deals Reshape Global Economy", category: "world", strength: 88, volume: 180000 },
  { topic: "UN Security Council Addresses Regional Conflicts", category: "world", strength: 92, volume: 220000 },
  
  // Business
  { topic: "Tech Giants Announce Major Merger Plans", category: "business", strength: 94, volume: 280000 },
  { topic: "Stock Markets Hit Record Highs Across Asia", category: "business", strength: 87, volume: 190000 },
  { topic: "Cryptocurrency Regulations Transform Financial Sector", category: "business", strength: 91, volume: 240000 },
  { topic: "Startup Unicorns Drive Innovation Economy", category: "business", strength: 85, volume: 170000 },
  
  // Technology
  { topic: "Revolutionary AI Breakthrough Changes Computing", category: "technology", strength: 98, volume: 350000 },
  { topic: "Quantum Computing Achieves Major Milestone", category: "technology", strength: 93, volume: 260000 },
  { topic: "5G Networks Transform Mobile Connectivity", category: "technology", strength: 89, volume: 210000 },
  { topic: "Cybersecurity Threats Prompt Industry Response", category: "technology", strength: 90, volume: 230000 },
  
  // Sports
  { topic: "Championship Finals Break Viewership Records", category: "sports", strength: 96, volume: 320000 },
  { topic: "Olympic Athletes Set New World Records", category: "sports", strength: 94, volume: 290000 },
  { topic: "Major League Playoffs Enter Critical Stage", category: "sports", strength: 88, volume: 200000 },
  { topic: "Rising Sports Stars Capture Global Attention", category: "sports", strength: 86, volume: 185000 },
  
  // Entertainment
  { topic: "Blockbuster Film Dominates Global Box Office", category: "entertainment", strength: 92, volume: 270000 },
  { topic: "Music Awards Celebrate Industry Excellence", category: "entertainment", strength: 89, volume: 215000 },
  { topic: "Streaming Platform Announces Original Series", category: "entertainment", strength: 87, volume: 195000 },
  { topic: "Celebrity News Trends Across Social Media", category: "entertainment", strength: 84, volume: 175000 },
  
  // Science
  { topic: "Space Mission Discovers Potential Habitable Planet", category: "science", strength: 97, volume: 340000 },
  { topic: "Medical Breakthrough Offers Hope for Disease Treatment", category: "science", strength: 95, volume: 310000 },
  { topic: "Climate Research Reveals Critical Environmental Data", category: "science", strength: 91, volume: 245000 },
  { topic: "Archaeological Discovery Rewrites Ancient History", category: "science", strength: 88, volume: 205000 },
  
  // Politics
  { topic: "Electoral Results Reshape National Landscape", category: "politics", strength: 93, volume: 275000 },
  { topic: "Policy Reform Passes Through Legislature", category: "politics", strength: 89, volume: 220000 },
  { topic: "International Diplomacy Yields New Agreements", category: "politics", strength: 90, volume: 235000 },
  { topic: "Political Debates Highlight Key Policy Issues", category: "politics", strength: 86, volume: 190000 },
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

    const { forceRefresh = false, articlesPerTopic = 1 } = await req.json().catch(() => ({}));
    
    console.log('🌱 Seeding diverse trending topics...');
    
    // Check if we need to seed
    const { count: existingCount } = await supabaseClient
      .from('trending_topics')
      .select('*', { count: 'exact', head: true });
    
    if (existingCount && existingCount > 5 && !forceRefresh) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: `Already have ${existingCount} trending topics. Use forceRefresh=true to reseed.`,
          topicsCount: existingCount
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clear old trends if forcing refresh
    if (forceRefresh) {
      console.log('🧹 Clearing old trends...');
      await supabaseClient.from('trending_topics').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    let inserted = 0;
    const generatedArticles = [];

    // Shuffle topics for variety
    const shuffledTopics = DIVERSE_TOPICS.sort(() => Math.random() - 0.5);
    
    for (const topic of shuffledTopics) {
      // Check if topic already exists
      const { data: existing } = await supabaseClient
        .from('trending_topics')
        .select('id')
        .eq('topic', topic.topic)
        .maybeSingle();

      if (!existing) {
        // Generate diverse keywords
        const words = topic.topic.toLowerCase()
          .split(/\s+/)
          .filter(w => w.length > 3 && !['this', 'that', 'with', 'from', 'have', 'been'].includes(w));
        const keywords = [...new Set(words)].slice(0, 5);

        const { data: newTopic, error } = await supabaseClient
          .from('trending_topics')
          .insert({
            topic: topic.topic,
            category: topic.category,
            trend_strength: topic.strength,
            region: 'global',
            search_volume: topic.volume,
            keywords,
            related_queries: [topic.topic],
            source_url: 'https://trends.google.com',
            processed: false,
            trend_data: {
              fetched_from: 'seed',
              timestamp: new Date().toISOString(),
              diversity_seed: true
            }
          })
          .select()
          .single();

        if (!error && newTopic) {
          inserted++;
          console.log(`✓ Inserted: ${topic.topic}`);

          // Generate articles for this topic
          for (let i = 0; i < articlesPerTopic; i++) {
            try {
              console.log(`📝 Generating article ${i + 1}/${articlesPerTopic} for: ${topic.topic}`);
              
              const { data: articleData, error: articleError } = await supabaseClient.functions.invoke('generate-article', {
                body: { trendingTopicId: newTopic.id }
              });

              if (!articleError && articleData) {
                generatedArticles.push({
                  topic: topic.topic,
                  category: topic.category,
                  articleId: articleData.article?.id
                });
                console.log(`✓ Article generated for: ${topic.topic}`);
              } else {
                console.error(`Error generating article for ${topic.topic}:`, articleError);
              }

              // Add delay between generations to avoid overwhelming the system
              await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (genError) {
              console.error(`Failed to generate article for ${topic.topic}:`, genError);
            }
          }
        } else {
          console.error(`Error inserting ${topic.topic}:`, error);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Seeded ${inserted} diverse trending topics`,
        topicsInserted: inserted,
        articlesGenerated: generatedArticles.length,
        categoriesRepresented: [...new Set(DIVERSE_TOPICS.map(t => t.category))],
        generatedArticles
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error seeding trending topics:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
