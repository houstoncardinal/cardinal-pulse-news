import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Diverse Jamaica locations for variety
const JAMAICA_LOCATIONS = [
  { name: 'Kingston', region: 'the capital', features: 'bustling urban center, historic landmarks' },
  { name: 'Montego Bay', region: 'the northwest coast', features: 'tourism hub, beaches, resorts' },
  { name: 'Ocho Rios', region: 'the north coast', features: 'waterfalls, cruise port, attractions' },
  { name: 'Negril', region: 'the western tip', features: 'Seven Mile Beach, cliffs, sunsets' },
  { name: 'Port Antonio', region: 'the northeast', features: 'Blue Lagoon, rainforest, eco-tourism' },
  { name: 'Mandeville', region: 'the central highlands', features: 'cooler climate, agriculture, mountains' },
];

// Dynamic story angles based on weather conditions
const getStoryAngle = (weatherData: any, alertsData: any) => {
  const temp = weatherData.main.temp;
  const conditions = weatherData.weather[0].main.toLowerCase();
  const hasAlerts = alertsData?.alerts && alertsData.alerts.length > 0;
  const humidity = weatherData.main.humidity;
  const windSpeed = weatherData.wind.speed;

  if (hasAlerts) {
    return {
      tone: 'urgent',
      focus: 'safety',
      priority: 'critical'
    };
  }

  if (conditions.includes('rain') || conditions.includes('storm')) {
    return {
      tone: 'informative',
      focus: 'community-impact',
      priority: 'high'
    };
  }

  if (temp > 32) {
    return {
      tone: 'advisory',
      focus: 'health-wellness',
      priority: 'medium'
    };
  }

  if (windSpeed > 10) {
    return {
      tone: 'cautionary',
      focus: 'outdoor-activities',
      priority: 'medium'
    };
  }

  if (humidity > 80) {
    return {
      tone: 'lifestyle',
      focus: 'daily-living',
      priority: 'low'
    };
  }

  if (conditions.includes('clear') && temp > 25 && temp < 30) {
    return {
      tone: 'positive',
      focus: 'lifestyle-culture',
      priority: 'low'
    };
  }

  return {
    tone: 'neutral',
    focus: 'general-update',
    priority: 'low'
  };
};

