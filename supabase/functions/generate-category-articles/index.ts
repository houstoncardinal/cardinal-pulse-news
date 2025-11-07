import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Trending topics by category - updated frequently based on global trends
const trendingTopics = {
  music: [
    "Grammy-winning artist announces surprise album drop",
    "Viral music phenomenon breaks streaming records worldwide",
    "Music festival announces historic lineup for 2025",
    "Rising pop star collaborates with legendary producer",
    "Hip-hop artist's documentary reveals untold story",
    "Classical music reaches new generation through social media",
    "Independent musician revolutionizes music distribution",
    "Global music chart dominated by unexpected genre fusion"
  ],
  movies: [
    "Oscar contender generates unprecedented box office success",
    "Streaming platform reveals exclusive blockbuster slate",
    "Director's comeback film breaks international records",
    "Superhero franchise announces game-changing reboot",
    "Documentary exposes industry secrets and sparks debate",
    "Indie film festival discovery becomes cultural phenomenon",
    "Animation studio unveils groundbreaking visual technology",
    "Actor's powerful performance redefines career trajectory"
  ],
  science: [
    "Breakthrough cancer treatment shows remarkable results in trials",
    "NASA mission discovers potential signs of life on distant moon",
    "Climate scientists unveil revolutionary carbon capture method",
    "Quantum computing achieves unprecedented processing milestone",
    "Gene therapy offers hope for previously incurable disease",
    "Archaeological discovery rewrites human migration history",
    "Ocean exploration reveals unknown ecosystem in deep trenches",
    "Neuroscience study unlocks secrets of memory formation"
  ],
  politics: [
    "Historic bipartisan legislation transforms national policy",
    "Global summit addresses urgent climate action commitments",
    "Election results signal major shift in political landscape",
    "International trade agreement reshapes economic alliances",
    "Supreme Court ruling sets precedent on civil rights issue",
    "Grassroots movement achieves unprecedented policy change",
    "Political leader's bold reform initiative gains momentum",
    "Diplomatic breakthrough eases international tensions"
  ],
  ai_innovation: [
    "AI model demonstrates human-level reasoning in breakthrough test",
    "Tech giant unveils revolutionary neural network architecture",
    "AI-powered medical diagnosis system outperforms specialists",
    "Ethical AI framework adopted by Fortune 500 companies",
    "Machine learning breakthrough solves decade-old scientific puzzle",
    "AI assistant achieves natural conversation indistinguishable from human",
    "Autonomous vehicle technology reaches Level 5 capability",
    "AI system creates original inventions, raising patent questions"
  ]
};

