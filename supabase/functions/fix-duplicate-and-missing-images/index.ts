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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Finding ALL articles with duplicate or missing images...');

    // Get all articles with missing images (no limit)
    const { data: missingImageArticles, error: missingError } = await supabase
      .from('articles')
      .select('id, title, category, excerpt, content, featured_image, image_url')
      .or('featured_image.is.null,image_url.is.null');

    if (missingError) {
      throw new Error(`Failed to fetch articles with missing images: ${missingError.message}`);
    }

    // Common fallback/placeholder images that should be replaced
    const fallbackPatterns = [
      '/assets/',
      'placeholder',
      'default',
      'fallback',
      'https://images.unsplash.com',
      'hero-news',
      'comet',
      'sauce-wood'
    ];

    // Get articles with fallback/duplicate images
    const { data: allArticles, error: allError } = await supabase
      .from('articles')
      .select('id, title, category, excerpt, content, featured_image, image_url');

    if (allError) {
      throw new Error(`Failed to fetch all articles: ${allError.message}`);
    }

    const articlesWithFallbacks = (allArticles || []).filter(article => {
      const img = article.featured_image || article.image_url || '';
      return fallbackPatterns.some(pattern => img.includes(pattern));
    });

    // Combine and deduplicate
    const articlesToFixMap = new Map();
    [...(missingImageArticles || []), ...articlesWithFallbacks].forEach(article => {
      articlesToFixMap.set(article.id, article);
    });

    const articlesToFix = Array.from(articlesToFixMap.values());

    console.log(`📊 Found ${articlesToFix.length} articles needing unique images`);

    const results: {
      success: Array<{ id: string; title: string; imageCredit: string }>;
      failed: Array<{ id: string; title: string; reason: string }>;
    } = {
      success: [],
      failed: []
    };

    for (const article of articlesToFix) {
      try {
        console.log(`\n🎨 Processing: ${article.title}`);

        // Try to fetch a real news image first
        const { data: imageData, error: imageError } = await supabase.functions.invoke('fetch-news-image', {
          body: { 
            topic: article.title,
            category: article.category || 'news'
          }
        });

        let imageUrl = '';
        let imageCredit = '';

        // If fetch fails, fall back to AI generation
        if (imageError || !imageData?.success) {
          console.log(`⚠️ News image fetch failed, using AI generation for "${article.title}"`);
          
          const { data: aiImageData, error: aiError } = await supabase.functions.invoke('generate-ai-image', {
            body: {
              title: article.title,
              category: article.category,
              excerpt: article.excerpt
            }
          });

          if (aiError || !aiImageData?.success) {
            console.error(`❌ AI generation also failed for "${article.title}"`);
            results.failed.push({
              id: article.id,
              title: article.title,
              reason: 'Both image fetch and AI generation failed'
            });
            continue;
          }

          imageUrl = aiImageData.imageUrl;
          imageCredit = 'AI Generated Image | Cardinal News';
          console.log(`✓ Generated AI image successfully`);
        } else {
          imageUrl = imageData.imageUrl;
          imageCredit = imageData.imageCredit || 'Image Source';
          console.log(`✓ Found news image: ${imageCredit}`);
        }

        // Ensure we have a valid image URL
        if (!imageUrl) {
          console.error(`❌ No image URL obtained for "${article.title}"`);
          results.failed.push({
            id: article.id,
            title: article.title,
            reason: 'No valid image URL obtained'
          });
          continue;
        }

        console.log(`✓ Found image: ${imageCredit}`);

        // Validate the image matches the article
        const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-article-image', {
          body: {
            articleTitle: article.title,
            imageCredit: imageCredit,
            imageUrl: imageUrl,
            articleContent: article.content?.substring(0, 1000)
          }
        });

        if (!validationError && validationData && !validationData.valid && validationData.confidence > 70) {
          console.log(`⚠️ Image validation failed for "${article.title}" - trying again`);
          
          // Try one more time with a different search
          const { data: retryImageData, error: retryError } = await supabase.functions.invoke('fetch-news-image', {
            body: { 
              topic: `${article.category} ${article.excerpt?.substring(0, 100)}`,
              category: article.category || 'news'
            }
          });

          if (!retryError && retryImageData?.success) {
            // Update article with the retry image
            const { error: updateError } = await supabase
              .from('articles')
              .update({
                featured_image: retryImageData.imageUrl,
                image_url: retryImageData.imageUrl,
                og_image: retryImageData.imageUrl,
                image_credit: retryImageData.imageCredit,
                updated_at: new Date().toISOString()
              })
              .eq('id', article.id);

            if (updateError) {
              throw new Error(`Failed to update article: ${updateError.message}`);
            }

            console.log(`✅ Updated "${article.title}" with retry image`);
            results.success.push({
              id: article.id,
              title: article.title,
              imageCredit: retryImageData.imageCredit
            });
            continue;
          }
        }

        // Update article with validated image
        const { error: updateError } = await supabase
          .from('articles')
          .update({
            featured_image: imageUrl,
            image_url: imageUrl,
            og_image: imageUrl,
            image_credit: imageCredit,
            updated_at: new Date().toISOString()
          })
          .eq('id', article.id);

        if (updateError) {
          throw new Error(`Failed to update article: ${updateError.message}`);
        }

        console.log(`✅ Updated "${article.title}" successfully`);
        results.success.push({
          id: article.id,
          title: article.title,
          imageCredit: imageCredit
        });

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ Error processing article "${article.title}":`, error);
        results.failed.push({
          id: article.id,
          title: article.title,
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log('\n📈 Final Results:');
    console.log(`✅ Successfully updated: ${results.success.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: articlesToFix.length,
          successful: results.success.length,
          failed: results.failed.length
        },
        details: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Critical error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.toString() : String(error)
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
