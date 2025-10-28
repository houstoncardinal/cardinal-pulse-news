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
    console.log('Running automation scheduler...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const tasks = [];

    // 1. Fetch trending topics every hour
    console.log('Task 1: Fetching trending topics...');
    const trendsTask = supabase.functions.invoke('fetch-trends', {
      body: { region: 'US' }
    });
    tasks.push(trendsTask);

    // 2. Fetch global weather every 10 minutes
    console.log('Task 2: Fetching global weather...');
    const weatherTask = supabase.functions.invoke('fetch-global-weather', {
      body: {}
    });
    tasks.push(weatherTask);

    // 3. Generate trending articles every 2 hours
    console.log('Task 3: Checking for trending topics to generate articles...');
    const { data: topics } = await supabase
      .from('trending_topics')
      .select('*')
      .order('traffic', { ascending: false })
      .limit(3);

    if (topics && topics.length > 0) {
      for (const topic of topics) {
        // Check if article already exists
        const { data: existing } = await supabase
          .from('articles')
          .select('id')
          .eq('trending_topic_id', topic.id)
          .maybeSingle();

        if (!existing) {
          console.log(`Generating article for topic: ${topic.topic}`);
          const articleTask = supabase.functions.invoke('generate-article', {
            body: { trendingTopicId: topic.id }
          });
          tasks.push(articleTask);
        }
      }
    }

    // 4. Clean up old jobs (older than 7 days)
    console.log('Task 4: Cleaning up old jobs...');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    await supabase
      .from('jobs')
      .delete()
      .lt('created_at', sevenDaysAgo.toISOString());

    // 5. Update article view counts and trending status
    console.log('Task 5: Updating article metrics...');
    const { data: recentArticles } = await supabase
      .from('articles')
      .select('id, views_count, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20);

    // Wait for all tasks
    await Promise.all(tasks);

    console.log('Automation scheduler completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Automation tasks completed',
        tasksRun: tasks.length,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in automation scheduler:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
