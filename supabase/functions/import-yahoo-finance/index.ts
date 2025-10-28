import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface YahooFinanceArticle {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  content?: string;
  guid: string;
  category?: string[];
  source?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category = 'finance', limit = 10 } = await req.json();

    console.log('Fetching Yahoo Finance news for category:', category);

    // Yahoo Finance RSS feed URLs
    const rssFeeds: Record<string, string> = {
      finance: 'https://finance.yahoo.com/news/rssindex',
      stocks: 'https://finance.yahoo.com/rss/topstories',
      crypto: 'https://finance.yahoo.com/rss/cryptocurrency',
      economy: 'https://finance.yahoo.com/rss/economics',
      earnings: 'https://finance.yahoo.com/rss/earnings',
    };

    const feedUrl = rssFeeds[category] || rssFeeds.finance;
    
    console.log('Fetching from RSS feed:', feedUrl);
    
    // Fetch RSS feed
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`);
    }

    const xmlText = await response.text();
    console.log('RSS feed fetched, parsing XML...');

    // Parse RSS XML
    const articles = parseRSSFeed(xmlText, limit);
    console.log(`Parsed ${articles.length} articles from feed`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const importedArticles = [];

    for (const article of articles) {
      try {
        console.log(`Processing article: ${article.title}`);

        // Generate a slug from the title
        const slug = generateSlug(article.title);

        // Check if article already exists
        const { data: existing } = await supabase
          .from('articles')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        if (existing) {
          console.log(`Article already exists: ${slug}`);
          continue;
        }

        console.log('Generating AI-powered article content for:', article.title);

        // Generate comprehensive article using Lovable AI
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (!LOVABLE_API_KEY) {
          throw new Error('LOVABLE_API_KEY not configured');
        }

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                content: `You are an elite financial journalist with Harvard-level writing expertise for Cardinal News. Your articles must meet the highest standards of professional journalism and Google's E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) guidelines.

                CRITICAL QUALITY REQUIREMENTS:
                
                1. EXPERIENCE: Demonstrate deep industry knowledge with specific examples, real-world implications, and contextual analysis
                2. EXPERTISE: Show mastery through expert quotes, technical accuracy, and sophisticated financial analysis
                3. AUTHORITATIVENESS: Reference credible sources, industry leaders, and verified data. Build trust through transparency
                4. TRUSTWORTHINESS: Maintain objectivity, cite sources properly, acknowledge uncertainties, present balanced viewpoints
                
                HARVARD-LEVEL WRITING STANDARDS:
                - Sophisticated vocabulary and sentence structure (avoid simplistic language)
                - Compelling narrative that engages intellectually curious readers
                - Analytical depth with cause-effect relationships and implications
                - Seamless transitions between ideas
                - Powerful opening that establishes stakes immediately
                - Expert-level insights beyond surface reporting
                - Data-driven arguments with proper contextualization
                
                GOOGLE NEWS OPTIMIZATION:
                - Focus on newsworthiness and timeliness
                - Clear, compelling headlines that promise value
                - Comprehensive coverage from multiple angles
                - Original analysis and expert commentary
                - Proper attribution and source credibility
                - Structured for featured snippets and rich results
                
                Your output MUST be valid JSON with this exact structure:
                {
                  "title": "Compelling, sophisticated headline under 60 characters that promises unique value",
                  "excerpt": "Intellectually engaging summary under 160 characters with key insight",
                  "content": "Full article content in HTML format (1200-1800 words). Use proper HTML tags: <h2> for main sections, <h3> for subsections, <p> for paragraphs, <blockquote> for expert quotes or powerful statements. Include 2-3 direct quotes from industry experts or key figures. Structure with clear sections and sophisticated subheadings. Write in an engaging, authoritative journalistic style with analytical depth. Open with compelling hook that establishes stakes. Include specific data points, percentages, and verified statistics. Provide context, implications, and expert analysis. Maintain Harvard-level sophistication throughout.",
                  "metaTitle": "SEO-optimized title under 60 characters with primary keyword",
                  "metaDescription": "SEO description under 160 characters with value proposition and keyword",
                  "metaKeywords": ["primary-keyword", "secondary-keyword", "industry-term", "trending-topic", "specific-entity"],
                  "tags": ["category-tag", "topic-tag", "trend-tag"],
                  "imagePrompt": "A photorealistic, high-impact financial news photograph: [specific subject with precise details], professional setting, dramatic lighting emphasizing urgency/importance, modern composition, ultra high resolution, photojournalistic style. Include specific visual elements that convey the story's significance."
                }
                
                CONTENT STRUCTURE REQUIREMENTS:
                - Opening paragraph: Establish stakes, significance, and key development in 2-3 sentences
                - Section 1: Core facts with expert context and analysis
                - Section 2: Broader implications and market impact
                - Section 3: Expert perspectives with 2-3 quoted sources
                - Section 4: Historical context or comparative analysis
                - Conclusion: Forward-looking implications and key takeaways
                
                UNIQUENESS REQUIREMENTS:
                - Completely original prose - never copy source material
                - Unique angle or perspective on the story
                - Original headline distinct from source
                - Fresh expert quotes or analysis when possible
                - Proprietary insights or connections
                
                IMPORTANT: Credit Yahoo Finance as a primary source while delivering 100% original, Harvard-quality analysis and reporting.`
              },
              {
                role: 'user',
                content: `Write an elite, Harvard-level financial news article based on this Yahoo Finance story. This article MUST meet Google E-E-A-T standards and be optimized for Google News featuring.

