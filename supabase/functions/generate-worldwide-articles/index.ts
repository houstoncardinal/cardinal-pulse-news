import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("🌍 Starting worldwide Google Trends scan and article generation...");

    // Log job start
    const { data: job } = await supabaseClient
      .from('jobs')
      .insert({
        type: 'generate_worldwide_articles',
        status: 'running',
        started_at: new Date().toISOString(),
        payload: { message: 'Scanning worldwide trends and generating articles' }
      })
      .select()
      .single();

    // Define regions to scan
    const regions = ['US', 'GB', 'DE', 'JP', 'AU', 'CA', 'FR', 'IT', 'ES', 'BR', 'IN', 'ZA'];
    
    let totalTrends = 0;
    let totalArticles = 0;

    // Fetch trends from each region
    for (const region of regions) {
      try {
        console.log(`📍 Fetching trends from ${region}...`);
        
        const { data: trendsData, error: trendsError } = await supabaseClient.functions.invoke('fetch-trends', {
          body: { region, limit: 5 }
        });

        if (trendsError) {
          console.error(`❌ Error fetching trends from ${region}:`, trendsError);
          continue;
        }

        if (trendsData?.topicsAdded) {
          totalTrends += trendsData.topicsAdded;
          console.log(`✓ Added ${trendsData.topicsAdded} trends from ${region}`);
        }

        // Add small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (regionError) {
        console.error(`Error processing region ${region}:`, regionError);
      }
    }

    console.log(`✓ Scanned ${regions.length} regions, found ${totalTrends} new trends`);

    // Wait for trends to be inserted
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get all unprocessed trending topics (that don't have articles yet)
    const { data: unprocessedTopics, error: topicsError } = await supabaseClient
      .from('trending_topics')
      .select('id, topic, category')
      .is('article_generated', false)
      .order('trend_strength', { ascending: false })
      .limit(50);

    if (topicsError) {
      console.error('Error fetching unprocessed topics:', topicsError);
      throw topicsError;
    }

    if (!unprocessedTopics || unprocessedTopics.length === 0) {
      console.log('⚠️ No unprocessed topics found');
      
      if (job) {
        await supabaseClient
          .from('jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            result: { totalTrends, totalArticles: 0, message: 'No new topics to process' }
          })
          .eq('id', job.id);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No new topics to process',
          totalTrends,
          totalArticles: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📝 Generating articles for ${unprocessedTopics.length} topics...`);

    // Generate articles in batches
    const batchSize = 10;
    for (let i = 0; i < unprocessedTopics.length; i += batchSize) {
      const batch = unprocessedTopics.slice(i, i + batchSize);
      const topics = batch.map(t => t.topic);
      
      console.log(`Generating batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(unprocessedTopics.length / batchSize)}...`);
      
      try {
        const { data: articleData, error: articleError } = await supabaseClient.functions.invoke('generate-trending-articles', {
          body: { topics }
        });

        if (articleError) {
          console.error('Error generating articles for batch:', articleError);
          continue;
        }

        if (articleData?.results) {
          const successCount = articleData.results.filter((r: any) => r.success).length;
          totalArticles += successCount;
          console.log(`✓ Generated ${successCount} articles in this batch`);

          // Mark topics as processed
          for (const topic of batch) {
            await supabaseClient
              .from('trending_topics')
              .update({ article_generated: true })
              .eq('id', topic.id);
          }
        }

        // Delay between batches
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (batchError) {
        console.error('Error processing batch:', batchError);
      }
    }

    console.log(`✅ Completed! Generated ${totalArticles} articles from ${totalTrends} trends`);

    // Update job as completed
    if (job) {
      await supabaseClient
        .from('jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result: { 
            regionsScanned: regions.length,
            totalTrends,
            totalArticles,
            message: `Successfully generated ${totalArticles} articles from ${totalTrends} worldwide trends`
          }
        })
        .eq('id', job.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Generated ${totalArticles} articles from ${totalTrends} worldwide trends`,
        regionsScanned: regions.length,
        totalTrends,
        totalArticles
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-worldwide-articles:", error);
    
    // Update job as failed
    try {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      
      const { data: runningJob } = await supabaseClient
        .from('jobs')
        .select('id')
        .eq('type', 'generate_worldwide_articles')
        .eq('status', 'running')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (runningJob) {
        await supabaseClient
          .from('jobs')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date().toISOString()
          })
          .eq('id', runningJob.id);
      }
    } catch (jobError) {
      console.error('Error updating job status:', jobError);
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
