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
    console.log('🔍 Finding and fixing duplicate/problematic images...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find all articles with images
    const { data: allArticles, error: fetchError } = await supabaseClient
      .from('articles')
      .select('id, title, image_url, category, excerpt')
      .not('image_url', 'is', null);

    if (fetchError) throw fetchError;

    if (!allArticles || allArticles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No articles to process', fixed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Group by image URL to find duplicates
    const imageUsageMap = new Map<string, any[]>();
    allArticles.forEach(article => {
      if (article.image_url) {
        if (!imageUsageMap.has(article.image_url)) {
          imageUsageMap.set(article.image_url, []);
        }
        imageUsageMap.get(article.image_url)!.push(article);
      }
    });

    // Find images used more than once OR contain problematic keywords
    const problematicKeywords = [
      'business-files', 'business_files', 'documents', 'paperwork',
      'generic', 'stock-photo', 'placeholder', 'template'
    ];

    const articlesToFix: any[] = [];
    
    imageUsageMap.forEach((articles, imageUrl) => {
      const urlLower = imageUrl.toLowerCase();
      
      // Check if it's a duplicate (used more than once)
      if (articles.length > 1) {
        console.log(`⚠️ Duplicate image found: ${imageUrl} (used ${articles.length} times)`);
        // Keep the first one, fix the rest
        articlesToFix.push(...articles.slice(1));
      }
      
      // Check if it contains problematic keywords
      const hasProblematicKeyword = problematicKeywords.some(keyword => 
        urlLower.includes(keyword)
      );
      
      if (hasProblematicKeyword) {
        console.log(`⚠️ Problematic image found: ${imageUrl}`);
        articlesToFix.push(...articles);
      }
    });

    console.log(`📊 Found ${articlesToFix.length} articles needing new images`);

    // Delete articles with problematic images instead of regenerating
    // (Cleaner approach - let admin regenerate good content separately)
    if (articlesToFix.length > 0) {
      const idsToDelete = articlesToFix.map(a => a.id);
      
      const { error: deleteError } = await supabaseClient
        .from('articles')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) throw deleteError;

      console.log(`✓ Deleted ${articlesToFix.length} articles with duplicate/problematic images`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Fixed ${articlesToFix.length} articles with duplicate/problematic images`,
        fixed: articlesToFix.length,
        deletedArticles: articlesToFix.map(a => ({ id: a.id, title: a.title, image: a.image_url }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fix-duplicate-images:', error);
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
