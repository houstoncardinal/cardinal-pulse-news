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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!OPENWEATHER_API_KEY) {
      throw new Error('OPENWEATHER_API_KEY not configured');
    }
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Fetch current weather for Jamaica (Kingston)
    console.log('Fetching current weather data for Jamaica...');
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Kingston,JM&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    if (!weatherResponse.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const weatherData = await weatherResponse.json();

    // Fetch alerts and severe weather
    const lat = weatherData.coord.lat;
    const lon = weatherData.coord.lon;
    const alertsResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    let alertsData = null;
    if (alertsResponse.ok) {
      alertsData = await alertsResponse.json();
    }

    console.log('Weather data received:', {
      temp: weatherData.main.temp,
      conditions: weatherData.weather[0].main,
      alerts: alertsData?.alerts?.length || 0
    });

    // Create detailed weather context for the AI
    const weatherContext = `
CURRENT WEATHER IN JAMAICA (Kingston):
- Temperature: ${weatherData.main.temp}°C (Feels like: ${weatherData.main.feels_like}°C)
- Conditions: ${weatherData.weather[0].main} - ${weatherData.weather[0].description}
- Wind Speed: ${weatherData.wind.speed} m/s
- Humidity: ${weatherData.main.humidity}%
- Pressure: ${weatherData.main.pressure} hPa
- Visibility: ${weatherData.visibility / 1000} km
${alertsData?.alerts ? `\n⚠️ ACTIVE ALERTS: ${JSON.stringify(alertsData.alerts)}` : ''}

Additional Data:
- Sunrise: ${new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString()}
- Sunset: ${new Date(weatherData.sys.sunset * 1000).toLocaleTimeString()}
- Sea Level Pressure: ${weatherData.main.sea_level || weatherData.main.pressure} hPa
${weatherData.rain ? `- Rainfall: ${JSON.stringify(weatherData.rain)}` : ''}
${weatherData.clouds ? `- Cloud Coverage: ${weatherData.clouds.all}%` : ''}
`;

    // Generate powerful article using AI
    const articlePrompt = `You are Hunain Qureshi, a powerful investigative journalist covering critical weather events. Write an URGENT, COMPELLING news article about the current weather situation in Jamaica.

${weatherContext}

Write a hard-hitting, emotionally resonant article that:
- Opens with a powerful lede that captures the severity/impact of the situation
- Uses vivid, sensory language to bring readers into the story
- Discusses the human impact and safety concerns
- Includes expert context about hurricanes/tropical storms in the Caribbean
- Provides actionable safety information for residents
- Uses dramatic but factual language
- 1000-1500 words of gripping journalism

Return ONLY valid JSON:
{
  "title": "Urgent, powerful headline (under 60 chars)",
  "excerpt": "Gripping 2-3 sentence summary",
  "content": "Full article in markdown format with powerful, vivid language",
  "category": "world",
  "tags": ["jamaica", "hurricane", "weather", "caribbean", "breaking news"],
  "meta_description": "SEO description (150-160 chars)",
  "meta_keywords": ["jamaica weather", "hurricane", "tropical storm", "caribbean", "breaking news"],
  "imagePrompt": "Detailed prompt for a dramatic, powerful image showing the weather conditions in Jamaica. Be specific about showing storm clouds, wind, rain, coastal areas, or hurricane impacts. Photojournalistic style, dramatic lighting, 16:9 composition."
}`;

    console.log('Generating article with AI...');
    const contentResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a professional investigative journalist. Return only valid JSON.' },
          { role: 'user', content: articlePrompt }
        ],
      }),
    });

    if (!contentResponse.ok) {
      const errorText = await contentResponse.text();
      console.error('AI API error:', contentResponse.status, errorText);
      throw new Error(`AI generation failed: ${contentResponse.status}`);
    }

    const contentData = await contentResponse.json();
    let generatedContent = contentData.choices[0].message.content;

    // Parse JSON
    const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    const articleData = JSON.parse(jsonMatch[0]);

    // Generate dramatic hero image
    console.log('Generating dramatic weather image...');
    const imagePrompt = articleData.imagePrompt || 
      `Dramatic photorealistic image of severe weather in Jamaica: dark storm clouds over Kingston, palm trees bending in strong winds, rough Caribbean seas, tropical storm conditions, dramatic lighting, photojournalistic style, 16:9 composition, ultra high resolution, powerful and urgent mood.`;

    const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [{ role: 'user', content: imagePrompt }],
        modalities: ['image', 'text']
      }),
    });

    let imageUrl = null;
    if (imageResponse.ok) {
      const imageData = await imageResponse.json();
      const generatedImageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (generatedImageUrl) {
        const base64Data = generatedImageUrl.split(',')[1];
        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const fileName = `jamaica-weather-${Date.now()}.png`;
        
        const { error: uploadError } = await supabaseClient.storage
          .from('article-images')
          .upload(fileName, imageBuffer, { contentType: 'image/png' });

        if (!uploadError) {
          const { data: { publicUrl } } = supabaseClient.storage
            .from('article-images')
            .getPublicUrl(fileName);
          imageUrl = publicUrl;
          console.log('✓ Dramatic weather image uploaded:', publicUrl);
        }
      }
    }

    // Generate slug
    const slug = articleData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 60) + '-' + Math.random().toString(36).substring(2, 8);

    // Calculate read time
    const wordCount = articleData.content.split(/\s+/).length;
    const readTime = Math.max(1, Math.round(wordCount / 200)) + ' min read';

    // Publish article
    const now = new Date().toISOString();
    const { data: article, error: insertError } = await supabaseClient
      .from('articles')
      .insert({
        title: articleData.title,
        slug,
        content: articleData.content,
        excerpt: articleData.excerpt,
        category: articleData.category,
        author: 'Hunain Qureshi',
        status: 'published',
        published_at: now,
        featured_image: imageUrl,
        image_url: imageUrl,
        image_credit: imageUrl ? 'AI Generated by Cardinal News (Lovable AI)' : null,
        tags: articleData.tags,
        meta_description: articleData.meta_description,
        meta_keywords: articleData.meta_keywords,
        meta_title: articleData.title,
        read_time: readTime,
        word_count: wordCount,
        og_title: articleData.title,
        og_description: articleData.excerpt,
        og_image: imageUrl,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert article:', insertError);
      throw insertError;
    }

    console.log(`✓ Published urgent Jamaica weather story: "${articleData.title}"`);

    return new Response(
      JSON.stringify({
        success: true,
        article: {
          id: article.id,
          title: articleData.title,
          slug,
          imageUrl
        },
        weatherData: {
          temp: weatherData.main.temp,
          conditions: weatherData.weather[0].main,
          alerts: alertsData?.alerts?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating Jamaica weather story:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
