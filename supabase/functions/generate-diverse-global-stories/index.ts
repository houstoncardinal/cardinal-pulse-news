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

    // Comprehensive global regions and major cities
    const globalLocations = [
      // North America
      { city: "New York", country: "USA", region: "US-NY", type: "metro" },
      { city: "Los Angeles", country: "USA", region: "US-CA", type: "metro" },
      { city: "Chicago", country: "USA", region: "US-IL", type: "metro" },
      { city: "Houston", country: "USA", region: "US-TX", type: "metro" },
      { city: "Miami", country: "USA", region: "US-FL", type: "metro" },
      { city: "Toronto", country: "Canada", region: "CA-ON", type: "metro" },
      { city: "Vancouver", country: "Canada", region: "CA-BC", type: "metro" },
      { city: "Mexico City", country: "Mexico", region: "MX-CMX", type: "metro" },
      
      // South America
      { city: "Sao Paulo", country: "Brazil", region: "BR-SP", type: "metro" },
      { city: "Rio de Janeiro", country: "Brazil", region: "BR-RJ", type: "metro" },
      { city: "Buenos Aires", country: "Argentina", region: "AR-B", type: "metro" },
      { city: "Bogota", country: "Colombia", region: "CO-DC", type: "metro" },
      { city: "Lima", country: "Peru", region: "PE-LIM", type: "metro" },
      { city: "Santiago", country: "Chile", region: "CL-RM", type: "metro" },
      
      // Europe
      { city: "London", country: "UK", region: "GB-LND", type: "metro" },
      { city: "Paris", country: "France", region: "FR-J", type: "metro" },
      { city: "Berlin", country: "Germany", region: "DE-BE", type: "metro" },
      { city: "Madrid", country: "Spain", region: "ES-MD", type: "metro" },
      { city: "Rome", country: "Italy", region: "IT-RM", type: "metro" },
      { city: "Amsterdam", country: "Netherlands", region: "NL-NH", type: "metro" },
      { city: "Stockholm", country: "Sweden", region: "SE-AB", type: "metro" },
      { city: "Copenhagen", country: "Denmark", region: "DK-84", type: "metro" },
      { city: "Moscow", country: "Russia", region: "RU-MOW", type: "metro" },
      
      // Asia
      { city: "Tokyo", country: "Japan", region: "JP-13", type: "metro" },
      { city: "Seoul", country: "South Korea", region: "KR-11", type: "metro" },
      { city: "Beijing", country: "China", region: "CN-BJ", type: "metro" },
      { city: "Shanghai", country: "China", region: "CN-SH", type: "metro" },
      { city: "Mumbai", country: "India", region: "IN-MH", type: "metro" },
      { city: "Delhi", country: "India", region: "IN-DL", type: "metro" },
      { city: "Bangalore", country: "India", region: "IN-KA", type: "metro" },
      { city: "Singapore", country: "Singapore", region: "SG", type: "metro" },
      { city: "Bangkok", country: "Thailand", region: "TH-10", type: "metro" },
      { city: "Jakarta", country: "Indonesia", region: "ID-JK", type: "metro" },
      { city: "Manila", country: "Philippines", region: "PH-00", type: "metro" },
      { city: "Hong Kong", country: "Hong Kong", region: "HK", type: "metro" },
      
      // Middle East
      { city: "Dubai", country: "UAE", region: "AE-DU", type: "metro" },
      { city: "Tel Aviv", country: "Israel", region: "IL-TA", type: "metro" },
      { city: "Istanbul", country: "Turkey", region: "TR-34", type: "metro" },
      
      // Africa
      { city: "Cairo", country: "Egypt", region: "EG-C", type: "metro" },
      { city: "Lagos", country: "Nigeria", region: "NG-LA", type: "metro" },
      { city: "Johannesburg", country: "South Africa", region: "ZA-GT", type: "metro" },
      { city: "Nairobi", country: "Kenya", region: "KE-110", type: "metro" },
      
      // Oceania
      { city: "Sydney", country: "Australia", region: "AU-NSW", type: "metro" },
      { city: "Melbourne", country: "Australia", region: "AU-VIC", type: "metro" },
      { city: "Auckland", country: "New Zealand", region: "NZ-AUK", type: "metro" },
    ];

    // Diverse story types to cover
    const storyTypes = [
      {
        type: "crime",
        prompts: [
          "major crime investigation updates",
          "local law enforcement reports",
          "community safety initiatives",
          "crime prevention programs",
          "police department announcements"
        ]
      },
      {
        type: "neighborhood",
        prompts: [
          "local community events and gatherings",
          "neighborhood development projects",
          "community organization initiatives",
          "local volunteer programs",
          "neighborhood business openings"
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

    // Generate diverse stories from different locations and categories
    // Select random locations to cover
    const selectedLocations = globalLocations
      .sort(() => Math.random() - 0.5)
      .slice(0, 20); // Generate from 20 different locations

    for (const location of selectedLocations) {
      // Select 2-3 random story types for each location
      const selectedStoryTypes = storyTypes
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      for (const storyType of selectedStoryTypes) {
        const randomPrompt = storyType.prompts[Math.floor(Math.random() * storyType.prompts.length)];
        
        try {
          console.log(`📰 Generating ${storyType.type} story for ${location.city}, ${location.country}: ${randomPrompt}`);

          // Generate article using AI
          const articlePrompt = `You are Hunain Qureshi, an investigative journalist specializing in ${storyType.type} coverage. Write a compelling, factual news article about ${randomPrompt} in ${location.city}, ${location.country}.

The article should be:
- 600-900 words
- Include specific local context and details
- Professional yet engaging
- Well-researched with realistic scenarios
- Include quotes from community members or officials (realistic but illustrative)
- Structured with clear sections

Return ONLY a JSON object with this exact structure:
{
  "title": "Compelling headline about the story",
  "excerpt": "Engaging 2-3 sentence summary",
  "content": "Full article content with proper formatting",
  "category": "world",
  "tags": ["${location.city}", "${location.country}", "${storyType.type}", "tag4", "tag5"],
  "meta_description": "SEO-optimized description (150-160 chars)",
  "meta_keywords": ["${location.city}", "${location.country}", "${storyType.type}", "keyword4", "keyword5"]
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
                { role: "system", content: "You are a professional journalist. Always return valid JSON." },
                { role: "user", content: articlePrompt }
              ],
            }),
          });

          if (!response.ok) {
            console.error(`AI API error:`, response.status);
            continue;
          }

          const aiData = await response.json();
          const generatedContent = aiData.choices[0].message.content;
          
          // Parse JSON response
          let articleData;
          try {
            const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              articleData = JSON.parse(jsonMatch[0]);
            } else {
              articleData = JSON.parse(generatedContent);
            }
          } catch (parseError) {
            console.error("Failed to parse AI response");
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

          // Fetch news image
          let imageUrl = null;
          let imageCredit = null;
          
          try {
            const { data: imageData, error: imageError } = await supabaseClient.functions.invoke('fetch-news-image', {
              body: { 
                topic: `${storyType.type} ${location.city}`,
                category: "world"
              }
            });

            if (!imageError && imageData?.success) {
              imageUrl = imageData.imageUrl;
              imageCredit = imageData.imageCredit;
            }
          } catch (imageError) {
            console.error('Image fetch failed:', imageError);
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
