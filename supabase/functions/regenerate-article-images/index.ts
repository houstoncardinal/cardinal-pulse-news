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
    const { articleIds } = await req.json();
    
    console.log(`🔄 Regenerating images for ${articleIds?.length || 'all'} articles`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get articles without images or with specified IDs
    let query = supabaseClient
      .from('articles')
      .select('id, title, category, excerpt');

    if (articleIds && articleIds.length > 0) {
      query = query.in('id', articleIds);
    } else {
      query = query.is('image_url', null);
    }

    const { data: articles, error } = await query.limit(50);

    if (error) {
      throw error;
    }

    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No articles need image regeneration',
          updated: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Found ${articles.length} articles to update`);

    const results = [];
    
    for (const article of articles) {
      try {
        console.log(`🎨 Generating image for: ${article.title}`);
        
        // First try to fetch a real news image
        const { data: fetchResult, error: fetchError } = await supabaseClient.functions.invoke(
          'fetch-news-image',
          {
            body: { 
              topic: article.title,
              category: article.category 
            }
          }
        );

        let imageUrl = null;
        let imageCredit = null;
        let method = 'none';

        // If fetch succeeded and got a good image, use it
        if (!fetchError && fetchResult?.success && fetchResult?.imageUrl) {
          imageUrl = fetchResult.imageUrl;
          imageCredit = fetchResult.imageCredit || 'News Source';
          method = 'news-search';
          console.log(`✓ Found news image for: ${article.title}`);
        } else {
          // Fallback to AI generation
          console.log(`🤖 Generating AI image for: ${article.title}`);
          const { data: aiResult, error: aiError } = await supabaseClient.functions.invoke(
            'generate-ai-image',
            {
              body: { 
                title: article.title,
                category: article.category,
                excerpt: article.excerpt
              }
            }
          );

          if (!aiError && aiResult?.success && aiResult?.imageUrl) {
            imageUrl = aiResult.imageUrl;
            imageCredit = aiResult.imageCredit || 'AI Generated';
            method = 'ai-generation';
            console.log(`✓ Generated AI image for: ${article.title}`);
          }
        }

        // Update article with new image
        if (imageUrl) {
          const { error: updateError } = await supabaseClient
            .from('articles')
            .update({
              image_url: imageUrl,
              featured_image: imageUrl,
              og_image: imageUrl,
              image_credit: imageCredit,
              updated_at: new Date().toISOString()
            })
            .eq('id', article.id);

          if (updateError) {
            console.error(`Failed to update article ${article.id}:`, updateError);
            results.push({ 
              id: article.id, 
              title: article.title, 
              success: false, 
              error: updateError.message 
            });
          } else {
            results.push({ 
              id: article.id, 
              title: article.title, 
              success: true,
              method,
              imageUrl 
            });
          }
        } else {
          results.push({ 
            id: article.id, 
            title: article.title, 
            success: false, 
            error: 'Failed to generate or fetch image' 
          });
        }

        // Rate limiting: wait 2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (articleError) {
        console.error(`Error processing article ${article.id}:`, articleError);
        results.push({ 
          id: article.id, 
          title: article.title, 
          success: false, 
          error: articleError instanceof Error ? articleError.message : 'Unknown error' 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    console.log(`✓ Regeneration complete: ${successCount}/${articles.length} successful`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${successCount} of ${articles.length} articles`,
        updated: successCount,
        total: articles.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in regenerate-article-images:', error);
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
