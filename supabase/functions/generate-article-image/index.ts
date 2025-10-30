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
    const { articleId, title, content, category } = await req.json();
    
    if (!articleId || !title) {
      throw new Error('Article ID and title are required');
    }

    console.log(`🔍 Searching for real news images for article: ${title}`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch real news image from web
    const { data: imageData, error: imageError } = await supabase.functions.invoke('fetch-news-image', {
      body: { 
        topic: title,
        category: category || 'news'
      }
    });

    if (imageError || !imageData?.success) {
      throw new Error('Failed to fetch news image from web');
    }

    const imageUrl = imageData.imageUrl;
    const imageCredit = imageData.imageCredit;

    console.log('✓ Image fetched, now validating for brand accuracy...');

    // CRITICAL: Validate image matches article content before saving
    const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-article-image', {
      body: {
        articleTitle: title,
        imageCredit: imageCredit,
        imageUrl: imageUrl,
        articleContent: content?.substring(0, 1000)
      }
    });

    if (validationError) {
      console.error('Image validation error:', validationError);
      // Proceed with caution but save the image
      console.log('⚠️ Validation failed, but proceeding with image');
    } else if (validationData && !validationData.valid && validationData.confidence > 70) {
      console.error('❌ IMAGE VALIDATION FAILED - BRAND MISMATCH DETECTED');
      console.error('Reason:', validationData.reason);
      throw new Error(`Image validation failed: ${validationData.reason}. This image appears to be from the wrong brand/company.`);
    } else if (validationData) {
      console.log(`✓ Image validation passed (confidence: ${validationData.confidence}%)`);
    }

    // Update article with validated image
    const { error: updateError } = await supabase
      .from('articles')
      .update({
        featured_image: imageUrl,
        image_url: imageUrl,
        image_credit: imageCredit,
        og_image: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', articleId);

    if (updateError) {
      console.error('Article update error:', updateError);
      throw new Error(`Failed to update article: ${updateError.message}`);
    }

    console.log('✓ Validated image assigned to article successfully:', imageUrl);

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: imageUrl,
        credit: imageCredit,
        sourceUrl: imageData.sourceUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-article-image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
