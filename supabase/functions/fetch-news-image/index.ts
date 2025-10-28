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
    const { topic, category } = await req.json();
    
    if (!topic) {
      throw new Error('Topic is required');
    }

    console.log(`🔍 Searching for real news images for: ${topic}`);

    const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');
    if (!SERPER_API_KEY) {
      throw new Error('SERPER_API_KEY not configured');
    }

    // Search for news images using Serper (Google Search API)
    const searchQuery = `${topic} news ${category || ''}`;
    const imageSearchResponse = await fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: searchQuery,
        num: 10,
        gl: 'us',
        hl: 'en',
        safe: 'active',
      }),
    });

    if (!imageSearchResponse.ok) {
      console.error('Image search failed:', imageSearchResponse.status);
      return new Response(
        JSON.stringify({ 
          success: false,
          imageUrl: null,
          imageCredit: null,
          message: 'No image found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageSearchData = await imageSearchResponse.json();
    
    if (!imageSearchData.images || imageSearchData.images.length === 0) {
      console.log('No images found in search results');
      return new Response(
        JSON.stringify({ 
          success: false,
          imageUrl: null,
          imageCredit: null,
          message: 'No image found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter images from reputable news sources
    const newsSourceKeywords = [
      'reuters', 'apnews', 'bbc', 'cnn', 'nytimes', 'washingtonpost', 
      'theguardian', 'aljazeera', 'bloomberg', 'wsj', 'forbes', 'npr',
      'nbcnews', 'abcnews', 'cbsnews', 'usatoday', 'latimes', 'time',
      'businessinsider', 'huffpost', 'politico', 'thehill', 'axios'
    ];

    // Try to find images from news sources first
    let selectedImage = imageSearchData.images.find((img: any) => 
      newsSourceKeywords.some(source => 
        img.link?.toLowerCase().includes(source) || 
        img.imageUrl?.toLowerCase().includes(source)
      )
    );

    // If no news source image, use the first high-quality result
    if (!selectedImage) {
      selectedImage = imageSearchData.images[0];
    }

    const imageUrl = selectedImage.imageUrl;
    
    // Extract source name from URL
    let sourceName = 'Unknown Source';
    try {
      const urlObj = new URL(selectedImage.link || imageUrl);
      sourceName = urlObj.hostname.replace('www.', '').split('.')[0];
      sourceName = sourceName.charAt(0).toUpperCase() + sourceName.slice(1);
    } catch (e) {
      console.error('Error parsing source URL:', e);
    }

    const imageCredit = `${sourceName} ${selectedImage.link ? `(${selectedImage.link})` : ''}`;

    console.log(`✓ Found image from: ${sourceName}`);

    // Download and upload the image to Supabase storage
    try {
      const imageResponse = await fetch(imageUrl);
      
      if (!imageResponse.ok) {
        console.error('Failed to download image:', imageResponse.status);
        return new Response(
          JSON.stringify({ 
            success: false,
            imageUrl: null,
            imageCredit: null,
            message: 'Failed to download image'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Generate filename
      const sanitizedTopic = topic
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50);
      const timestamp = Date.now();
      const extension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
      const filename = `articles/${sanitizedTopic}-${timestamp}.${extension}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabaseClient.storage
        .from('article-images')
        .upload(filename, imageBuffer, {
          contentType: `image/${extension}`,
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload failed:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseClient.storage
        .from('article-images')
        .getPublicUrl(filename);

      console.log(`✓ Image uploaded successfully: ${publicUrl}`);

      return new Response(
        JSON.stringify({
          success: true,
          imageUrl: publicUrl,
          imageCredit,
          sourceUrl: selectedImage.link,
          originalImageUrl: imageUrl,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (downloadError) {
      console.error('Error downloading/uploading image:', downloadError);
      
      // Return the original URL as fallback
      return new Response(
        JSON.stringify({
          success: true,
          imageUrl: imageUrl,
          imageCredit,
          sourceUrl: selectedImage.link,
          originalImageUrl: imageUrl,
          note: 'Using direct image URL (upload failed)'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in fetch-news-image:', error);
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