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
    console.log('🧹 Starting article cleanup...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Delete articles without images
    const { data: deletedArticles, error: deleteError } = await supabaseClient
      .from('articles')
      .delete()
      .is('image_url', null)
      .select('id, title');

    if (deleteError) {
      throw deleteError;
    }

    console.log(`✓ Deleted ${deletedArticles?.length || 0} articles without images`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Deleted ${deletedArticles?.length || 0} articles without images`,
        deleted: deletedArticles?.length || 0,
        articles: deletedArticles
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cleanup-articles:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
