import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { type = 'full' } = await req.json().catch(() => ({ type: 'full' }))

    console.log(`Running automation: ${type}`)

    // Create job log for this run
    const { data: job } = await supabaseClient
      .from('jobs')
      .insert({
        type: type === 'fetch' ? 'fetch_trends' : 'generate_article',
        status: 'running',
        started_at: new Date().toISOString(),
        payload: { automation_type: type }
      })
      .select()
      .single()

    try {
      // Fetch settings
      const { data: settings } = await supabaseClient
        .from('settings')
        .select('*')

      const settingsMap = settings?.reduce((acc, s) => {
        acc[s.key] = s.value
        return acc
      }, {} as Record<string, any>) || {}

      const region = settingsMap.default_region || 'global'
      const maxArticles = settingsMap.max_articles_per_run || 5
      const autopublish = settingsMap.autopublish_enabled !== false

      if (type === 'fetch' || type === 'full') {
        console.log('Fetching trends...')
        
        // Call fetch-trends function
        const { error: fetchError } = await supabaseClient.functions.invoke('fetch-trends', {
          body: { region, limit: 20 }
        })

        if (fetchError) throw fetchError
      }

      if (type === 'generate' || type === 'full') {
        console.log('Generating articles...')
        
        // Get unprocessed trends
        const { data: trends } = await supabaseClient
          .from('trending_topics')
          .select('*')
          .eq('processed', false)
          .order('trend_strength', { ascending: false })
          .limit(maxArticles)

        if (trends && trends.length > 0) {
          for (const trend of trends) {
            console.log(`Generating article for: ${trend.topic}`)
            
            // Call generate-article function
            await supabaseClient.functions.invoke('generate-article', {
              body: { trendingTopicId: trend.id }
            })
          }
        }
      }

      // Update job as completed
      await supabaseClient
        .from('jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id)

      return new Response(
        JSON.stringify({ 
          success: true,
          message: `Automation run completed: ${type}`,
          jobId: job.id
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )

    } catch (error) {
      // Update job as failed
      await supabaseClient
        .from('jobs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id)

      throw error
    }

  } catch (error) {
    console.error('Error in run-automation function:', error)
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
