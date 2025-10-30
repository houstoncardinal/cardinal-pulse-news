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
    
    // Extract specific brand/company names from the topic for precise targeting
    const topicLower = topic.toLowerCase();
    const brandKeywords: string[] = [];
    
    // Extract specific company/brand names to ensure exact matches
    const commonBrands = [
      'chipotle', 'mcdonalds', 'starbucks', 'tesla', 'apple', 'google', 'microsoft',
      'amazon', 'facebook', 'meta', 'netflix', 'uber', 'airbnb', 'walmart', 'target',
      'nike', 'adidas', 'coca cola', 'pepsi', 'ford', 'toyota', 'honda', 'bmw'
    ];
    
    for (const brand of commonBrands) {
      if (topicLower.includes(brand)) {
        brandKeywords.push(brand);
        // Add the exact brand name with quotes for strict matching
        brandKeywords.push(`"${brand}"`);
      }
    }

    // Add category-specific VISUAL terms - focus on newsworthy, specific imagery
    const visualTerms: string[] = [];
    if (category) {
      const categoryLower = category.toLowerCase();
      if (categoryLower.includes('weather')) {
        visualTerms.push('weather event', 'official', 'news photo');
      } else if (categoryLower.includes('business')) {
        // CRITICAL: For business articles about specific companies, ONLY search for that company
        if (brandKeywords.length > 0) {
          visualTerms.push('official', 'headquarters', 'store', 'logo', 'authentic');
        } else {
          visualTerms.push('company headquarters', 'business event', 'corporate news');
        }
      } else if (categoryLower.includes('tech')) {
        visualTerms.push('product launch', 'tech event', 'official announcement');
      } else if (categoryLower.includes('sports')) {
        visualTerms.push('game', 'match', 'official');
      } else if (categoryLower.includes('entertainment')) {
        visualTerms.push('premiere', 'official', 'event');
      } else if (categoryLower.includes('science')) {
        visualTerms.push('research', 'laboratory', 'official');
      } else if (categoryLower.includes('politics')) {
        visualTerms.push('official', 'government', 'press');
      } else {
        visualTerms.push('official', 'news', 'authentic');
      }
    }
    
    // Build highly targeted search query
    // PRIORITY: If specific brand detected, use ONLY that brand name for maximum precision
    if (brandKeywords.length > 0) {
      // For brand-specific articles, search ONLY for that brand to prevent confusion
      const primaryBrand = brandKeywords[0];
      searchQuery = `${primaryBrand} official ${visualTerms[0] || 'news'}`;
      console.log(`🎯 BRAND-SPECIFIC search for: ${primaryBrand}`);
    } else {
      // For general topics, use broader search
      const numTerms = Math.min(2, visualTerms.length);
      const selectedTerms = visualTerms.slice(0, numTerms);
      searchQuery = `${topic} ${selectedTerms.join(' ')} official authentic`;
    }
    
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

    // CRITICAL: Brand conflict detection - prevent competitor images
    const brandConflicts: { [key: string]: string[] } = {
      'chipotle': ['mcdonalds', 'mcdonald', 'burger king', 'wendys', 'taco bell', 'qdoba'],
      'mcdonalds': ['chipotle', 'burger king', 'wendys', 'five guys'],
      'starbucks': ['dunkin', 'costa', 'peets', 'coffee bean'],
      'tesla': ['ford', 'gm', 'toyota', 'rivian', 'lucid'],
      'apple': ['samsung', 'google', 'microsoft', 'android'],
      'nike': ['adidas', 'reebok', 'puma', 'under armour'],
    };

    // Get conflicting brands to exclude if article is about a specific brand
    const excludeBrands: string[] = [];
    for (const [brand, competitors] of Object.entries(brandConflicts)) {
      if (topicLower.includes(brand)) {
        excludeBrands.push(...competitors);
        console.log(`⚠️ Excluding competitor brands for ${brand}: ${competitors.join(', ')}`);
      }
    }

    // Filter out generic/irrelevant images - VERY aggressive filtering
    const excludeKeywords = [
      ...excludeBrands,
      'logo', 'icon', 'chart', 'graph', 'stock-photo', 'stockphoto', 'stock_photo',
      'template', 'banner', 'advertisement', 'vector', 'illustration',
      'infographic', 'diagram', 'placeholder', 'thumbnail', 'clipart',
      'business-files', 'business_files', 'documents', 'paperwork', 'generic',
      'office-desk', 'desk', 'keyboard', 'laptop-screen', 'computer-screen',
      'handshake', 'meeting-table', 'conference-room', 'empty-office',
      'filing', 'folders', 'paper-stack', 'calculator', 'pen-paper',
      'abstract', 'concept', 'symbolic', 'metaphor', 'gettyimages-watermark',
      'shutterstock', 'istockphoto', 'dreamstime', 'depositphotos',
      'business-concept', 'business-background', 'office-background'
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

    // Filter available images with aggressive duplicate and generic image detection
    const availableImages = imageSearchData.images.filter((img: any) => {
      const imgUrl = img.imageUrl || img.link;
      const imgUrlLower = (imgUrl || '').toLowerCase();
      const imgTitle = (img.title || '').toLowerCase();
      const imgSource = (img.link || '').toLowerCase();
      
      // Check for exact duplicate URLs
      if (usedImageUrls.has(imgUrl)) {
        console.log(`⚠️ Skipping exact duplicate: ${imgUrl.substring(0, 80)}...`);
        return false;
      }
      
      // Check for similar URLs (same domain and similar path)
      const urlSimilar = Array.from(usedImageUrls).some(usedUrl => {
        try {
          const usedUrlObj = new URL(usedUrl);
          const currentUrlObj = new URL(imgUrl);
          // If same domain and filename is very similar, consider it a duplicate
          if (usedUrlObj.hostname === currentUrlObj.hostname) {
            const usedPath = usedUrlObj.pathname.split('/').pop() || '';
            const currentPath = currentUrlObj.pathname.split('/').pop() || '';
            if (usedPath.substring(0, 30) === currentPath.substring(0, 30)) {
              return true;
            }
          }
        } catch (e) {
          // Invalid URL, skip similarity check
        }
        return false;
      });
      
      if (urlSimilar) {
        console.log(`⚠️ Skipping similar image URL: ${imgUrl.substring(0, 80)}...`);
        return false;
      }
      
      // Aggressively filter generic images
      const hasGenericKeyword = excludeKeywords.some(keyword => 
        imgUrlLower.includes(keyword) || imgTitle.includes(keyword) || imgSource.includes(keyword)
      );
      
      if (hasGenericKeyword) {
        console.log(`⚠️ Skipping generic image: ${imgTitle.substring(0, 60)}...`);
        return false;
      }
      
      // Additional check: reject if title is too generic (less than 3 words)
      const titleWords = imgTitle.trim().split(/\s+/).filter((w: string) => w.length > 2);
      if (titleWords.length < 3) {
        console.log(`⚠️ Skipping image with generic title: "${imgTitle}"`);
        return false;
      }
      
      return imgUrl;
    });

    console.log(`✓ ${availableImages.length} unique images available after filtering`);

    if (availableImages.length === 0) {
      console.log('⚠️ No unique images found after filtering - falling back to AI generation');
      
      // Fallback to AI image generation
      try {
        const aiImageResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-ai-image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: topic, category }),
        });

        if (aiImageResponse.ok) {
          const aiResult = await aiImageResponse.json();
          if (aiResult.success) {
            console.log('✓ AI image generated successfully as fallback');
            return new Response(
              JSON.stringify(aiResult),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch (aiError) {
        console.error('AI fallback also failed:', aiError);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false,
          imageUrl: null,
          imageCredit: null,
          message: 'No unique image found and AI generation failed'
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