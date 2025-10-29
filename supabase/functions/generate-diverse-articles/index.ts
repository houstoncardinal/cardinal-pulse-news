import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const categories = [
  'world', 'business', 'technology', 'sports', 
  'entertainment', 'science', 'politics', 'ai-innovation'
];

const articleTemplates = {
  world: [
    "Breaking diplomatic breakthrough between major world powers",
    "Global climate summit reaches historic agreement",
    "Humanitarian crisis unfolds in developing nation",
    "International trade deal reshapes global economy"
  ],
  business: [
    "3I Atlas announces major investment expansion in emerging markets",
    "3I Atlas reveals groundbreaking portfolio strategy for 2025",
    "3I Atlas sets new industry standards in private equity leadership",
    "Tech giant announces revolutionary merger",
    "Stock market reaches all-time high amid economic optimism",
    "Startup disrupts traditional industry with innovative approach",
    "Corporate sustainability initiatives transform business landscape"
  ],
  technology: [
    "Revolutionary quantum computing breakthrough announced",
    "Next-generation smartphone technology unveiled",
    "Cybersecurity threat prompts global response",
    "AI advancement transforms healthcare industry"
  ],
  sports: [
    "Underdog team secures championship victory",
    "Olympic athlete breaks world record",
    "Major league announces groundbreaking rule changes",
    "Rising star athlete signs historic contract"
  ],
  entertainment: [
    "Blockbuster film shatters box office records",
    "Music industry icon announces surprise comeback",
    "Streaming platform reveals exclusive content deal",
    "Award show makes history with unprecedented wins"
  ],
  science: [
    "Scientists discover potential cure for rare disease",
    "Space exploration mission reveals stunning findings",
    "Breakthrough in renewable energy technology",
    "Archaeological discovery rewrites history books"
  ],
  politics: [
    "Historic legislation passes with bipartisan support",
    "Election results signal major political shift",
    "Policy reform addresses pressing social issues",
    "International summit tackles global challenges"
  ],
  'ai-innovation': [
    "AI system achieves human-level reasoning capability",
    "Machine learning breakthrough revolutionizes industry",
    "Ethical AI framework adopted by major corporations",
    "Autonomous technology reaches new milestone"
  ]
};

