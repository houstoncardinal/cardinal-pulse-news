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

async function generateArticleContent(category: string, topic: string): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  const systemPrompt = `You are an elite journalist writing for a prestigious news publication like Forbes or The New York Times. Create a comprehensive, well-researched news article with the following structure:

CRITICAL FORMAT REQUIREMENTS:
1. Start with a compelling opening paragraph (no heading)
2. Use <h2> tags for main section headings (3-4 sections)
3. Use <h3> tags for subsections where appropriate
4. Include 2-3 <blockquote> tags with powerful, memorable quotes from experts or key figures
5. Use <strong> tags for emphasis on key terms and important facts
6. Include <ul> or <ol> lists where appropriate for clarity
7. Add relevant statistics and data points
8. Write in a sophisticated, engaging tone with varied sentence structure
9. End with forward-looking analysis or implications

The article should be 800-1200 words, thoroughly researched-sounding, and formatted for luxury publication standards.`;

  const userPrompt = `Write a comprehensive news article about: "${topic}"

Category: ${category}

Include:
- Compelling opening paragraph that hooks the reader
- Multiple well-structured sections with <h2> headings
- Expert quotes in <blockquote> tags
- Specific details, statistics, and context
- Analysis of implications and future outlook
- Professional, sophisticated tone

Format the article with proper HTML tags: <h2>, <h3>, <blockquote>, <strong>, <p>, <ul>, <ol>`;

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
    author: 'Cardinal AI',
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

    const allArticles = [];
    const results = [];

    // Generate articles for each category
    for (const category of categories) {
      const topics = articleTemplates[category as keyof typeof articleTemplates];
      const selectedTopics = topics.slice(0, articlesPerCategory);

      for (const topic of selectedTopics) {
        try {
          console.log(`Generating article for ${category}: ${topic}`);
          
          const article = await generateArticleContent(category, topic);
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
