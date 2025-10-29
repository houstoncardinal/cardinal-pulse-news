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

    // Initialize Supabase client for duplicate checking
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create a unique hash from the topic for consistent but unique image selection
    const topicHash = topic.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    
    // Create highly diverse search queries with multiple random variations
    let searchQuery = topic;
    
    // Add category-specific VISUAL terms with random variations
    const visualTerms: string[] = [];
    if (category) {
      const categoryLower = category.toLowerCase();
      if (categoryLower.includes('weather')) {
        visualTerms.push('weather', 'storm', 'satellite', 'forecast', 'meteorology', 'climate', 'conditions', 'atmosphere');
      } else if (categoryLower.includes('business')) {
        visualTerms.push('executive', 'corporate', 'meeting', 'office', 'professional', 'boardroom', 'conference', 'business leader', 'ceo', 'entrepreneur');
      } else if (categoryLower.includes('tech')) {
        visualTerms.push('technology', 'innovation', 'device', 'digital', 'startup', 'launch', 'software', 'hardware', 'tech event');
      } else if (categoryLower.includes('sports')) {
        visualTerms.push('athlete', 'stadium', 'competition', 'game', 'championship', 'tournament', 'player', 'team', 'match');
      } else if (categoryLower.includes('entertainment') || categoryLower.includes('music') || categoryLower.includes('movies')) {
        visualTerms.push('celebrity', 'premiere', 'performance', 'concert', 'show', 'festival', 'actor', 'musician', 'red carpet');
      } else if (categoryLower.includes('science')) {
        visualTerms.push('laboratory', 'research', 'scientist', 'discovery', 'experiment', 'innovation', 'lab', 'equipment', 'breakthrough');
      } else if (categoryLower.includes('politics')) {
        visualTerms.push('politician', 'summit', 'conference', 'government', 'parliament', 'congress', 'debate', 'election', 'leader');
      } else {
        visualTerms.push('photo', 'image', 'scene', 'captured', 'moment', 'journalism', 'news', 'event');
      }
    }
    
    // Use topic hash to select different terms for each unique topic
    const numTerms = (topicHash % 3) + 2; // 2-4 terms based on topic
    const startIndex = topicHash % (visualTerms.length - numTerms);
    const selectedTerms = visualTerms.slice(startIndex, startIndex + numTerms);
    
    // Add multiple layers of uniqueness
    const timestamp = Date.now();
    const randomSeed = Math.floor(Math.random() * 100000);
    const uniqueModifier = (topicHash + timestamp) % 9999;
    searchQuery = `${topic} ${selectedTerms.join(' ')} ${uniqueModifier} ${randomSeed}`;
    
    console.log(`📸 Image search query: ${searchQuery}`);

    const imageSearchResponse = await fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: searchQuery,
        num: 100, // Fetch more images for better diversity
        gl: 'us',
        hl: 'en',
        safe: 'active',
        // Don't restrict to news type - get more diverse results
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
      'businessinsider', 'huffpost', 'politico', 'thehill', 'axios',
      'getty', 'apimages', 'shutterstock'
    ];

    // Filter out generic/irrelevant images - be more aggressive
    const excludeKeywords = [
      'logo', 'icon', 'chart', 'graph', 'stock-photo', 'stockphoto',
      'template', 'banner', 'advertisement', 'vector', 'illustration',
      'infographic', 'diagram', 'placeholder', 'thumbnail',
      'business-files', 'documents', 'paperwork', 'generic'
    ];

    // Get existing image URLs to avoid duplicates
    const { data: existingArticles } = await supabaseClient
      .from('articles')
      .select('image_url, featured_image')
      .not('image_url', 'is', null)
      .limit(500);
    
    const usedImageUrls = new Set<string>();
    if (existingArticles) {
      existingArticles.forEach(article => {
        if (article.image_url) usedImageUrls.add(article.image_url);
        if (article.featured_image) usedImageUrls.add(article.featured_image);
      });
    }

    console.log(`📊 Found ${usedImageUrls.size} existing image URLs to avoid`);

    // Filter available images
    const availableImages = imageSearchData.images.filter((img: any) => {
      const imgUrl = img.imageUrl || img.link;
      const imgUrlLower = (imgUrl || '').toLowerCase();
      const imgTitle = (img.title || '').toLowerCase();
      
      // Check if already used
      if (usedImageUrls.has(imgUrl)) {
        console.log(`⚠️ Skipping duplicate image: ${imgUrl}`);
        return false;
      }
      
      // Check if not a generic image
      const isNotGeneric = !excludeKeywords.some(keyword => 
        imgUrlLower.includes(keyword) || imgTitle.includes(keyword)
      );
      
      return isNotGeneric && imgUrl;
    });

    console.log(`✓ ${availableImages.length} unique images available after filtering`);

    if (availableImages.length === 0) {
      console.log('No unique images found after filtering');
      return new Response(
        JSON.stringify({ 
          success: false,
          imageUrl: null,
          imageCredit: null,
          message: 'No unique image found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use topic hash to deterministically but uniquely select from different parts of the results
    // (topicHash already calculated at the top)
    
    // Prioritize news sources but add strong randomization to selection
    const newsSourceImages = availableImages.filter((img: any) => {
      const imgUrl = (img.link || img.imageUrl || '').toLowerCase();
      return newsSourceKeywords.some(source => imgUrl.includes(source));
    });

    let selectedImage;
    const imagePool = newsSourceImages.length > 0 ? newsSourceImages : availableImages;
    
    // Use a combination of topic hash and random number to select from different positions
    // This ensures different topics get different images even when called simultaneously
    const hashOffset = topicHash % imagePool.length;
    const randomOffset = Math.floor(Math.random() * Math.min(20, imagePool.length));
    const selectedIndex = (hashOffset + randomOffset) % imagePool.length;
    
    selectedImage = imagePool[selectedIndex];
    console.log(`🎯 Selected unique image ${selectedIndex + 1} of ${imagePool.length} (hash: ${topicHash % 1000})`);

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