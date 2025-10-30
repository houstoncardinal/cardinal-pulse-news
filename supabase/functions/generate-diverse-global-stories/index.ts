import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("🌍 Starting comprehensive global stories generation...");

    // Log job start
    const { data: job } = await supabaseClient
      .from('jobs')
      .insert({
        type: 'generate_diverse_global_stories',
        status: 'running',
        started_at: new Date().toISOString(),
        payload: { message: 'Generating diverse global stories including crime, neighborhood, and regional news' }
      })
      .select()
      .single();

    // Major US City Hubs - Priority cities with enhanced local coverage
    const priorityUSHubs = [
      { city: "Houston", country: "USA", region: "US-TX", type: "metro", priority: true },
      { city: "Los Angeles", country: "USA", region: "US-CA", type: "metro", priority: true },
      { city: "Miami", country: "USA", region: "US-FL", type: "metro", priority: true },
      { city: "Chicago", country: "USA", region: "US-IL", type: "metro", priority: true },
      { city: "New York", country: "USA", region: "US-NY", type: "metro", priority: true },
    ];

    // Comprehensive global regions and major cities
    const otherLocations = [
      // North America - Other cities
      { city: "Toronto", country: "Canada", region: "CA-ON", type: "metro", priority: false },
      { city: "Vancouver", country: "Canada", region: "CA-BC", type: "metro", priority: false },
      { city: "Mexico City", country: "Mexico", region: "MX-CMX", type: "metro", priority: false },
      { city: "Phoenix", country: "USA", region: "US-AZ", type: "metro", priority: false },
      { city: "Philadelphia", country: "USA", region: "US-PA", type: "metro", priority: false },
      { city: "San Antonio", country: "USA", region: "US-TX", type: "metro", priority: false },
      { city: "San Diego", country: "USA", region: "US-CA", type: "metro", priority: false },
      { city: "Dallas", country: "USA", region: "US-TX", type: "metro", priority: false },
      
      // South America
      { city: "Sao Paulo", country: "Brazil", region: "BR-SP", type: "metro", priority: false },
      { city: "Rio de Janeiro", country: "Brazil", region: "BR-RJ", type: "metro", priority: false },
      { city: "Buenos Aires", country: "Argentina", region: "AR-B", type: "metro", priority: false },
      { city: "Bogota", country: "Colombia", region: "CO-DC", type: "metro", priority: false },
      { city: "Lima", country: "Peru", region: "PE-LIM", type: "metro", priority: false },
      { city: "Santiago", country: "Chile", region: "CL-RM", type: "metro", priority: false },
      
      // Europe
      { city: "London", country: "UK", region: "GB-LND", type: "metro", priority: false },
      { city: "Paris", country: "France", region: "FR-J", type: "metro", priority: false },
      { city: "Berlin", country: "Germany", region: "DE-BE", type: "metro", priority: false },
      { city: "Madrid", country: "Spain", region: "ES-MD", type: "metro", priority: false },
      { city: "Rome", country: "Italy", region: "IT-RM", type: "metro", priority: false },
      { city: "Amsterdam", country: "Netherlands", region: "NL-NH", type: "metro", priority: false },
      { city: "Stockholm", country: "Sweden", region: "SE-AB", type: "metro", priority: false },
      { city: "Copenhagen", country: "Denmark", region: "DK-84", type: "metro", priority: false },
      { city: "Moscow", country: "Russia", region: "RU-MOW", type: "metro", priority: false },
      
      // Asia
      { city: "Tokyo", country: "Japan", region: "JP-13", type: "metro", priority: false },
      { city: "Seoul", country: "South Korea", region: "KR-11", type: "metro", priority: false },
      { city: "Beijing", country: "China", region: "CN-BJ", type: "metro", priority: false },
      { city: "Shanghai", country: "China", region: "CN-SH", type: "metro", priority: false },
      { city: "Mumbai", country: "India", region: "IN-MH", type: "metro", priority: false },
      { city: "Delhi", country: "India", region: "IN-DL", type: "metro", priority: false },
      { city: "Bangalore", country: "India", region: "IN-KA", type: "metro", priority: false },
      { city: "Singapore", country: "Singapore", region: "SG", type: "metro", priority: false },
      { city: "Bangkok", country: "Thailand", region: "TH-10", type: "metro", priority: false },
      { city: "Jakarta", country: "Indonesia", region: "ID-JK", type: "metro", priority: false },
      { city: "Manila", country: "Philippines", region: "PH-00", type: "metro", priority: false },
      { city: "Hong Kong", country: "Hong Kong", region: "HK", type: "metro", priority: false },
      
      // Middle East
      { city: "Dubai", country: "UAE", region: "AE-DU", type: "metro", priority: false },
      { city: "Tel Aviv", country: "Israel", region: "IL-TA", type: "metro", priority: false },
      { city: "Istanbul", country: "Turkey", region: "TR-34", type: "metro", priority: false },
      
      // Africa
      { city: "Cairo", country: "Egypt", region: "EG-C", type: "metro", priority: false },
      { city: "Lagos", country: "Nigeria", region: "NG-LA", type: "metro", priority: false },
      { city: "Johannesburg", country: "South Africa", region: "ZA-GT", type: "metro", priority: false },
      { city: "Nairobi", country: "Kenya", region: "KE-110", type: "metro", priority: false },
      
      // Oceania
      { city: "Sydney", country: "Australia", region: "AU-NSW", type: "metro", priority: false },
      { city: "Melbourne", country: "Australia", region: "AU-VIC", type: "metro", priority: false },
      { city: "Auckland", country: "New Zealand", region: "NZ-AUK", type: "metro", priority: false },
    ];

    const allLocations = [...priorityUSHubs, ...otherLocations];

    // Diverse story types to cover - Hyper-local focus
    const storyTypes = [
      {
        type: "crime",
        prompts: [
          "breaking crime news and investigations",
          "local police department updates",
          "community safety alerts",
          "neighborhood watch initiatives",
          "gang violence prevention",
          "theft and burglary reports",
          "drug enforcement operations",
          "court proceedings and arrests"
        ]
      },
      {
        type: "neighborhood",
        prompts: [
          "local community events this weekend",
          "neighborhood block parties",
          "community center programs",
          "local school district news",
          "park improvements and openings",
          "street closures and construction",
          "neighborhood association meetings",
          "local charity drives"
        ]
      },
      {
        type: "street_level",
        prompts: [
          "potholes and road repairs",
          "street cleaning schedules",
          "local parking regulations",
          "sidewalk improvements",
          "streetlight maintenance",
          "traffic signal updates",
          "bike lane installations",
          "pedestrian safety measures"
        ]
      },
      {
        type: "regional",
        prompts: [
          "regional economic developments",
          "state or provincial policy changes",
          "regional infrastructure projects",
          "area transportation updates",
          "regional environmental initiatives"
        ]
      },
      {
        type: "local_government",
        prompts: [
          "city council decisions",
          "municipal budget updates",
          "local government initiatives",
          "public services announcements",
          "civic planning projects"
        ]
      },
      {
        type: "public_safety",
        prompts: [
          "emergency services updates",
          "fire department reports",
          "public health alerts",
          "traffic safety improvements",
          "disaster preparedness programs"
        ]
      },
      {
        type: "community",
        prompts: [
          "local cultural events",
          "community celebrations",
          "neighborhood activism",
          "grassroots movements",
          "community heroes and stories"
        ]
      },
      {
        type: "local_business",
        prompts: [
          "new business openings",
          "local entrepreneurship stories",
          "small business innovations",
          "regional economic trends",
          "local market developments"
        ]
      },
      {
        type: "infrastructure",
        prompts: [
          "local construction projects",
          "urban development updates",
          "public works improvements",
          "transportation infrastructure",
          "utility service updates"
        ]
      }
    ];

    const generatedArticles = [];
    let totalGenerated = 0;
    
    // Track used images in this batch to prevent duplicates
    const usedImagesInBatch = new Set<string>();

    // Generate diverse stories with priority for US hubs
    // Priority hubs get more coverage (5 stories each)
    // Other locations get 2 stories each
    const selectedLocations = [
      ...priorityUSHubs.map(hub => ({ ...hub, storyCount: 5 })), // 5 stories for priority hubs
      ...otherLocations
        .filter(loc => !loc.priority)
        .sort(() => Math.random() - 0.5)
        .slice(0, 15)
        .map(loc => ({ ...loc, storyCount: 2 })) // 2 stories for other cities
    ];

    for (const location of selectedLocations) {
      // Priority hubs get more story types covered
      const storyTypesToCover = location.priority ? location.storyCount : 2;
      const selectedStoryTypes = storyTypes
        .sort(() => Math.random() - 0.5)
        .slice(0, storyTypesToCover);

      for (const storyType of selectedStoryTypes) {
        const randomPrompt = storyType.prompts[Math.floor(Math.random() * storyType.prompts.length)];
        
        try {
          console.log(`📰 Generating ${storyType.type} story for ${location.city}, ${location.country}: ${randomPrompt}`);

          // Generate article using AI with clear JSON response format
          const articlePrompt = `You are Hunain Qureshi, an award-winning investigative journalist. Write a powerful, viral-worthy news article about ${randomPrompt} in ${location.city}, ${location.country}.

VIRAL CONTENT GUIDELINES:
- Attention-grabbing hook in first 2 sentences
- Emotional storytelling with journalistic integrity
- Include shocking statistics or revelations
- Human interest elements and real examples
- Quotable moments for social sharing
- 800-1000 words for maximum engagement

Return ONLY valid JSON (no markdown, no code blocks):
{
  "title": "Compelling headline (60-70 chars)",
  "excerpt": "Powerful 2-3 sentence hook",
  "content": "<p>Full article with HTML formatting...</p>",
  "tags": ["${location.city}", "${location.country}", "${storyType.type}", "tag4", "tag5"],
  "meta_description": "SEO description 150-160 chars",
  "meta_keywords": ["${location.city}", "${location.country}", "${storyType.type}", "kw4", "kw5"]
}`;

          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: "You are a professional journalist. Return ONLY valid JSON without markdown formatting or code blocks." },
                { role: "user", content: articlePrompt }
              ],
              temperature: 0.8,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`AI API error (${response.status}):`, errorText.substring(0, 200));
            continue;
          }

          const aiData = await response.json();
          let rawContent = aiData.choices?.[0]?.message?.content;
          
          if (!rawContent) {
            console.error("No content in AI response");
            continue;
          }

          // Parse JSON response - handle markdown code blocks
          let articleData;
          try {
            // Remove markdown code blocks if present
            rawContent = rawContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
            
            // Try to extract JSON object
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              console.error("No JSON object found in response:", rawContent.substring(0, 300));
              continue;
            }
            
            articleData = JSON.parse(jsonMatch[0]);
            
            // Validate required fields
            if (!articleData.title || !articleData.content || !articleData.excerpt) {
              console.error("Missing required fields. Has:", Object.keys(articleData).join(', '));
              continue;
            }
          } catch (parseError) {
            console.error("JSON parse error:", parseError instanceof Error ? parseError.message : String(parseError));
            console.error("Content sample:", rawContent.substring(0, 300));
            continue;
          }

          // Check for duplicate articles
          const { data: existingArticle } = await supabaseClient
            .from('articles')
            .select('id')
            .ilike('title', `%${articleData.title.substring(0, 30)}%`)
            .maybeSingle();

          if (existingArticle) {
            console.log(`⚠️ Similar article exists, skipping`);
            continue;
          }

          // Generate slug
          const slug = articleData.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .substring(0, 60) + "-" + Math.random().toString(36).substring(2, 8);

          // Calculate read time
          const wordCount = articleData.content.split(/\s+/).length;
          const readTime = Math.max(1, Math.round(wordCount / 200)) + " min read";

          // Fetch news image with retry for uniqueness
          let imageUrl = null;
          let imageCredit = null;
          
          let attempts = 0;
          const maxAttempts = 5;
          
          while (attempts < maxAttempts) {
            try {
              const { data: imageData, error: imageError } = await supabaseClient.functions.invoke('fetch-news-image', {
                body: { 
                  topic: `${storyType.type} ${location.city}`,
                  category: "world"
                }
              });

              if (!imageError && imageData?.success) {
                // Check if this image was already used in this batch
                if (!usedImagesInBatch.has(imageData.imageUrl)) {
                  imageUrl = imageData.imageUrl;
                  imageCredit = imageData.imageCredit;
                  usedImagesInBatch.add(imageData.imageUrl);
                  console.log('✓ Unique image sourced');
                  break;
                } else {
                  console.log(`⚠️ Image already used in batch, retrying... (${attempts + 1})`);
                  attempts++;
                  if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                  }
                }
              } else {
                break;
              }
            } catch (imageError) {
              console.error('Image fetch failed:', imageError);
              break;
            }
          }

          // Insert article - AUTO-PUBLISH
          const now = new Date().toISOString();
          const { data: article, error: insertError } = await supabaseClient
            .from("articles")
            .insert({
              title: articleData.title,
              slug,
              content: articleData.content,
              excerpt: articleData.excerpt,
              category: "world",
              author: "Hunain Qureshi",
              status: "published",
              published_at: now,
              featured_image: imageUrl,
              image_url: imageUrl,
              image_credit: imageCredit,
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

          if (!insertError) {
            console.log(`✓ Published: "${articleData.title}"`);
            generatedArticles.push({
              title: articleData.title,
              location: `${location.city}, ${location.country}`,
              type: storyType.type
            });
            totalGenerated++;
          }

          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`Error generating article:`, error);
        }
      }
    }

    console.log(`✅ Completed! Generated ${totalGenerated} diverse global stories`);

    // Update job as completed
    if (job) {
      await supabaseClient
        .from('jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result: { 
            locationsScanned: selectedLocations.length,
            totalGenerated,
            articles: generatedArticles.slice(0, 10), // Sample of articles
            message: `Generated ${totalGenerated} diverse stories including crime, neighborhood, regional, and community news from around the world`
          }
        })
        .eq('id', job.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Generated ${totalGenerated} diverse global stories`,
        totalGenerated,
        locationsScanned: selectedLocations.length,
        sampleArticles: generatedArticles.slice(0, 10)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-diverse-global-stories:", error);
    
    // Update job as failed
    try {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      
      const { data: runningJob } = await supabaseClient
        .from('jobs')
        .select('id')
        .eq('type', 'generate_diverse_global_stories')
        .eq('status', 'running')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (runningJob) {
        await supabaseClient
          .from('jobs')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date().toISOString()
          })
          .eq('id', runningJob.id);
      }
    } catch (jobError) {
      console.error('Error updating job status:', jobError);
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