// Generate diverse prompts
const generateArticlePrompt = (weatherData: any, alertsData: any, location: any, angle: any, recentTitles: string[]) => {
  const weatherContext = `
CURRENT WEATHER IN JAMAICA (${location.name}, ${location.region}):
- Temperature: ${weatherData.main.temp}°C (Feels like: ${weatherData.main.feels_like}°C)
- Conditions: ${weatherData.weather[0].main} - ${weatherData.weather[0].description}
- Wind Speed: ${weatherData.wind.speed} m/s
- Humidity: ${weatherData.main.humidity}%
- Pressure: ${weatherData.main.pressure} hPa
- Visibility: ${weatherData.visibility / 1000} km
${alertsData?.alerts ? `\n⚠️ ACTIVE ALERTS: ${JSON.stringify(alertsData.alerts)}` : ''}
- Cloud Coverage: ${weatherData.clouds?.all || 0}%
- Local Features: ${location.features}

Recent Article Titles (MUST BE COMPLETELY DIFFERENT):
${recentTitles.join('\n')}
`;

  const toneInstructions = {
    urgent: 'Write with URGENCY and AUTHORITY. Focus on immediate safety concerns and actionable advice. Use strong, clear language.',
    informative: 'Write with CLARITY and DEPTH. Explain the weather patterns, community impacts, and what residents need to know. Be thorough but accessible.',
    advisory: 'Write with CARE and EXPERTISE. Provide health and wellness guidance. Include expert tips and recommendations.',
    cautionary: 'Write with BALANCE and PRACTICALITY. Discuss outdoor activities, events, and how weather affects daily plans.',
    lifestyle: 'Write with WARMTH and RELATABILITY. Connect weather to daily Jamaican life, culture, and community activities.',
    positive: 'Write with ENERGY and OPTIMISM. Celebrate beautiful weather while providing useful information.',
    neutral: 'Write with PROFESSIONALISM and ACCURACY. Provide a balanced weather update with relevant context.'
  };

  const focusAreas = {
    safety: 'safety protocols, emergency preparedness, protection measures, official warnings',
    'community-impact': 'how this affects neighborhoods, local businesses, schools, transportation, agriculture',
    'health-wellness': 'heat management, hydration, vulnerable populations, medical advice from health officials',
    'outdoor-activities': 'events, sports, tourism, beach conditions, hiking, water activities',
    'daily-living': 'household tips, clothing advice, energy use, sleep quality, mood effects',
    'lifestyle-culture': 'festivals, music events, food culture, social gatherings, outdoor dining',
    'general-update': 'comprehensive weather overview, forecast trends, seasonal patterns'
  };

  return `You are Hunain Qureshi, an award-winning journalist at Cardinal News covering Jamaica. Write a COMPLETELY UNIQUE, FRESH news article about current weather in ${location.name}, ${location.region}.

${weatherContext}

TONE: ${toneInstructions[angle.tone as keyof typeof toneInstructions]}
FOCUS: ${focusAreas[angle.focus as keyof typeof focusAreas]}

CRITICAL UNIQUENESS REQUIREMENTS:
- NEVER repeat similar headlines to recent articles
- Use COMPLETELY DIFFERENT story angles and perspectives
- Vary your opening hooks and narrative structures
- Change up the types of quotes and experts you cite
- Use diverse vocabulary and sentence structures
- Tell the story from different community perspectives each time

FORMATTING REQUIREMENTS:
- Start with a unique opening paragraph in <p> tags
- Use <h2> tags for major sections (vary section names each time)
- Include 2-3 <blockquote> tags with diverse expert quotes (meteorologists, community leaders, health officials, business owners)
- Wrap all paragraphs in <p> tags
- Use <strong> tags strategically for key information
- Include <ul> or <ol> lists where appropriate
- Add specific weather data throughout

CONTENT REQUIREMENTS (1200-1800 words):
- Open with a UNIQUE angle that hasn't been used in recent articles
- Incorporate local culture and community voices
- Provide specific, actionable information
- Include human interest elements
- Connect weather to local life, economy, or events
- Vary story structure: sometimes lead with data, sometimes with human impact, sometimes with expert analysis
- End with forward-looking information or community insights

Make this story COMPLETELY DISTINCT from previous coverage while maintaining journalistic excellence.`;
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

    if (!OPENWEATHER_API_KEY || !LOVABLE_API_KEY) {
      throw new Error('API keys not configured');
    }

    // Select random location for variety
    const location = JAMAICA_LOCATIONS[Math.floor(Math.random() * JAMAICA_LOCATIONS.length)];
    console.log(`Generating story for ${location.name}, Jamaica...`);

    // Fetch recent article titles to avoid repetition
    const { data: recentArticles } = await supabaseClient
      .from('articles')
      .select('title')
      .eq('category', 'world')
      .ilike('title', '%jamaica%')
      .order('created_at', { ascending: false })
      .limit(10);

    const recentTitles = recentArticles?.map(a => a.title) || [];

    // Fetch weather data
    console.log('Fetching weather data...');
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${location.name},JM&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    if (!weatherResponse.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const weatherData = await weatherResponse.json();
    const lat = weatherData.coord.lat;
    const lon = weatherData.coord.lon;

    // Fetch alerts
    const alertsResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    let alertsData = null;
    if (alertsResponse.ok) {
      alertsData = await alertsResponse.json();
    }

    console.log('Weather:', {
      location: location.name,
      temp: weatherData.main.temp,
      conditions: weatherData.weather[0].main,
      alerts: alertsData?.alerts?.length || 0
    });

    // Determine story angle based on conditions
    const angle = getStoryAngle(weatherData, alertsData);
    console.log('Story angle:', angle);

    // Generate article with dynamic prompt
    const articlePrompt = generateArticlePrompt(weatherData, alertsData, location, angle, recentTitles);

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
          { 
            role: 'system', 
            content: 'You are an award-winning journalist who writes unique, engaging, and varied news articles. Each piece must be completely distinct with fresh perspectives and angles. Use the provided tool to return structured article data.' 
          },
          { role: 'user', content: articlePrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'create_article',
              description: 'Create a unique news article with structured data',
              parameters: {
                type: 'object',
                properties: {
                  title: { 
                    type: 'string', 
                    description: 'UNIQUE headline (completely different from recent articles) under 80 characters that matches the story tone' 
                  },
                  excerpt: { 
                    type: 'string', 
                    description: 'Compelling 2-3 sentence summary with a unique angle (150-200 chars)' 
                  },
                  content: { 
                    type: 'string', 
                    description: 'Full article (1200-1800 words) in HTML with varied structure, diverse perspectives, and unique storytelling. Use <p>, <h2>, <h3>, <blockquote>, <strong>, <ul>, <ol> tags.' 
                  },
                  category: { type: 'string', enum: ['world'] },
                  tags: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: 'Relevant tags including location, weather type, and focus area'
                  },
                  meta_description: { 
                    type: 'string', 
                    description: 'SEO meta description 150-160 chars with unique hook' 
                  },
                  meta_keywords: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: 'Specific SEO keywords'
                  },
                  imagePrompt: { 
                    type: 'string', 
                    description: 'Detailed, specific prompt for image showing unique aspect of this weather story in Jamaica' 
                  }
                },
                required: ['title', 'excerpt', 'content', 'category', 'tags', 'meta_description', 'meta_keywords', 'imagePrompt'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'create_article' } },
        temperature: 0.9 // Higher temperature for more creativity and variety
      }),
    });

    if (!contentResponse.ok) {
      const errorText = await contentResponse.text();
      console.error('AI API error:', contentResponse.status, errorText);
      throw new Error(`AI generation failed: ${contentResponse.status}`);
    }

    const contentData = await contentResponse.json();
    const toolCall = contentData.choices[0].message.tool_calls?.[0];
    
    if (!toolCall || toolCall.function.name !== 'create_article') {
      throw new Error('AI did not return article data');
    }

    const articleData = JSON.parse(toolCall.function.arguments);

    // DO NOT generate AI images - user prefers real sourced images only
    // Weather articles will be published without images to avoid any potentially offensive AI-generated content
    console.log('⚠️ Skipping image generation per safety policy - article will be published without image');
    const imageUrl = null;

    // Generate slug
    const slug = articleData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 60) + '-' + Math.random().toString(36).substring(2, 8);

    // Calculate metrics
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
        image_credit: null,
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

    console.log(`✓ Published Jamaica story [${angle.tone}/${angle.focus}]: "${articleData.title}"`);

    return new Response(
      JSON.stringify({
        success: true,
        article: {
          id: article.id,
          title: articleData.title,
          slug,
          location: location.name,
          angle: angle,
          imageUrl
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating Jamaica story:', error);
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