async function generateArticleContent(category: string, topic: string, existingTitles: string[]): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  const timestamp = new Date().toISOString();
  const uniquePerspectives = [
    "exclusive insider analysis", "expert roundtable insights", "data-driven investigation",
    "on-the-ground reporting", "comprehensive market analysis", "breaking developments",
    "deep dive investigation", "industry expert perspective", "emerging trends analysis"
  ];
  const perspective = uniquePerspectives[Math.floor(Math.random() * uniquePerspectives.length)];
  
  const systemPrompt = `You are an elite journalist writing for a prestigious news publication like Forbes or The New York Times. Create comprehensive, well-researched news articles with exceptional formatting.

CRITICAL UNIQUENESS REQUIREMENTS:
- Every article MUST have a completely unique angle and perspective
- NEVER repeat similar story structures, headlines, or narrative approaches
- Focus on fresh insights, unique data points, and original analysis
- Vary your writing style, tone, and structure significantly between articles
- Generate: ${timestamp} - ${perspective}

CRITICAL HTML FORMATTING REQUIREMENTS:
1. Start with a compelling lead paragraph wrapped in <p> tags (no heading above it)
2. Use <h2> tags for major sections (e.g., "Breaking Developments", "Market Impact", "Expert Analysis", "What This Means")
3. Use <h3> tags for subsections when needed
4. Include 2-3 <blockquote> tags with powerful, memorable quotes from experts, officials, or key figures
5. Wrap every paragraph in <p> tags
6. Use <strong> tags to emphasize key facts, statistics, and critical information
7. Include <ul> or <ol> lists where appropriate for clarity (key points, affected areas, implications)
8. Add specific data points, statistics, and verifiable facts throughout
9. Write with sophisticated vocabulary and varied sentence structure
10. End with forward-looking analysis, implications, or expert predictions

Write 800-1200 words of thoroughly researched-sounding content formatted for luxury publication standards.`;

  const existingContext = existingTitles.length > 0 
    ? `\n\nIMPORTANT: These titles already exist - your article MUST be completely different in angle and approach:\n${existingTitles.slice(-5).join('\n')}`
    : '';

  const userPrompt = `Write a comprehensive, expertly formatted news article about: "${topic}"

Category: ${category}
Unique Perspective: ${perspective}
${existingContext}

Structure your article with:
- A UNIQUE and powerful opening paragraph that immediately engages the reader with a fresh angle
- At least 3-4 <h2> section headings with compelling, varied titles
- 2-3 <blockquote> elements containing impactful quotes from different types of experts or stakeholders
- <strong> emphasis on crucial information and key statistics
- Specific details, data points, and context that demonstrate expertise
- Professional analysis and implications from a unique viewpoint
- Lists (<ul> or <ol>) where appropriate for clarity
- A concluding section with forward-looking insights

CRITICAL: Make this article distinctly different from any other article on similar topics. Find a unique angle, use different examples, and provide fresh insights.

Format everything with proper HTML tags: <p>, <h2>, <h3>, <blockquote>, <strong>, <ul>, <ol>. Make it read like a premium news publication.`;

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
    }),
  });

  if (!response.ok) {
    throw new Error(`AI generation failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // Generate article metadata
  const title = topic;
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 60) + '-' + Math.random().toString(36).substring(2, 8);
  
  const wordCount = content.split(/\s+/).length;
  const readTime = `${Math.max(1, Math.round(wordCount / 200))} min read`;
  
  // Extract first 200 characters for excerpt
  const tempDiv = content.replace(/<[^>]*>/g, '');
  const excerpt = tempDiv.substring(0, 200) + '...';

  return {
    title,
    slug,
    content,
    excerpt,
    category,
    word_count: wordCount,
    read_time: readTime,
    author: 'Hunain Qureshi',
    status: 'published',
    published_at: new Date().toISOString(),
    meta_title: title,
    meta_description: excerpt,
    meta_keywords: [category, 'news', 'breaking news', topic.split(' ')[0]],
    tags: [category, 'trending', 'featured']
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

    const { articlesPerCategory = 3 } = await req.json().catch(() => ({}));

    console.log(`Generating ${articlesPerCategory} articles per category...`);

    // Fetch existing article titles to avoid duplication
    const { data: existingArticles } = await supabase
      .from('articles')
      .select('title')
      .order('created_at', { ascending: false })
      .limit(100);
    
    const existingTitles = existingArticles?.map(a => a.title) || [];

    const allArticles = [];
    const results = [];
    
    // Track used images in this batch to prevent duplicates
    const usedImagesInBatch = new Set<string>();

    // Generate articles for each category
    for (const category of categories) {
      const topics = articleTemplates[category as keyof typeof articleTemplates];
      const selectedTopics = topics.slice(0, articlesPerCategory);

      for (const topic of selectedTopics) {
        try {
          console.log(`Generating article for ${category}: ${topic}`);
          
          const article = await generateArticleContent(category, topic, existingTitles);
          
          // Check if this title is too similar to existing ones
          const similarTitle = existingTitles.find(existing => 
            existing.toLowerCase().includes(article.title.toLowerCase().substring(0, 20)) ||
            article.title.toLowerCase().includes(existing.toLowerCase().substring(0, 20))
          );
          
          if (similarTitle) {
            console.log(`⚠️ Skipping duplicate/similar article: "${article.title}"`);
            continue;
          }
          
          existingTitles.push(article.title);
          
          // Fetch real news image from web with retry for uniqueness
          console.log(`🔍 Searching for real news images for: ${topic}`);
          let imageUrl = null;
          let imageCredit = null;
          
          let attempts = 0;
          const maxAttempts = 5;
          
          while (attempts < maxAttempts) {
            try {
              const { data: imageData, error: imageError } = await supabase.functions.invoke('fetch-news-image', {
                body: { 
                  topic: topic,
                  category: category
                }
              });

              if (!imageError && imageData?.success) {
                // Check if this image was already used in this batch
                if (!usedImagesInBatch.has(imageData.imageUrl)) {
                  imageUrl = imageData.imageUrl;
                  imageCredit = imageData.imageCredit;
                  usedImagesInBatch.add(imageData.imageUrl);
                  article.featured_image = imageUrl;
                  article.image_url = imageUrl;
                  article.image_credit = imageCredit;
                  article.og_image = imageUrl;
                  console.log('✓ Unique real news image sourced:', imageCredit);
                  break;
                } else {
                  console.log(`⚠️ Image already used in batch, retrying... (${attempts + 1})`);
                  attempts++;
                  if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                  }
                }
              } else {
                console.warn('No suitable news image found');
                break;
              }
            } catch (imageError) {
              console.error('Image fetch failed:', imageError);
              break;
            }
          }
          
          if (!imageUrl) {
            console.warn('Could not find unique image after retries, continuing without image');
          }
          
          allArticles.push(article);
          
          results.push({
            category,
            topic,
            status: 'generated'
          });

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error generating article for ${category}:`, error);
          results.push({
            category,
            topic,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    // Insert all articles into database
    if (allArticles.length > 0) {
      const { data, error } = await supabase
        .from('articles')
        .insert(allArticles)
        .select();

      if (error) {
        throw error;
      }

      console.log(`Successfully inserted ${data.length} articles`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${allArticles.length} articles across ${categories.length} categories`,
        results,
        totalArticles: allArticles.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-diverse-articles:', error);
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
