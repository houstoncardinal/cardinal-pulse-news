import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to fetch real Google Trends data using Google Trends RSS
async function fetchGoogleTrends(region: string = 'US') {
  try {
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
    
    // Try multiple RSS feeds for better coverage
    const feeds = [
      `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geoCode}`,
      `https://trends.google.com/trends/trendingsearches/realtime/rss?geo=${geoCode}`
    ];
    
    let allTrends: any[] = [];
    
    for (const rssUrl of feeds) {
      try {
        console.log(`Fetching trends from: ${rssUrl}`);
        
        const response = await fetch(rssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (!response.ok) continue;
        
        const xmlText = await response.text();
        console.log(`Received RSS response, length: ${xmlText.length}`);
        
        // Parse XML manually (simplified parsing)
        const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
        console.log(`Found ${items.length} items in RSS feed`);
        
        const trends = items.slice(0, 30).map((item, index) => {
          const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
          const trafficMatch = item.match(/<ht:approx_traffic><!\[CDATA\[(.*?)\]\]><\/ht:approx_traffic>/);
          const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);
          const linkMatch = item.match(/<link>(.*?)<\/link>/);
          const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
          
          // Get the actual title, clean it
          let title = titleMatch ? titleMatch[1].trim() : `Trend ${index + 1}`;
          
          // Remove any extra markup or encoding
          title = title.replace(/&amp;/g, '&')
                       .replace(/&lt;/g, '<')
                       .replace(/&gt;/g, '>')
                       .replace(/&quot;/g, '"')
                       .replace(/&#39;/g, "'");
          
          const traffic = trafficMatch ? trafficMatch[1] : '10,000+';
          const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').substring(0, 200) : title;
          const link = linkMatch ? linkMatch[1] : 'https://trends.google.com';
          const pubDate = pubDateMatch ? new Date(pubDateMatch[1]) : new Date();
          
          // Parse traffic number - handle formats like "100K+", "2M+", etc.
          let trafficNum = 10000;
          if (traffic.includes('M+') || traffic.includes('m+')) {
            trafficNum = parseFloat(traffic) * 1000000;
          } else if (traffic.includes('K+') || traffic.includes('k+')) {
            trafficNum = parseFloat(traffic) * 1000;
          } else {
            trafficNum = parseInt(traffic.replace(/[,+]/g, '')) || 10000;
          }
          
          console.log(`Parsed trend: ${title} (${traffic})`);
          
          // Categorize based on keywords in title and description
          const text = (title + ' ' + description).toLowerCase();
          let category = 'world';
          if (text.match(/tech|ai|digital|cyber|software|app|internet|computer/)) category = 'technology';
          else if (text.match(/business|market|stock|trade|economy|finance|company/)) category = 'business';
          else if (text.match(/sport|game|championship|league|team|player|football|basketball|nba|nfl|soccer|lakers|nfl|vs/)) category = 'sports';
          else if (text.match(/science|research|study|discovery|space|health|medical/)) category = 'science';
          else if (text.match(/entertainment|movie|music|celebrity|show|film|actor/)) category = 'entertainment';
          else if (text.match(/politics|election|government|vote|policy|law/)) category = 'politics';
          
          // Extract keywords from title
          const words = title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2 && !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'has'].includes(w));
          const keywords = [...new Set(words)].slice(0, 5);
          
          return {
            topic: title,
            category,
            trend_strength: Math.min(100, Math.max(50, Math.floor(trafficNum / 10000))),
            region: geoCode,
            search_volume: trafficNum,
            keywords,
            related_queries: [title],
            source_url: link,
            fetched_at: pubDate.toISOString(),
            trend_data: {
              fetched_from: 'google_trends_rss',
              timestamp: new Date().toISOString(),
              raw_traffic: traffic
            }
          };
        });
        
        allTrends = allTrends.concat(trends);
      } catch (feedError) {
        console.error(`Error fetching from ${rssUrl}:`, feedError);
        continue;
      }
    }
    
    // Remove duplicates and sort by trend strength
    const uniqueTrends = Array.from(
      new Map(allTrends.map(t => [t.topic, t])).values()
    ).sort((a, b) => b.trend_strength - a.trend_strength);
    
    console.log(`Parsed ${uniqueTrends.length} unique trends`);
    return uniqueTrends.length > 0 ? uniqueTrends : getFallbackTrends(region);
    
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

    // Clean up old trends (older than 48 hours) to keep data fresh
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    console.log(`Cleaning up trends older than ${twoDaysAgo}`)
    
    await supabaseClient
      .from('trending_topics')
      .delete()
      .lt('fetched_at', twoDaysAgo)

    // Fetch real Google Trends data
    const trendingTopics = await fetchGoogleTrends(region)
    
    // Limit results
    const limitedTopics = trendingTopics.slice(0, limit)

    // Insert new trending topics and trigger article generation
    let addedTopics = 0
    const insertedTopics = []
    
    for (const topic of limitedTopics) {
      // Check if this exact topic exists in the last 6 hours (shorter window for freshness)
      const { data: existing } = await supabaseClient
        .from('trending_topics')
        .select('id')
        .eq('topic', topic.topic)
        .gte('fetched_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
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
