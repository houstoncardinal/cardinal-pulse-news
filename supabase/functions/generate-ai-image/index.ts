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

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Create detailed, photorealistic prompt based on article
    let styleModifier = 'photorealistic news photography, high quality, professional journalism';
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

    const prompt = `${styleModifier}: ${sceneDescription}. Scene elements: ${titleConcepts}. ${excerpt ? 'Context: ' + excerpt.substring(0, 100) : ''}. Vibrant, engaging, editorial quality photograph suitable for news article hero image. No text, no watermarks, no labels.`;

    console.log(`📝 Image prompt: ${prompt.substring(0, 200)}...`);

    // Generate image using OpenAI gpt-image-1
    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt,
        n: 1,
        size: '1536x1024', // Wide format for hero images
        quality: 'high',
        output_format: 'png',
        output_compression: 85,
      }),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('OpenAI API error:', imageResponse.status, errorText);
      throw new Error(`Failed to generate image: ${errorText}`);
    }

    const imageData = await imageResponse.json();
    const base64Image = imageData.data?.[0]?.b64_json;
    
    if (!base64Image) {
      throw new Error('No image data received from OpenAI');
    }

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
