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
    const { title, category, excerpt } = await req.json();
    
    if (!title) {
      throw new Error('Title is required');
    }

    console.log(`🎨 Generating AI image for: ${title}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Check if content is about a specific person (avoid AI-generated human images)
    const personIndicators = [
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/, // Name patterns (e.g., "John Smith")
      /\b(CEO|artist|singer|rapper|actor|actress|politician|president|minister|director)\b/i,
      /\b(died|death|obituary|biography|portrait|interview)\b/i,
    ];
    
    const isAboutPerson = personIndicators.some(pattern => 
      pattern.test(title) || pattern.test(excerpt || '')
    );

    if (isAboutPerson) {
      console.log('⚠️ Article appears to be about a person - skipping AI generation to avoid offensive imagery');
      throw new Error('Cannot generate AI images for person-focused articles. Please use real news images instead.');
    }

    // Create detailed, photorealistic prompt based on article
    let styleModifier = 'photorealistic news photography, high quality, professional journalism, NO PEOPLE, NO FACES, NO PORTRAITS';
    let sceneDescription = '';

    // Category-specific visual descriptions
    const categoryLower = (category || '').toLowerCase();
    if (categoryLower.includes('weather')) {
      sceneDescription = 'dramatic weather scene, atmospheric conditions, meteorological event, natural forces';
    } else if (categoryLower.includes('business')) {
      sceneDescription = 'modern corporate environment, professional business setting, economic activity, market scene';
    } else if (categoryLower.includes('tech')) {
      sceneDescription = 'cutting-edge technology, innovation showcase, modern tech environment, digital advancement';
    } else if (categoryLower.includes('sports')) {
      sceneDescription = 'dynamic athletic action, sports arena, competitive moment, athletic achievement';
    } else if (categoryLower.includes('entertainment') || categoryLower.includes('music')) {
      sceneDescription = 'entertainment venue, performance stage, artistic presentation, cultural event';
    } else if (categoryLower.includes('science')) {
      sceneDescription = 'scientific research, laboratory setting, discovery moment, technological advancement';
    } else if (categoryLower.includes('politics')) {
      sceneDescription = 'government setting, political gathering, official ceremony, diplomatic event';
    } else {
      sceneDescription = 'news-worthy scene, current events, significant moment, journalistic documentation';
    }

    // Extract key concepts from title for better image relevance
    const titleConcepts = title
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter((word: string) => word.length > 4)
      .slice(0, 5)
      .join(', ');

    const prompt = `${styleModifier}: ${sceneDescription}. Scene elements: ${titleConcepts}. ${excerpt ? 'Context: ' + excerpt.substring(0, 100) : ''}. Vibrant, engaging, editorial quality photograph suitable for news article hero image. Focus on objects, scenes, environments, concepts - absolutely no human faces or people. No text, no watermarks, no labels.`;

    console.log(`📝 Image prompt: ${prompt.substring(0, 200)}...`);

    // Generate image using Lovable AI (Google Gemini Flash Image)
    const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('Lovable AI API error:', imageResponse.status, errorText);
      throw new Error(`Failed to generate image: ${errorText}`);
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl || !imageUrl.startsWith('data:image')) {
      throw new Error('No image data received from Lovable AI');
    }

    // Extract base64 from data URL
    const base64Image = imageUrl.split(',')[1];

    console.log('✓ Image generated successfully, uploading to storage...');

    // Convert base64 to buffer and upload to Supabase Storage
    const imageBuffer = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate unique filename
    const sanitizedTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
    const timestamp = Date.now();
    const filename = `articles/ai-generated/${sanitizedTitle}-${timestamp}.png`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseClient.storage
      .from('article-images')
      .upload(filename, imageBuffer, {
        contentType: 'image/png',
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
        imageCredit: 'AI Generated Image',
        method: 'ai-generation'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-ai-image:', error);
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