SOURCE MATERIAL:
HEADLINE: "${article.title}"
DESCRIPTION: ${article.description}
PUBLISHED: ${article.pubDate}
SOURCE URL: ${article.link}
${article.category && article.category.length > 0 ? `TOPICS: ${article.category.join(', ')}` : ''}

REQUIREMENTS:
- 1200-1800 words of sophisticated, analytical journalism
- Harvard-level vocabulary and prose
- 2-3 expert quotes or perspectives
- Data-driven insights with specific figures
- Multiple angles of analysis (market impact, broader implications, expert commentary)
- Completely original writing (never copy from source)
- Unique headline and angle
- E-E-A-T compliant throughout
- Google News optimized structure
- Credit Yahoo Finance as source while delivering proprietary analysis

Return ONLY valid JSON with no markdown formatting or additional text.`
              }
            ],
            temperature: 0.8,
            max_tokens: 6000,
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error('AI API error:', aiResponse.status, errorText);
          throw new Error(`AI generation failed: ${errorText}`);
        }

        const aiData = await aiResponse.json();
        let generatedContent = aiData.choices[0].message.content;
        
        // Strip markdown code blocks if present
        generatedContent = generatedContent.trim();
        if (generatedContent.startsWith('```json')) {
          generatedContent = generatedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (generatedContent.startsWith('```')) {
          generatedContent = generatedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        // Parse the JSON response
        let articleData;
        try {
          articleData = JSON.parse(generatedContent.trim());
        } catch (parseError) {
          console.error('Failed to parse AI response as JSON:', generatedContent);
          throw new Error('AI did not return valid JSON');
        }

        // ALWAYS prioritize real news images from web sources
        console.log('🔍 Searching for real news images from web sources...');
        let imageUrl = null;
        let imageCredit = null;

        try {
          const { data: imageData, error: imageError } = await supabase.functions.invoke('fetch-news-image', {
            body: { 
              topic: articleData.title,
              category: mapCategoryToCardinal(category)
            }
          });

          if (!imageError && imageData?.success) {
            imageUrl = imageData.imageUrl;
            imageCredit = imageData.imageCredit;
            console.log('✓ Real news image sourced:', imageCredit);
          } else {
            console.warn('⚠️ No suitable news image found - article will be saved without image to avoid AI-generated content');
            // DO NOT generate AI images - leave blank if no real image found
            imageUrl = null;
            imageCredit = null;
          }
        } catch (imageError) {
          console.error('Image fetch failed:', imageError);
          imageUrl = null;
          imageCredit = null;
        }

        // Calculate read time and word count
        const wordCount = articleData.content.split(/\s+/).length;
        const readTime = `${Math.max(1, Math.round(wordCount / 200))} min read`;

        // Prepare article data with AI-generated content
        const now = new Date().toISOString();
        const insertData = {
          title: articleData.title,
          slug: slug,
          excerpt: articleData.excerpt,
          content: articleData.content,
          category: mapCategoryToCardinal(category),
          author: 'Hunain Qureshi',
          tags: articleData.tags || article.category || ['finance', 'business'],
          meta_title: articleData.metaTitle,
          meta_description: articleData.metaDescription,
          meta_keywords: articleData.metaKeywords || ['finance', 'business', 'yahoo finance'],
          og_title: articleData.metaTitle,
          og_description: articleData.metaDescription,
          og_image: imageUrl,
          status: 'draft',
          published_at: null,
          sources: [
            {
              name: 'Yahoo Finance',
              url: article.link,
              date: article.pubDate
            }
          ],
          news_keywords: articleData.metaKeywords || article.category,
          read_time: readTime,
          word_count: wordCount,
          image_url: imageUrl,
          featured_image: imageUrl,
          image_credit: imageCredit,
        };

        // Insert article
        const { data: inserted, error } = await supabase
          .from('articles')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error(`Error inserting article: ${error.message}`);
          continue;
        }

        console.log(`✓ Article published successfully: ${inserted.id}`);
        importedArticles.push(inserted);
      } catch (error) {
        console.error(`Error processing article: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported: importedArticles.length,
        total: articles.length,
        articles: importedArticles,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in import-yahoo-finance function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function parseRSSFeed(xml: string, limit: number): YahooFinanceArticle[] {
  const articles: YahooFinanceArticle[] = [];
  
  // Extract items using regex (simple parser for RSS)
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const matches = xml.matchAll(itemRegex);

  let count = 0;
  for (const match of matches) {
    if (count >= limit) break;
    
    const itemXml = match[1];
    
    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link');
    const pubDate = extractTag(itemXml, 'pubDate');
    const description = extractTag(itemXml, 'description');
    const guid = extractTag(itemXml, 'guid');
    
    // Extract categories
    const categoryMatches = itemXml.matchAll(/<category>(.*?)<\/category>/g);
    const categories = Array.from(categoryMatches, m => m[1]);

    if (title && link) {
      articles.push({
        title: cleanText(title),
        link: cleanText(link),
        pubDate: cleanText(pubDate),
        description: cleanText(description),
        guid: cleanText(guid),
        category: categories.length > 0 ? categories : undefined,
        source: 'Yahoo Finance',
      });
      count++;
    }
  }

  return articles;
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : '';
}

function cleanText(text: string): string {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function generateSlug(title: string): string {
  const randomId = Math.random().toString(36).substring(2, 8);
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50) + `-${randomId}`;
}

function mapCategoryToCardinal(yahooCategory: string): string {
  const mapping: Record<string, string> = {
    'finance': 'business',
    'stocks': 'business',
    'crypto': 'technology',
    'economy': 'business',
    'earnings': 'business',
  };
  
  return mapping[yahooCategory] || 'business';
}
