import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Updating all articles to author: Hunain Qureshi');

    // Update all articles where author is 'Cardinal AI' or null
    const { data: updated, error } = await supabase
      .from('articles')
      .update({ author: 'Hunain Qureshi' })
      .or('author.eq.Cardinal AI,author.is.null')
      .select('id, title, author');

    if (error) {
      console.error('Error updating articles:', error);
      throw error;
    }

    console.log(`Successfully updated ${updated?.length || 0} articles`);

    return new Response(
      JSON.stringify({
        success: true,
        updated: updated?.length || 0,
        articles: updated,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in update-author function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