async function generateArticleFromTrend(
  category: string, 
  trend: string, 
  existingTitles: string[], 
  supabase: any,
  usedImagesInBatch: Set<string>
): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

  const timestamp = new Date().toISOString();
  const perspectives = [
    "exclusive insider access", "expert panel insights", "investigative deep dive",
    "on-location reporting", "comprehensive analysis", "breaking coverage",
    "industry veteran perspective", "emerging trends spotlight", "data-driven investigation"
  ];
  const perspective = perspectives[Math.floor(Math.random() * perspectives.length)];

  const systemPrompt = `You are an elite Harvard-educated journalist writing for Cardinal News, meeting Google E-E-A-T standards (Experience, Expertise, Authoritativeness, Trustworthiness).

CRITICAL QUALITY STANDARDS:
- Harvard-level writing with sophisticated analysis
- 1200-1800 words of thoroughly researched content
- Unique angle: ${perspective}
- Generated at: ${timestamp}
- 2-3 expert quotes with realistic attribution
- Data-driven insights with specific statistics
- 100% original content - never generic or templated

HTML FORMATTING REQUIREMENTS:
1. Start with compelling opening <p> (no h1, that's the title)
2. Use <h2> for major sections
3. Include 2-3 <blockquote> with expert perspectives
4. Wrap all text in <p> tags
5. Use <strong> for key facts and statistics
6. Add <ul> or <ol> lists where appropriate
7. End with forward-looking analysis

Make it read like premium journalism from The New York Times, Forbes, or Bloomberg.`;

  const existingContext = existingTitles.length > 0
    ? `\n\nEXISTING TITLES (make yours completely unique):\n${existingTitles.slice(-5).join('\n')}`
    : '';

  const userPrompt = `Write a comprehensive, expertly researched article about: "${trend}"

Category: ${category}
Unique Angle: ${perspective}
${existingContext}

CRITICAL REQUIREMENTS:
- Create a COMPLETELY UNIQUE headline (not similar to trend description)
- Open with a powerful hook that engages immediately  
- Include specific data points and statistics throughout
- Feature 2-3 expert quotes with realistic names and credentials
- Provide sophisticated analysis showing deep expertise
- Use varied section headings with compelling titles
- Format with proper HTML: <p>, <h2>, <blockquote>, <strong>, <ul>
- End with implications and future outlook

This must be distinctive, original, and demonstrate exceptional journalistic quality.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // Low temperature for factual accuracy
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI generation failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // Generate unique title
  const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const title = titleMatch 
    ? titleMatch[1].replace(/<[^>]*>/g, '').trim()
    : trend.replace(/^(.*?)(announces|reveals|discovers|breaks|achieves)/, '$1 $2').substring(0, 100);

  const slug = title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 60) + '-' + Math.random().toString(36).substring(2, 8);

  const cleanContent = content.replace(/<h1[^>]*>.*?<\/h1>/gi, '').trim();
  const wordCount = cleanContent.split(/\s+/).length;
  const readTime = `${Math.max(1, Math.round(wordCount / 200))} min read`;

  const tempDiv = cleanContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  const excerpt = tempDiv.substring(0, 200).trim() + '...';

  // Map category to database format
  const dbCategory = category === 'music' || category === 'movies' 
    ? 'entertainment' 
    : category === 'ai_innovation' 
    ? 'ai_innovation' 
    : category;

  // Fetch real news image with retry for uniqueness
  console.log(`🔍 Searching for real image: ${title}`);
  let imageUrl = null;
  let imageCredit = null;

  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    try {
      const { data: imageData, error: imageError } = await supabase.functions.invoke('fetch-news-image', {
        body: { topic: title, category: dbCategory }
      });

      if (!imageError && imageData?.success) {
        // Check if this image was already used in this batch
        if (!usedImagesInBatch.has(imageData.imageUrl)) {
          imageUrl = imageData.imageUrl;
          imageCredit = imageData.imageCredit;
          usedImagesInBatch.add(imageData.imageUrl);
          console.log('✓ Unique real image sourced:', imageCredit);
          break;
        } else {
          console.log(`⚠️ Image already used in batch, retrying... (${attempts + 1})`);
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } else {
        console.warn('No suitable image found');
        break;
      }
    } catch (err) {
      console.warn('Image fetch failed:', err);
      break;
    }
  }
  
  if (!imageUrl) {
    console.warn('Could not find unique image after retries, continuing without image');
  }

  return {
    title,
    slug,
    content: cleanContent,
    excerpt,
    category: dbCategory,
    word_count: wordCount,
    read_time: readTime,
    author: 'Hunain Qureshi',
    status: 'draft', // Start as draft for verification
    published_at: null, // Will be set after verification
    featured_image: imageUrl,
    image_url: imageUrl,
    image_credit: imageCredit,
    og_image: imageUrl,
    meta_title: title,
    meta_description: excerpt,
    meta_keywords: [dbCategory, category, 'breaking news', 'trending'],
    tags: [dbCategory, category, 'featured', 'trending']
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { categories: requestedCategories, articlesPerCategory = 3 } = await req.json().catch(() => ({}));

    const categoriesToGenerate = requestedCategories || ['music', 'movies', 'science', 'politics', 'ai_innovation'];

    console.log(`🚀 Generating ${articlesPerCategory} articles for categories:`, categoriesToGenerate);

    // Fetch existing titles for duplicate detection
    const { data: existingArticles } = await supabase
      .from('articles')
      .select('title')
      .order('created_at', { ascending: false })
      .limit(100);

    const existingTitles = existingArticles?.map((a: any) => a.title) || [];

    const allArticles = [];
    const results = [];
    
    // Track used images in this batch to prevent duplicates
    const usedImagesInBatch = new Set<string>();

    for (const category of categoriesToGenerate) {
      const trends = trendingTopics[category as keyof typeof trendingTopics];
      if (!trends) {
        console.warn(`Unknown category: ${category}`);
        continue;
      }

      const selectedTrends = trends.slice(0, articlesPerCategory);

      for (const trend of selectedTrends) {
        try {
          console.log(`📝 Generating: [${category}] ${trend}`);

          const article = await generateArticleFromTrend(category, trend, existingTitles, supabase, usedImagesInBatch);

          // Enhanced duplicate check
          const titleWords = new Set(
            article.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3)
          );

          let isDuplicate = false;
          for (const existingTitle of existingTitles) {
            const existingWords = new Set(
              existingTitle.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3)
            );

            const titleWordsArray = Array.from(titleWords) as string[];
            const commonWords = titleWordsArray.filter((word: string) => existingWords.has(word));
            const similarity = commonWords.length / Math.max(titleWords.size, existingWords.size);

            if (similarity > 0.7) {
              console.log(`⚠️ Skipping duplicate: "${article.title}" (${(similarity * 100).toFixed(1)}% match)`);
              isDuplicate = true;
              break;
            }
          }

          if (!isDuplicate) {
            existingTitles.push(article.title);
            allArticles.push(article);
            results.push({
              category,
              trend,
              title: article.title,
              status: 'generated'
            });
            console.log(`✓ Generated: ${article.title}`);
          } else {
            results.push({
              category,
              trend,
              status: 'skipped_duplicate'
            });
          }

          // Rate limiting delay
          await new Promise(resolve => setTimeout(resolve, 1500));

        } catch (error) {
          console.error(`❌ Error generating [${category}] ${trend}:`, error);
          results.push({
            category,
            trend,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    // Bulk insert articles as drafts
    if (allArticles.length > 0) {
      const { data: insertedArticles, error } = await supabase
        .from('articles')
        .insert(allArticles)
        .select();

      if (error) throw error;

      console.log(`✅ Successfully inserted ${insertedArticles.length} draft articles, now verifying...`);
      
      // Verify and publish each article
      let publishedCount = 0;
      let rejectedCount = 0;
      
      for (const article of insertedArticles) {
        try {
          const { data: verificationData, error: verifyError } = await supabase.functions.invoke('verify-and-publish-article', {
            body: { articleId: article.id }
          });

          if (!verifyError && verificationData?.decision === 'publish') {
            publishedCount++;
            console.log(`✓ Published: ${article.title}`);
          } else {
            rejectedCount++;
            console.log(`✗ Rejected/Review: ${article.title}`);
          }
        } catch (verifyError) {
          console.error(`Verification failed for ${article.title}:`, verifyError);
          rejectedCount++;
        }
        
        // Small delay between verifications
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`✅ Verification complete: ${publishedCount} published, ${rejectedCount} rejected/review`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${allArticles.length} unique articles across ${categoriesToGenerate.length} categories`,
        results,
        totalArticles: allArticles.length,
        categories: categoriesToGenerate
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Error in generate-category-articles:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
