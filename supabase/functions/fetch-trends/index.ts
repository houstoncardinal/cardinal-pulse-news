import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to fetch real Google Trends data using SerpAPI
async function fetchGoogleTrends(region: string = 'US') {
  try {
    const serpApiKey = Deno.env.get('SERPAPI_KEY');
    if (!serpApiKey) {
      console.error('⚠️ SERPAPI_KEY not configured - using fallback data');
      console.error('Configure SERPAPI_KEY to fetch real Google Trends data');
      return getFallbackTrends(region);
    }
    
    console.log('✓ SERPAPI_KEY found, fetching real trends...');

    const geoMap: { [key: string]: string } = {
      'global': 'US',
      'us': 'US',
      'uk': 'GB',
      'europe': 'DE',
      'asia': 'JP',
      'americas': 'US',
      'africa': 'ZA',
      'oceania': 'AU',
      'all': 'US'
    };
    
    const geoCode = geoMap[region.toLowerCase()] || 'US';
    
    console.log(`Fetching trends from SerpAPI for region: ${geoCode}`);
    console.log(`API URL: https://serpapi.com/search.json?engine=google_trends_trending_now&geo=${geoCode}`);
    
    // Use SerpAPI Google Trends Trending Now endpoint
    const apiUrl = `https://serpapi.com/search.json?engine=google_trends_trending_now&geo=${geoCode}&hl=en&api_key=${serpApiKey}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ SerpAPI returned status ${response.status}`);
      console.error(`Error response: ${errorText}`);
      return getFallbackTrends(region);
    }
    
    console.log('✓ SerpAPI request successful');
    
    const data = await response.json();
    console.log(`✓ Received ${data.trending_searches?.length || 0} trends from SerpAPI`);
    
    if (data.error) {
      console.error(`❌ SerpAPI error: ${data.error}`);
      return getFallbackTrends(region);
    }
    
    if (!data.trending_searches || data.trending_searches.length === 0) {
      console.log('⚠️ No trending searches found in response');
      console.log('Response structure:', JSON.stringify(data).substring(0, 200));
      return getFallbackTrends(region);
    }
    
    const trends = data.trending_searches.slice(0, 30).map((item: any, index: number) => {
      try {
        const query = item.query;
        const searchVolume = item.search_volume || 10000;
        const categories = item.categories || [];
        
        // Categorize based on category IDs from SerpAPI
        let category = 'world';
        if (categories.length > 0) {
          const catId = categories[0].id;
          const catName = categories[0].name?.toLowerCase() || '';
          
          if (catId === 23 || catName.includes('tech')) category = 'technology';
          else if (catId === 6 || catName.includes('business') || catName.includes('finance')) category = 'business';
          else if (catId === 17 || catName.includes('sport')) category = 'sports';
          else if (catId === 25 || catName.includes('science')) category = 'science';
          else if (catId === 3 || catName.includes('entertainment')) category = 'entertainment';
          else if (catId === 14 || catId === 10 || catName.includes('polit') || catName.includes('law') || catName.includes('government')) category = 'politics';
        }
        
        // Extract keywords from query
        const words = query.toLowerCase().split(/\s+/).filter((w: string) => 
          w.length > 2 && !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'has'].includes(w)
        );
        const keywords = [...new Set(words)].slice(0, 5);
        
        const trendStrength = Math.min(100, Math.max(50, Math.floor(searchVolume / 10000)));
        
        console.log(`✓ Parsed trend: "${query}" (volume: ${searchVolume}, strength: ${trendStrength}, category: ${category})`);
        
        return {
          topic: query,
          category,
          trend_strength: trendStrength,
          region: geoCode,
          search_volume: searchVolume,
          keywords,
          related_queries: item.trend_breakdown || [query],
          source_url: 'https://trends.google.com',
          fetched_at: new Date().toISOString(),
          trend_data: {
            fetched_from: 'serpapi',
            timestamp: new Date().toISOString(),
            categories: categories
          }
        };
      } catch (parseError) {
        console.error(`Error parsing trend ${index}:`, parseError);
        return null;
      }
    }).filter((t: any) => t !== null);
    
    console.log(`Successfully parsed ${trends.length} trends`);
    return trends.length > 0 ? trends : getFallbackTrends(region);
    
  } catch (error) {
    console.error('Error fetching Google Trends:', error);
    return getFallbackTrends(region);
  }
}

// Fallback data in case API fails
function getFallbackTrends(region: string) {
  return [
    {
      topic: "Global Technology Summit Announces Major AI Breakthroughs",
      category: "technology",
      trend_strength: 95,
      region: region.toLowerCase(),
      search_volume: 125000,
      keywords: ["artificial intelligence", "technology", "innovation"],
      related_queries: ["AI technology news", "tech summit 2024"],
      source_url: "https://trends.google.com"
    },
    {
      topic: "International Space Station Mission Update",
      category: "science",
      trend_strength: 88,
      region: region.toLowerCase(),
      search_volume: 98000,
      keywords: ["space", "science", "research"],
      related_queries: ["space station news", "space mission"],
      source_url: "https://trends.google.com"
    },
    {
      topic: "Global Economic Summit Concludes with New Agreements",
      category: "business",
      trend_strength: 92,
      region: region.toLowerCase(),
      search_volume: 150000,
      keywords: ["economy", "business", "summit"],
      related_queries: ["economic news", "business summit"],
      source_url: "https://trends.google.com"
    },
    {
      topic: "Climate Action Initiative Launched Worldwide",
      category: "world",
      trend_strength: 85,
      region: region.toLowerCase(),
      search_volume: 87000,
      keywords: ["climate", "environment", "sustainability"],
      related_queries: ["climate action", "environmental policy"],
      source_url: "https://trends.google.com"
    },
    {
      topic: "Major Sports Championship Finals Draw Record Viewers",
      category: "sports",
      trend_strength: 90,
      region: region.toLowerCase(),
      search_volume: 112000,
      keywords: ["sports", "championship", "finals"],
      related_queries: ["sports news", "championship results"],
      source_url: "https://trends.google.com"
    }
  ];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { region = 'global', limit = 10 } = await req.json().catch(() => ({ region: 'global', limit: 10 }))
    
    // Log job start
    const { data: job } = await supabaseClient
      .from('jobs')
      .insert({
        type: 'fetch_trends',
        status: 'running',
        started_at: new Date().toISOString(),
        payload: { region, limit }
      })
      .select()
      .single()

    console.log(`Fetching trends for region: ${region}, limit: ${limit}`)

    // Clean up old trends (older than 6 hours) and ALL existing placeholder/fallback data
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    console.log(`🧹 Cleaning up trends older than ${sixHoursAgo} and all placeholder data...`)
    
    // First, delete all placeholder trends regardless of age
    const { error: cleanupError, count } = await supabaseClient
      .from('trending_topics')
      .delete()
      .or(`trend_data->>fetched_from.eq.google_trends_rss,topic.like.*Global Technology Summit*,topic.like.*International Space Station*,topic.like.*Global Economic Summit*,topic.like.*Climate Action Initiative*,topic.like.*Major Sports Championship*`)
    
    if (!cleanupError) {
      console.log(`✓ Cleaned up ${count || 0} placeholder/old trends`)
    }
    
    // Also delete old trends
    await supabaseClient
      .from('trending_topics')
      .delete()
      .lt('fetched_at', sixHoursAgo)

    // Fetch real Google Trends data
    const trendingTopics = await fetchGoogleTrends(region)
    
    // Limit results
    const limitedTopics = trendingTopics.slice(0, limit)

    // Insert new trending topics and trigger article generation
    let addedTopics = 0
    const insertedTopics = []
    
    for (const topic of limitedTopics) {
      // Check if this exact topic exists in the last 3 hours (very short window for freshness)
      const { data: existing } = await supabaseClient
        .from('trending_topics')
        .select('id')
        .eq('topic', topic.topic)
        .gte('fetched_at', new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString())
        .maybeSingle()

      if (!existing) {
        const { data: inserted, error } = await supabaseClient
          .from('trending_topics')
          .insert({
            topic: topic.topic,
            category: topic.category,
            trend_strength: topic.trend_strength,
            region: topic.region,
            search_volume: topic.search_volume,
            keywords: topic.keywords,
            related_queries: topic.related_queries,
            source_url: topic.source_url,
            trend_data: {
              fetched_from: 'google_trends_rss',
              timestamp: new Date().toISOString()
            }
          })
          .select()
          .single()

        if (!error && inserted) {
          addedTopics++
          insertedTopics.push(inserted)
          
          console.log(`Triggering article generation for: ${topic.topic}`)
          
          // Trigger article generation
          await supabaseClient.functions.invoke('generate-article', {
            body: { trendingTopicId: inserted.id }
          })
        } else if (error) {
          console.error(`Error inserting topic "${topic.topic}":`, error)
        }
      } else {
        console.log(`Topic "${topic.topic}" already exists, skipping`)
      }
    }

    console.log(`Successfully added ${addedTopics} new trending topics`)
    
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
      JSON.stringify({ 
        success: true,
        message: `Added ${addedTopics} new trending topics`,
        topicsAdded: addedTopics,
        topics: insertedTopics
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in fetch-trends function:', error)
    
    // Update job as failed if it exists
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      
      // Find the most recent running job
      const { data: runningJob } = await supabaseClient
        .from('jobs')
        .select('id')
        .eq('type', 'fetch_trends')
        .eq('status', 'running')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (runningJob) {
        await supabaseClient
          .from('jobs')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date().toISOString()
          })
          .eq('id', runningJob.id)
      }
    } catch (jobError) {
      console.error('Error updating job status:', jobError)
    }
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
